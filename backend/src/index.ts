import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
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
if (isProduction) {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Trading Journal API running on http://localhost:${PORT}`);
});
