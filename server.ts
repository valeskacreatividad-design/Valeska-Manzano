import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'surveys.json');

app.use(express.json({ limit: '10mb' }));

// Ensure data folder and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface Question {
  id: string;
  text: string;
  type: string;
  required: boolean;
  options?: string[];
  minRating?: number;
  maxRating?: number;
  placeholder?: string;
}

interface Survey {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  adminKey: string;
  questions: Question[];
  active: boolean;
}

interface SurveyResponse {
  id: string;
  surveyId: string;
  submittedAt: string;
  respondentName?: string;
  answers: Record<string, any>;
}

interface DatabaseSchema {
  surveys: Record<string, Survey>;
  responses: Record<string, SurveyResponse[]>;
}

function getDatabase(): DatabaseSchema {
  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      surveys: {
        'demo-satisfaccion': {
          id: 'demo-satisfaccion',
          title: 'Encuesta de Satisfacción y Experiencia del Cliente',
          description: 'Agradecemos tu valiosa opinión sobre nuestros servicios. Tu respuesta nos ayuda a seguir mejorando.',
          createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
          adminKey: 'key_demo_satisfaccion',
          active: true,
          questions: [
            {
              id: 'q_calificacion',
              text: '¿Cómo calificarías tu experiencia general con nuestro servicio?',
              type: 'rating',
              required: true,
              minRating: 1,
              maxRating: 5,
            },
            {
              id: 'q_servicio',
              text: '¿Qué aspecto valoras más de nuestra atención?',
              type: 'radio',
              required: true,
              options: ['Rapidez de respuesta', 'Claridad de la información', 'Amabilidad del personal', 'Calidad del producto final'],
            },
            {
              id: 'q_canales',
              text: '¿A través de qué canales te gustaría recibir información?',
              type: 'checkbox',
              required: false,
              options: ['WhatsApp', 'Correo Electrónico', 'Llamada telefónica', 'Redes Sociales'],
            },
            {
              id: 'q_recomienda',
              text: '¿Recomendarías nuestros servicios a amigos o colegas?',
              type: 'yesno',
              required: true,
            },
            {
              id: 'q_comentarios',
              text: '¿Tienes alguna sugerencia adicional o comentario que desees compartir?',
              type: 'textarea',
              required: false,
              placeholder: 'Escribe aquí cualquier comentario...',
            },
          ],
        },
      },
      responses: {
        'demo-satisfaccion': [
          {
            id: 'resp_1',
            surveyId: 'demo-satisfaccion',
            submittedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
            respondentName: 'Carlos Mendoza',
            answers: {
              q_calificacion: 5,
              q_servicio: 'Rapidez de respuesta',
              q_canales: ['WhatsApp', 'Correo Electrónico'],
              q_recomienda: 'Sí',
              q_comentarios: 'Excelente atención, resolvieron mi consulta en menos de 10 minutos.',
            },
          },
          {
            id: 'resp_2',
            surveyId: 'demo-satisfaccion',
            submittedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
            respondentName: 'María Fernanda Ruiz',
            answers: {
              q_calificacion: 4,
              q_servicio: 'Calidad del producto final',
              q_canales: ['WhatsApp'],
              q_recomienda: 'Sí',
              q_comentarios: 'Muy buen servicio, seguiré contando con ustedes para futuros proyectos.',
            },
          },
          {
            id: 'resp_3',
            surveyId: 'demo-satisfaccion',
            submittedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
            respondentName: 'Jorge Alarcón',
            answers: {
              q_calificacion: 5,
              q_servicio: 'Amabilidad del personal',
              q_canales: ['Correo Electrónico', 'Redes Sociales'],
              q_recomienda: 'Sí',
              q_comentarios: 'El equipo fue muy atento durante todo el proceso de entrega.',
            },
          },
          {
            id: 'resp_4',
            surveyId: 'demo-satisfaccion',
            submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            respondentName: 'Lucía Benítez',
            answers: {
              q_calificacion: 4,
              q_servicio: 'Claridad de la información',
              q_canales: ['WhatsApp', 'Redes Sociales'],
              q_recomienda: 'Sí',
              q_comentarios: 'Todo muy transparente y bien explicado.',
            },
          },
        ],
      },
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database file:', err);
    return { surveys: {}, responses: {} };
  }
}

function saveDatabase(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database file:', err);
  }
}

// API Routes

// 1. Get all surveys summary
app.get('/api/surveys', (_req, res) => {
  const db = getDatabase();
  const list = Object.values(db.surveys).map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    createdAt: s.createdAt,
    questionsCount: s.questions.length,
    responseCount: (db.responses[s.id] || []).length,
    active: s.active,
  }));
  res.json(list.reverse());
});

// 2. Create survey
app.post('/api/surveys', (req, res) => {
  const { title, description, questions } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'El título de la encuesta es obligatorio.' });
  }

  const id = 'enc_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const adminKey = 'adm_' + Math.random().toString(36).substring(2, 10);

  const formattedQuestions: Question[] = (questions || []).map((q: any, idx: number) => ({
    id: q.id || `q_${idx + 1}_${Date.now()}`,
    text: q.text || `Pregunta ${idx + 1}`,
    type: q.type || 'text',
    required: Boolean(q.required),
    options: Array.isArray(q.options) ? q.options.filter(Boolean) : [],
    minRating: q.minRating || 1,
    maxRating: q.maxRating || 5,
    placeholder: q.placeholder || '',
  }));

  const newSurvey: Survey = {
    id,
    title: title.trim(),
    description: (description || '').trim(),
    createdAt: new Date().toISOString(),
    adminKey,
    questions: formattedQuestions,
    active: true,
  };

  const db = getDatabase();
  db.surveys[id] = newSurvey;
  db.responses[id] = [];
  saveDatabase(db);

  res.status(201).json(newSurvey);
});

