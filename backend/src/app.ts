import cors from 'cors';
import express from 'express';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { apiRouter } from './routes/index.routes.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.status(200).json({ ok: true, message: 'api ok' });
});

app.get('/api', (_req, res) => {
  res.status(200).json({ ok: true, message: 'api ok' });
});

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, service: 'backend' });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true, service: 'backend', scope: 'api' });
});

app.use('/api', apiRouter);

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: 'Ruta no encontrada',
    method: req.method,
    path: req.originalUrl
  });
});

app.use(errorMiddleware);
