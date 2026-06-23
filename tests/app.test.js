import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp, todos } from '../src/app.js';

describe('Express app', () => {
  it('returns ok from GET /health', async () => {
    const app = createApp();

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('returns at least three todo items from GET /api/todos', async () => {
    const app = createApp();

    const response = await request(app).get('/api/todos');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.todos)).toBe(true);
    expect(response.body.todos).toHaveLength(todos.length);
    expect(response.body.todos.length).toBeGreaterThanOrEqual(3);
    expect(response.body.todos[0]).toHaveProperty('title');
    expect(response.body.todos[1]).toHaveProperty('title');
    expect(response.body.todos[2]).toHaveProperty('title');
  });
});
