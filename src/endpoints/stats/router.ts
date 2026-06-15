// src/endpoints/stats/router.ts
import { Hono } from 'hono';
import { HonoEnv } from '../../types';

export const statsRouter = new Hono<HonoEnv>();

// GET /api/events/:eventId/stats (public)
statsRouter.get('/', async (c) => {
  const eventId = Number(c.req.param('eventId'));

  const stats = await c.env.DB.prepare('SELECT * FROM event_stats WHERE event_id = ?').bind(eventId).first<any>();
  const days = await c.env.DB.prepare('SELECT COUNT(*) as count FROM agenda_days WHERE event_id = ?').bind(eventId).first<any>();
  const speakers = await c.env.DB.prepare('SELECT COUNT(*) as count FROM speakers WHERE event_id = ? AND is_surprise = 0').bind(eventId).first<any>();

  return c.json({
    success: true,
    data: {
      total_registrations: stats?.total_registrations || 0,
      approved_count: stats?.approved_count || 0,
      startup_count: stats?.startup_count || 0,
      speaker_count: speakers?.count || 0,
      days_count: days?.count || 0,
    }
  });
});

// GET /api/events/:eventId/stats/admin – detailed breakdown (admin)
statsRouter.get('/admin', async (c) => {
  const eventId = Number(c.req.param('eventId'));

  const byStatus = await c.env.DB.prepare(
    "SELECT status, COUNT(*) as count FROM registrations WHERE event_id = ? GROUP BY status"
  ).bind(eventId).all();

  const byType = await c.env.DB.prepare(
    "SELECT reg_type, COUNT(*) as count FROM registrations WHERE event_id = ? GROUP BY reg_type"
  ).bind(eventId).all();

  const byCity = await c.env.DB.prepare(
    "SELECT city, COUNT(*) as count FROM registrations WHERE event_id = ? AND city IS NOT NULL GROUP BY city ORDER BY count DESC LIMIT 10"
  ).bind(eventId).all();

  const recent = await c.env.DB.prepare(
    "SELECT full_name, email, reg_type, status, created_at FROM registrations WHERE event_id = ? ORDER BY created_at DESC LIMIT 5"
  ).bind(eventId).all();

  return c.json({
    success: true,
    data: { byStatus: byStatus.results, byType: byType.results, byCity: byCity.results, recent: recent.results }
  });
});
