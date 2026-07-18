import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini SDK client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Event Planning API endpoint
app.post("/api/gemini/assist", async (req, res) => {
  const { category, title, description, theme, budget, type } = req.body;

  if (!category || !title) {
    return res.status(400).json({ error: "Faltan campos obligatorios: categoría y título." });
  }

  try {
    const ai = getGeminiClient();
    const model = "gemini-3.5-flash";

    let systemInstruction = "Eres un planificador de eventos experto y profesional con años de experiencia.";
    let prompt = "";
    let responseSchema: any = null;

    if (type === "ideas") {
      prompt = `Genera ideas creativas y detalladas de planificación para el siguiente evento:
- Tipo de evento / Categoría: ${category}
- Título: ${title}
- Descripción: ${description || "Sin descripción"}
- Tema de interés: ${theme || "General"}
- Presupuesto objetivo: $${budget || "No definido"}

Por favor, proporciona ideas de decoración, opciones de comida/bebida (catering) y actividades de entretenimiento/programa adecuadas para este evento.`;

      responseSchema = {
        type: Type.OBJECT,
        properties: {
          themeIdea: {
            type: Type.STRING,
            description: "Una propuesta conceptual inspiradora para el tema del evento.",
          },
          decorIdeas: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3 ideas de decoración temáticas y elegantes.",
          },
          cateringIdeas: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3 sugerencias culinarias, bocadillos o bebidas perfectas para el perfil del evento.",
          },
          entertainmentIdeas: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3 ideas de entretenimiento, juegos, dinámicas o música de fondo.",
          }
        },
        required: ["themeIdea", "decorIdeas", "cateringIdeas", "entertainmentIdeas"],
      };

    } else if (type === "itinerary") {
      prompt = `Diseña un itinerario o cronograma estructurado de actividades de un día para el siguiente evento:
- Categoría: ${category}
- Título: ${title}
- Descripción: ${description || "Sin descripción"}
- Tema: ${theme || "General"}

Crea entre 4 y 7 actividades/hitos temporales organizados lógicamente de principio a fin, cada uno con una hora exacta (en formato de 24 horas, e.g. "14:00", "18:30") y descripción breve del hito.`;

      responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            time: {
              type: Type.STRING,
              description: "Hora del hito en formato HH:MM (e.g. '19:30', '21:00').",
            },
            title: {
              type: Type.STRING,
              description: "Nombre corto del hito o actividad.",
            },
            description: {
              type: Type.STRING,
              description: "Detalle o acción de lo que ocurre en este horario.",
            }
          },
          required: ["time", "title", "description"],
        },
        description: "Lista de actividades del itinerario ordenadas por hora.",
      };

    } else if (type === "checklist") {
      prompt = `Genera una lista de tareas recomendadas o checklist de organización previa para el siguiente evento:
- Categoría: ${category}
- Título: ${title}
- Descripción: ${description || "Sin descripción"}

Genera entre 6 y 10 tareas indispensables, categorizándolas en rubros como "Logística", "Comida", "Invitaciones", "Decoración", o "Otros".`;

      responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Descripción corta de la tarea o acción a realizar.",
            },
            category: {
              type: Type.STRING,
              description: "Categoría de la tarea (e.g. 'Logística', 'Comida', 'Decoración', 'Invitaciones', 'Entretenimiento').",
            }
          },
          required: ["title", "category"],
        },
        description: "Lista de tareas preventivas recomendadas.",
      };

    } else if (type === "budget") {
      prompt = `Sugiere una distribución estimada de presupuesto o gastos estimados basada en el presupuesto total de $${budget || 1000} para el siguiente evento:
- Categoría: ${category}
- Título: ${title}
- Descripción: ${description || "Sin descripción"}

Distribuye el presupuesto total en 4 a 6 conceptos de gastos realistas (como alquiler de espacio, comida, sonido, adornos), asignándoles un costo estimado que sumado no supere el presupuesto total.`;

      responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: "Categoría del gasto (e.g. 'Lugar', 'Comida y Bebida', 'Decoración', 'Música y Sonido', 'Regalos').",
            },
            description: {
              type: Type.STRING,
              description: "Detalle de lo que incluye este concepto de gasto.",
            },
            cost: {
              type: Type.INTEGER,
              description: "Costo estimado entero en dólares.",
            }
          },
          required: ["category", "description", "cost"],
        },
        description: "Distribución del presupuesto recomendada.",
      };
    } else {
      return res.status(400).json({ error: "Tipo de asistencia inválida." });
    }

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No se recibió respuesta del modelo Gemini.");
    }

    const result = JSON.parse(text.trim());
    return res.json(result);

  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    return res.status(500).json({
      error: "Ocurrió un error al procesar la sugerencia de IA.",
      details: error.message || error,
    });
  }
});

// Serve frontend application
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on port ${PORT}`);
  });
}

start();
