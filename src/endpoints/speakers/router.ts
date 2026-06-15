// src/endpoints/speakers/router.ts
import { Hono } from 'hono';
import { HonoEnv } from '../../types';
import { requireAdmin } from '../../middleware/auth';

export const speakersRouter = new Hono<HonoEnv>();

// GET /api/events/:eventId/speakers (public)
speakersRouter.get('/', async (c) => {
  const eventId = Number(c.req.param('eventId'));
  const { results } = await c.env.DB.prepare(
    `SELECT id, name, name_ar, title, title_ar, company, bio_ar, photo_url, sort_order, is_featured, is_surprise
     FROM speakers WHERE event_id = ? ORDER BY sort_order ASC`
  ).bind(eventId).all();
  return c.json({ success: true, data: results });
});

// POST /api/events/:eventId/speakers (admin)
speakersRouter.post('/', requireAdmin, async (c) => {
  const eventId = Number(c.req.param('eventId'));
  const body = await c.req.json().catch(() => null);
  if (!body?.name) return c.json({ success: false, error: 'name required' }, 400);

  const result = await c.env.DB.prepare(
    `INSERT INTO speakers (event_id, name, name_ar, title, title_ar, company, bio, bio_ar, photo_url, sort_order, is_featured, is_surprise)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    eventId, body.name, body.name_ar || null,
    body.title || null, body.title_ar || null,
    body.company || null, body.bio || null, body.bio_ar || null,
    body.photo_url || null, body.sort_order ?? 0,
    body.is_featured ? 1 : 0, body.is_surprise ? 1 : 0
  ).run();

  return c.json({ success: true, data: { id: result.meta.last_row_id } }, 201);
});

// PUT /api/events/:eventId/speakers/:id (admin)
speakersRouter.put('/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'));
  const eventId = Number(c.req.param('eventId'));
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ success: false, error: 'Body required' }, 400);

  await c.env.DB.prepare(
    `UPDATE speakers SET
      name = COALESCE(?, name), name_ar = COALESCE(?, name_ar),
      title = COALESCE(?, title), title_ar = COALESCE(?, title_ar),
      company = COALESCE(?, company), bio = COALESCE(?, bio), bio_ar = COALESCE(?, bio_ar),
      photo_url = COALESCE(?, photo_url), sort_order = COALESCE(?, sort_order),
      is_featured = COALESCE(?, is_featured), is_surprise = COALESCE(?, is_surprise)
     WHERE id = ? AND event_id = ?`
  ).bind(
    body.name || null, body.name_ar || null,
    body.title || null, body.title_ar || null,
    body.company || null, body.bio || null, body.bio_ar || null,
    body.photo_url || null, body.sort_order ?? null,
    body.is_featured != null ? (body.is_featured ? 1 : 0) : null,
    body.is_surprise != null ? (body.is_surprise ? 1 : 0) : null,
    id, eventId
  ).run();

  return c.json({ success: true });
});

// DELETE /api/events/:eventId/speakers/:id (admin)
speakersRouter.delete('/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'));
  const eventId = Number(c.req.param('eventId'));
  await c.env.DB.prepare('DELETE FROM speakers WHERE id = ? AND event_id = ?').bind(id, eventId).run();
  return c.json({ success: true });
});
