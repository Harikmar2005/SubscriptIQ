import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Health route
  app.get('/api/healthz', (req, res) => {
    res.json({
      status: 'healthy',
      engine: 'SubscriptIQ Enterprise Full-Stack SaaS',
      version: '2.4.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount Vite development middlewares
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`SubscriptIQ Enterprise running at http://0.0.0.0:${port}`);
  });
}

// Only execute when started directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
  });
}
