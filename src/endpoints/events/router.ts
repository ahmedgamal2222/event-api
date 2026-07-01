// src/endpoints/events/router.ts
import { Hono } from 'hono';
import { HonoEnv } from '../../types';
import { requireAdmin } from '../../middleware/auth';

export const eventsRouter = new Hono<HonoEnv>();

// GET /api/events – list published events (public)
eventsRouter.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT id, slug, name, name_ar, tagline, tagline_ar, description_ar,
              location_ar, country, city, start_date, end_date,
              cover_image, logo, primary_color, status, registration_open,
              max_attendees, email, twitter, instagram, linkedin
       FROM events WHERE status = 'published' ORDER BY start_date DESC`
    ).all();
    return c.json({ success: true, data: results });
  } catch (error: any) {
    console.error('GET /events error:', error);
    return c.json({ success: false, error: error?.message || 'Server error' }, 500);
  }
});

// GET /api/events/all – all events (admin)
eventsRouter.get('/all', requireAdmin, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM events ORDER BY start_date DESC'
    ).all();
    return c.json({ success: true, data: results });
  } catch (error: any) {
    console.error('GET /events/all error:', error);
    return c.json({ success: false, error: error?.message || 'Server error' }, 500);
  }
});

// GET /api/events/:slug – single event by slug (public)
eventsRouter.get('/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');
    const event = await c.env.DB.prepare('SELECT * FROM events WHERE slug = ?').bind(slug).first();
    if (!event) return c.json({ success: false, error: 'Event not found' }, 404);
    return c.json({ success: true, data: event });
  } catch (error: any) {
    console.error('GET /events/:slug error:', error);
    return c.json({ success: false, error: error?.message || 'Server error' }, 500);
  }
});

// POST /api/events – create event (admin)
eventsRouter.post('/', requireAdmin, async (c) => {
  try {
    const body = await c.req.json().catch(() => null);
    if (!body?.slug || !body?.name || !body?.start_date || !body?.end_date) {
      return c.json({ success: false, error: 'slug, name, start_date, end_date required' }, 400);
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO events (slug, name, name_ar, tagline, tagline_ar, description, description_ar,
        location, location_ar, country, city, start_date, end_date, cover_image, logo, primary_color,
        status, registration_open, max_attendees, email, twitter, instagram, linkedin)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      body.slug, body.name, body.name_ar || null, body.tagline || null, body.tagline_ar || null,
      body.description || null, body.description_ar || null,
      body.location || null, body.location_ar || null,
      body.country || 'Syria', body.city || null,
      body.start_date, body.end_date,
      body.cover_image || null, body.logo || null,
      body.primary_color || '#6C63FF',
      body.status || 'draft', body.registration_open ?? 1,
      body.max_attendees || null, body.email || null,
      body.twitter || null, body.instagram || null, body.linkedin || null
    ).run();

    return c.json({ success: true, data: { id: result.meta.last_row_id } }, 201);
  } catch (error: any) {
    console.error('POST /events error:', error);
    return c.json({ success: false, error: error?.message || 'Server error' }, 500);
  }
});

// PUT /api/events/:id – update event (admin)
eventsRouter.put('/:id', requireAdmin, async (c) => {
  try {
    const id = Number(c.req.param('id'));
    if (!id) return c.json({ success: false, error: 'Invalid event ID' }, 400);

    const body = await c.req.json().catch(() => null);
    if (!body) return c.json({ success: false, error: 'Body required' }, 400);

    // Check if event exists
    const existing = await c.env.DB.prepare('SELECT id FROM events WHERE id = ?').bind(id).first();
    if (!existing) return c.json({ success: false, error: 'Event not found' }, 404);

    // Prepare form_config and site_config as JSON strings
    let formConfigStr = null;
    let siteConfigStr = null;
    try {
      if (body.form_config) {
        formConfigStr = typeof body.form_config === 'string' ? body.form_config : JSON.stringify(body.form_config);
      }
      if (body.site_config) {
        siteConfigStr = typeof body.site_config === 'string' ? body.site_config : JSON.stringify(body.site_config);
      }
    } catch (e) {
      return c.json({ success: false, error: 'Invalid JSON in form_config or site_config' }, 400);
    }

    await c.env.DB.prepare(
      `UPDATE events SET
        name = COALESCE(?, name), name_ar = COALESCE(?, name_ar),
        tagline = COALESCE(?, tagline), tagline_ar = COALESCE(?, tagline_ar),
        description = COALESCE(?, description), description_ar = COALESCE(?, description_ar),
        location = COALESCE(?, location), location_ar = COALESCE(?, location_ar),
        country = COALESCE(?, country), city = COALESCE(?, city),
        start_date = COALESCE(?, start_date), end_date = COALESCE(?, end_date),
        cover_image = COALESCE(?, cover_image), logo = COALESCE(?, logo),
        primary_color = COALESCE(?, primary_color), status = COALESCE(?, status),
        registration_open = COALESCE(?, registration_open),
        max_attendees = COALESCE(?, max_attendees),
        email = COALESCE(?, email), twitter = COALESCE(?, twitter),
        instagram = COALESCE(?, instagram), linkedin = COALESCE(?, linkedin),
        form_config = COALESCE(?, form_config),
        site_config = COALESCE(?, site_config),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(
      body.name || null, body.name_ar || null,
      body.tagline || null, body.tagline_ar || null,
      body.description || null, body.description_ar || null,
      body.location || null, body.location_ar || null,
      body.country || null, body.city || null,
      body.start_date || null, body.end_date || null,
      body.cover_image || null, body.logo || null,
      body.primary_color || null, body.status || null,
      body.registration_open ?? null,
      body.max_attendees || null,
      body.email || null, body.twitter || null,
      body.instagram || null, body.linkedin || null,
      formConfigStr,
      siteConfigStr,
      id
    ).run();

    // Return updated event
    const updated = await c.env.DB.prepare('SELECT * FROM events WHERE id = ?').bind(id).first();
    return c.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('PUT /events/:id error:', error);
    return c.json({ success: false, error: error?.message || 'Server error' }, 500);
  }
});

// DELETE /api/events/:id (admin, super_admin only)
eventsRouter.delete('/:id', requireAdmin, async (c) => {
  try {
    const admin = c.get('admin') as any;
    if (admin.role !== 'super_admin') return c.json({ success: false, error: 'Forbidden' }, 403);
    
    const id = Number(c.req.param('id'));
    if (!id) return c.json({ success: false, error: 'Invalid event ID' }, 400);

    const result = await c.env.DB.prepare('DELETE FROM events WHERE id = ?').bind(id).run();
    
    if (!result.meta.changes) {
      return c.json({ success: false, error: 'Event not found' }, 404);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /events/:id error:', error);
    return c.json({ success: false, error: error?.message || 'Server error' }, 500);
  }
});
