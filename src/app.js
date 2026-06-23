import express from 'express';

export const todos = [
  { id: 1, title: 'Review project requirements', completed: true },
  { id: 2, title: 'Implement minimal Express app', completed: true },
  { id: 3, title: 'Validate endpoints with tests', completed: false },
];

export function createApp() {
  const app = express();

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/todos', (_req, res) => {
    res.json({ todos });
  });

  return app;
}
