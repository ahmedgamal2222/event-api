// src/endpoints/sponsors/router.ts
import { Hono } from 'hono';
import { HonoEnv } from '../../types';
import { requireAdmin } from '../../middleware/auth';

export const sponsorsRouter = new Hono<HonoEnv>();

// GET /api/events/:eventId/sponsors (public)
sponsorsRouter.get('/', async (c) => {
  const eventId = Number(c.req.param('eventId'));
  const { results } = await c.env.DB.prepare(
    'SELECT id, name, logo_url, website, tier, sort_order FROM sponsors WHERE event_id = ? ORDER BY sort_order ASC'
  ).bind(eventId).all();
  return c.json({ success: true, data: results });
});

// POST /api/events/:eventId/sponsors (admin)
sponsorsRouter.post('/', requireAdmin, async (c) => {
  const eventId = Number(c.req.param('eventId'));
  const body = await c.req.json().catch(() => null);
  if (!body?.name) return c.json({ success: false, error: 'name required' }, 400);

  const result = await c.env.DB.prepare(
    'INSERT INTO sponsors (event_id, name, logo_url, website, tier, sort_order) VALUES (?,?,?,?,?,?)'
  ).bind(eventId, body.name, body.logo_url || null, body.website || null, body.tier || 'silver', body.sort_order ?? 0).run();

  return c.json({ success: true, data: { id: result.meta.last_row_id } }, 201);
});

// PUT /api/events/:eventId/sponsors/:id (admin)
sponsorsRouter.put('/:id', requireAdmin, async (c) => {
  const id = Number(c.req.param('id'));
  const eventId = Number(c.req.param('eventId'));
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ success: false, error: 'Body required' }, 400);

  await c.env.DB.prepare(
    'UPDATE sponsors SET name = COALESCE(?, name), logo_url = COALESCE(?, logo_url), website = COALESCE(?, website), tier = COALESCE(?, tier), sort_order = COALESCE(?, sort_order) WHERE id = ? AND event_id = ?'
  ).bind(body.name || null, body.logo_url || null, body.website || null, body.tier || null, body.sort_order ?? null, id, eventId).run();

  return c.json({ success: true });
});

// DELETE /api/events/:eventId/sponsors/:id (admin)
sponsorsRouter.delete('/:id', requireAdmin, async (c) => {
  await c.env.DB.prepare('DELETE FROM sponsors WHERE id = ? AND event_id = ?')
    .bind(Number(c.req.param('id')), Number(c.req.param('eventId'))).run();
  return c.json({ success: true });
});
