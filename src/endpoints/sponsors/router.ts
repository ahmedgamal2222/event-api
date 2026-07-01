// src/endpoints/sponsors/router.ts
import { Hono } from 'hono';
import { HonoEnv } from '../../types';
import { requireAdmin } from '../../middleware/auth';

export const sponsorsRouter = new Hono<HonoEnv>();

// GET /api/events/:eventId/sponsors (public)
sponsorsRouter.get('/', async (c) => {
  try {
    const eventId = Number(c.req.param('eventId'));
    const { results } = await c.env.DB.prepare(
      'SELECT id, name, logo_url, website, tier, sort_order FROM sponsors WHERE event_id = ? ORDER BY sort_order ASC'
    ).bind(eventId).all();
    return c.json({ success: true, data: results });
  } catch (error: any) {
    console.error('GET /sponsors error:', error);
    return c.json({ success: false, error: error?.message || 'Server error' }, 500);
  }
});

// POST /api/events/:eventId/sponsors (admin)
sponsorsRouter.post('/', requireAdmin, async (c) => {
  try {
    const eventId = Number(c.req.param('eventId'));
    const body = await c.req.json().catch(() => null);
    if (!body?.name) return c.json({ success: false, error: 'name required' }, 400);

    const result = await c.env.DB.prepare(
      'INSERT INTO sponsors (event_id, name, logo_url, website, tier, sort_order) VALUES (?,?,?,?,?,?)'
    ).bind(eventId, body.name, body.logo_url || null, body.website || null, body.tier || 'silver', body.sort_order ?? 0).run();

    return c.json({ success: true, data: { id: result.meta.last_row_id } }, 201);
  } catch (error: any) {
    console.error('POST /sponsors error:', error);
    return c.json({ success: false, error: error?.message || 'Server error' }, 500);
  }
});

// PUT /api/events/:eventId/sponsors/:id (admin)
sponsorsRouter.put('/:id', requireAdmin, async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const eventId = Number(c.req.param('eventId'));
    const body = await c.req.json().catch(() => null);
    if (!body) return c.json({ success: false, error: 'Body required' }, 400);

    // Get existing sponsor to check for old logo_url
    const existing: any = await c.env.DB.prepare(
      `SELECT logo_url FROM sponsors WHERE id = ? AND event_id = ?`
    ).bind(id, eventId).first();

    if (!existing) return c.json({ success: false, error: 'Sponsor not found' }, 404);

    // If logo is changed and old logo exists, delete it from R2
    if (existing.logo_url && body.logo_url !== existing.logo_url) {
      try {
        const url = new URL(existing.logo_url);
        const filename = url.pathname.split('/').pop();
        if (filename) {
          await c.env.BUCKET.delete(filename);
        }
      } catch (e: any) {
        console.error('Failed to delete old logo from R2:', e);
      }
    }

    // Allow empty/null logo_url to clear it
    const logoUrl = body.logo_url === '' ? null : (body.logo_url || null);

    await c.env.DB.prepare(
      'UPDATE sponsors SET name = COALESCE(?, name), logo_url = ?, website = COALESCE(?, website), tier = COALESCE(?, tier), sort_order = COALESCE(?, sort_order) WHERE id = ? AND event_id = ?'
    ).bind(body.name || null, logoUrl, body.website || null, body.tier || null, body.sort_order ?? null, id, eventId).run();

    return c.json({ success: true });
  } catch (error: any) {
    console.error('PUT /sponsors/:id error:', error);
    return c.json({ success: false, error: error?.message || 'Server error' }, 500);
  }
});

// DELETE /api/events/:eventId/sponsors/:id (admin)
sponsorsRouter.delete('/:id', requireAdmin, async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const eventId = Number(c.req.param('eventId'));
    const result = await c.env.DB.prepare('DELETE FROM sponsors WHERE id = ? AND event_id = ?')
      .bind(id, eventId).run();
    
    if (!result.meta.changes) {
      return c.json({ success: false, error: 'Sponsor not found' }, 404);
    }
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /sponsors/:id error:', error);
    return c.json({ success: false, error: error?.message || 'Server error' }, 500);
  }
});
