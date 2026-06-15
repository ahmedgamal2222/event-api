// src/endpoints/agenda/router.ts
import { Hono } from 'hono';
import { HonoEnv } from '../../types';
import { requireAdmin } from '../../middleware/auth';

export const agendaRouter = new Hono<HonoEnv>();

// GET /api/events/:eventId/agenda  – full agenda with days + sessions (public)
agendaRouter.get('/', async (c) => {
  const eventId = Number(c.req.param('eventId'));

  const { results: days } = await c.env.DB.prepare(
    'SELECT * FROM agenda_days WHERE event_id = ? ORDER BY day_number ASC'
  ).bind(eventId).all();

  const { results: sessions } = await c.env.DB.prepare(
    `SELECT s.*, sp.name_ar as speaker_name, sp.title_ar as speaker_title, sp.company as speaker_company, sp.photo_url as speaker_photo
     FROM agenda_sessions s
     LEFT JOIN speakers sp ON s.speaker_id = sp.id
     WHERE s.event_id = ?
     ORDER BY s.sort_order ASC`
  ).bind(eventId).all();

  const agenda = days.map((day: any) => ({
    ...day,
    sessions: sessions.filter((s: any) => s.day_id === day.id)
  }));

  return c.json({ success: true, data: agenda });
});

// POST /api/events/:eventId/agenda/days (admin)
agendaRouter.post('/days', requireAdmin, async (c) => {
  const eventId = Number(c.req.param('eventId'));
  const body = await c.req.json().catch(() => null);
  if (!body?.day_number) return c.json({ success: false, error: 'day_number required' }, 400);

  const result = await c.env.DB.prepare(
    'INSERT INTO agenda_days (event_id, day_number, date, label, label_en) VALUES (?,?,?,?,?)'
  ).bind(eventId, body.day_number, body.date || null, body.label || null, body.label_en || null).run();

  return c.json({ success: true, data: { id: result.meta.last_row_id } }, 201);
});

// PUT /api/events/:eventId/agenda/days/:id (admin)
agendaRouter.put('/days/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ success: false, error: 'Body required' }, 400);

  await c.env.DB.prepare(
    'UPDATE agenda_days SET date = COALESCE(?, date), label = COALESCE(?, label), label_en = COALESCE(?, label_en) WHERE id = ?'
  ).bind(body.date || null, body.label || null, body.label_en || null, id).run();

  return c.json({ success: true });
});

// POST /api/events/:eventId/agenda/sessions (admin)
agendaRouter.post('/sessions', requireAdmin, async (c) => {
  const eventId = Number(c.req.param('eventId'));
  const body = await c.req.json().catch(() => null);
  if (!body?.day_id || !body?.time_start || !body?.title_ar) {
    return c.json({ success: false, error: 'day_id, time_start, title_ar required' }, 400);
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO agenda_sessions
      (event_id, day_id, speaker_id, time_start, time_end, title, title_ar,
       description, description_ar, session_type, location, sort_order)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    eventId, body.day_id,
    body.speaker_id || null,
    body.time_start, body.time_end || null,
    body.title || body.title_ar, body.title_ar,
    body.description || null, body.description_ar || null,
    body.session_type || 'talk', body.location || null,
    body.sort_order ?? 0
  ).run();

  return c.json({ success: true, data: { id: result.meta.last_row_id } }, 201);
});

// PUT /api/events/:eventId/agenda/sessions/:id (admin)
agendaRouter.put('/sessions/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'));
  const eventId = Number(c.req.param('eventId'));
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ success: false, error: 'Body required' }, 400);

  await c.env.DB.prepare(
    `UPDATE agenda_sessions SET
      day_id = COALESCE(?, day_id), speaker_id = COALESCE(?, speaker_id),
      time_start = COALESCE(?, time_start), time_end = COALESCE(?, time_end),
      title = COALESCE(?, title), title_ar = COALESCE(?, title_ar),
      description = COALESCE(?, description), description_ar = COALESCE(?, description_ar),
      session_type = COALESCE(?, session_type), location = COALESCE(?, location),
      sort_order = COALESCE(?, sort_order)
     WHERE id = ? AND event_id = ?`
  ).bind(
    body.day_id || null, body.speaker_id ?? null,
    body.time_start || null, body.time_end || null,
    body.title || null, body.title_ar || null,
    body.description || null, body.description_ar || null,
    body.session_type || null, body.location || null,
    body.sort_order ?? null,
    id, eventId
  ).run();

  return c.json({ success: true });
});

// DELETE /api/events/:eventId/agenda/sessions/:id (admin)
agendaRouter.delete('/sessions/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'));
  const eventId = Number(c.req.param('eventId'));
  await c.env.DB.prepare('DELETE FROM agenda_sessions WHERE id = ? AND event_id = ?').bind(id, eventId).run();
  return c.json({ success: true });
});
