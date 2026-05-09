import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import routes from './routes/index';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

const isProduction = process.env.NODE_ENV === 'production';

app.use(
  cors(
    isProduction
      ? { origin: false }
      : { origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }
  )
);
app.use(express.json({ limit: '10mb' }));

// Serve uploaded screenshots
const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR ?? './uploads');
app.use('/uploads', express.static(uploadDir));

// API routes
app.use('/api', routes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend in production
const frontendDist = path.join(__dirname, '../../frontend/dist');
const indexHtml = path.join(frontendDist, 'index.html');
console.log(`Frontend dist path: ${frontendDist} (exists: ${fs.existsSync(frontendDist)})`);

if (fs.existsSync(indexHtml)) {
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => res.sendFile(indexHtml));
} else {
  app.get('*', (_req, res) => res.status(503).send('Frontend not built'));
}

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Trading Journal API running on http://localhost:${PORT}`);
});