// 3. Get specific survey
app.get('/api/surveys/:id', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  const survey = db.surveys[id];

  if (!survey) {
    return res.status(404).json({ error: 'Encuesta no encontrada.' });
  }

  const respCount = (db.responses[id] || []).length;
  res.json({
    ...survey,
    responseCount: respCount,
  });
});

// 4. Update survey status or questions
app.put('/api/surveys/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, active, questions } = req.body;
  const db = getDatabase();
  const survey = db.surveys[id];

  if (!survey) {
    return res.status(404).json({ error: 'Encuesta no encontrada.' });
  }

  if (title !== undefined) survey.title = title;
  if (description !== undefined) survey.description = description;
  if (active !== undefined) survey.active = active;
  if (questions !== undefined) survey.questions = questions;

  saveDatabase(db);
  res.json(survey);
});

// 5. Delete survey
app.delete('/api/surveys/:id', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();

  if (!db.surveys[id]) {
    return res.status(404).json({ error: 'Encuesta no encontrada.' });
  }

  delete db.surveys[id];
  delete db.responses[id];
  saveDatabase(db);

  res.json({ success: true, message: 'Encuesta eliminada correctamente.' });
});

// 6. Submit response (Public for ANY respondent from any phone/pc!)
app.post('/api/surveys/:id/responses', (req, res) => {
  const { id } = req.params;
  const { answers, respondentName } = req.body;
  const db = getDatabase();
  const survey = db.surveys[id];

  if (!survey) {
    return res.status(404).json({ error: 'La encuesta no existe o fue eliminada.' });
  }

  if (!survey.active) {
    return res.status(403).json({ error: 'Esta encuesta se encuentra cerrada o pausada por el administrador.' });
  }

  // Validate required questions
  for (const q of survey.questions) {
    if (q.required) {
      const val = answers ? answers[q.id] : undefined;
      const isEmpty =
        val === undefined ||
        val === null ||
        val === '' ||
        (Array.isArray(val) && val.length === 0);
      if (isEmpty) {
        return res.status(400).json({ error: `La pregunta "${q.text}" es obligatoria.` });
      }
    }
  }

  const responseId = 'resp_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
  const newResponse: SurveyResponse = {
    id: responseId,
    surveyId: id,
    submittedAt: new Date().toISOString(),
    respondentName: respondentName ? String(respondentName).trim() : undefined,
    answers: answers || {},
  };

  if (!db.responses[id]) {
    db.responses[id] = [];
  }
  db.responses[id].push(newResponse);
  saveDatabase(db);

  res.status(201).json({
    success: true,
    message: 'Respuesta registrada exitosamente.',
    responseId,
    submittedAt: newResponse.submittedAt,
  });
});

// 7. Get all responses for a survey (For survey administrator)
app.get('/api/surveys/:id/responses', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  const survey = db.surveys[id];

  if (!survey) {
    return res.status(404).json({ error: 'Encuesta no encontrada.' });
  }

  const responses = db.responses[id] || [];
  res.json({
    survey,
    responses: responses.slice().reverse(),
    total: responses.length,
  });
});

// 8. Delete a single response
app.delete('/api/surveys/:id/responses/:responseId', (req, res) => {
  const { id, responseId } = req.params;
  const db = getDatabase();

  if (!db.responses[id]) {
    return res.status(404).json({ error: 'Encuesta no encontrada.' });
  }

  const before = db.responses[id].length;
  db.responses[id] = db.responses[id].filter((r) => r.id !== responseId);

  if (db.responses[id].length === before) {
    return res.status(404).json({ error: 'Respuesta no encontrada.' });
  }

  saveDatabase(db);
  res.json({ success: true, message: 'Respuesta eliminada.' });
});

// 9. Server-side Excel export download endpoint
app.get('/api/surveys/:id/export/xlsx', (req, res) => {
  const { id } = req.params;
  const db = getDatabase();
  const survey = db.surveys[id];

  if (!survey) {
    return res.status(404).send('Encuesta no encontrada');
  }

  const responses = db.responses[id] || [];

  const wb = XLSX.utils.book_new();

  // Sheet 1: Detailed
  const rows = responses.map((resp, idx) => {
    const row: Record<string, any> = {
      '#': idx + 1,
      'ID de Respuesta': resp.id,
      'Fecha y Hora': new Date(resp.submittedAt).toLocaleString('es-ES'),
      'Encuestado': resp.respondentName || '(Anónimo)',
    };
    survey.questions.forEach((q) => {
      const val = resp.answers[q.id];
      if (Array.isArray(val)) {
        row[q.text] = val.join(', ');
      } else {
        row[q.text] = val !== undefined ? val : '';
      }
    });
    return row;
  });

  const wsDetailed = XLSX.utils.json_to_sheet(rows.length ? rows : [{ '#': 0, 'Estado': 'Sin respuestas' }]);
  XLSX.utils.book_append_sheet(wb, wsDetailed, 'Respuestas');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const safeTitle = survey.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);

  res.setHeader('Content-Disposition', `attachment; filename="Encuesta_${safeTitle}.xlsx"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
});

// Vite or Static Production middleware
async function setupServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
});
