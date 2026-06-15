// src/index.ts – Event Management API
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HonoEnv } from './types';
import { authRouter } from './endpoints/auth/router';
import { eventsRouter } from './endpoints/events/router';
import { speakersRouter } from './endpoints/speakers/router';
import { agendaRouter } from './endpoints/agenda/router';
import { registrationsRouter } from './endpoints/registrations/router';
import { statsRouter } from './endpoints/stats/router';
import { sponsorsRouter } from './endpoints/sponsors/router';
import { faqsRouter } from './endpoints/faqs/router';

const app = new Hono<HonoEnv>();

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'https://event-web.pages.dev'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/', (c) => c.json({ success: true, service: 'Event Management API', version: '1.0.0' }));

// ─── Auth ──────────────────────────────────────────────────────────────────────
app.route('/api/auth', authRouter);

// ─── Events ───────────────────────────────────────────────────────────────────
app.route('/api/events', eventsRouter);

// ─── Per-event sub-resources ──────────────────────────────────────────────────
// These are mounted under /api/events/:eventId/...
const eventSubApp = new Hono<HonoEnv & { Variables: { eventId: number } }>();

eventSubApp.use('*', async (c, next) => {
  // eventId is already in the URL param; just forward
  await next();
});

app.route('/api/events/:eventId/speakers',      speakersRouter);
app.route('/api/events/:eventId/agenda',        agendaRouter);
app.route('/api/events/:eventId/registrations', registrationsRouter);
app.route('/api/events/:eventId/stats',         statsRouter);
app.route('/api/events/:eventId/sponsors',      sponsorsRouter);
app.route('/api/events/:eventId/faqs',          faqsRouter);

// ─── Admin: bulk stats for all events ────────────────────────────────────────
app.get('/api/admin/overview', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return c.json({ success: false, error: 'Unauthorized' }, 401);

  const { verifyToken } = await import('./utils/auth');
  const payload = await verifyToken(authHeader.slice(7), c.env.JWT_SECRET);
  if (!payload) return c.json({ success: false, error: 'Unauthorized' }, 401);

  const events = await c.env.DB.prepare(
    'SELECT id, name_ar, start_date, end_date, status FROM events ORDER BY start_date DESC'
  ).all();

  const regs = await c.env.DB.prepare(
    "SELECT event_id, COUNT(*) as count FROM registrations GROUP BY event_id"
  ).all();

  return c.json({ success: true, data: { events: events.results, registrations: regs.results } });
});

export default app;
