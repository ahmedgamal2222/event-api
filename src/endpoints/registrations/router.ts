// src/endpoints/registrations/router.ts
import { Hono } from 'hono';
import { HonoEnv } from '../../types';
import { requireAdmin } from '../../middleware/auth';
import { generateTicketCode } from '../../utils/auth';

export const registrationsRouter = new Hono<HonoEnv>();

// POST /api/events/:eventId/registrations – public registration
registrationsRouter.post('/', async (c) => {
  try {
    const eventId = Number(c.req.param('eventId'));
    const body = await c.req.json().catch(() => null);

    if (!body?.full_name || !body?.email || !body?.reg_type) {
      return c.json({ success: false, error: 'full_name, email, reg_type required' }, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return c.json({ success: false, error: 'Invalid email format' }, 400);
    }

    // Check event exists and registration is open
    const event = await c.env.DB.prepare(
      'SELECT id, registration_open, max_attendees FROM events WHERE id = ? AND status = ?'
    ).bind(eventId, 'published').first<any>();

    if (!event) return c.json({ success: false, error: 'Event not found' }, 404);
    if (!event.registration_open) return c.json({ success: false, error: 'Registration is closed' }, 403);

    // Check duplicate registration
    const existing = await c.env.DB.prepare(
      'SELECT id FROM registrations WHERE event_id = ? AND email = ? AND status != ?'
    ).bind(eventId, body.email.toLowerCase().trim(), 'cancelled').first();

    if (existing) {
      return c.json({ success: false, error: 'Email already registered for this event' }, 409);
    }

    // Check capacity
    if (event.max_attendees) {
      const { count } = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM registrations WHERE event_id = ? AND status IN ('pending','approved')"
      ).bind(eventId).first<{ count: number }>() || { count: 0 };

      if (count >= event.max_attendees) {
        return c.json({ success: false, error: 'Event is at full capacity. You have been added to the waitlist.' }, 202);
      }
    }

    const ticketCode = generateTicketCode();
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';

    const result = await c.env.DB.prepare(
      `INSERT INTO registrations
        (event_id, reg_type, full_name, email, phone, city, country,
         company_name, sector, stage, team_size, website, description,
         work_field, participation_reason,
         ticket_code, ip_address)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      eventId,
      body.reg_type,
      body.full_name.trim(),
      body.email.toLowerCase().trim(),
      body.phone || null,
      body.city || null,
      body.country || 'Syria',
      body.company_name || null,
      body.sector || null,
      body.stage || null,
      body.team_size || null,
      body.website || null,
      body.description || null,
      body.work_field || null,
      body.participation_reason || null,
      ticketCode,
      ip
    ).run();

    // Update stats
    await c.env.DB.prepare(
      `INSERT INTO event_stats (event_id, total_registrations, startup_count)
       VALUES (?, 1, ?)
       ON CONFLICT(event_id) DO UPDATE SET
         total_registrations = total_registrations + 1,
         startup_count = startup_count + CASE WHEN ? = 'startup' THEN 1 ELSE 0 END,
         updated_at = CURRENT_TIMESTAMP`
    ).bind(eventId, body.reg_type === 'startup' ? 1 : 0, body.reg_type).run();

    return c.json({
      success: true,
      data: { id: result.meta.last_row_id, ticket_code: ticketCode },
      message: 'Registration submitted successfully! You will receive a confirmation email shortly.'
    }, 201);
  } catch (error: any) {
    console.error('POST /registrations error:', error);
    return c.json({ success: false, error: error?.message || 'Server error' }, 500);
  }
});

// GET /api/events/:eventId/registrations (admin)
registrationsRouter.get('/', requireAdmin, async (c) => {
  try {
    const eventId = Number(c.req.param('eventId'));
    const url = new URL(c.req.url);
    const status = url.searchParams.get('status');
    const reg_type = url.searchParams.get('type');
    const search = url.searchParams.get('search');
    const limit = Math.min(Number(url.searchParams.get('limit') || 50), 200);
    const offset = Number(url.searchParams.get('offset') || 0);

    let query = 'SELECT * FROM registrations WHERE event_id = ?';
    const params: any[] = [eventId];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (reg_type) { query += ' AND reg_type = ?'; params.push(reg_type); }
    if (search) {
      query += ' AND (full_name LIKE ? OR email LIKE ? OR company_name LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { results } = await c.env.DB.prepare(query).bind(...params).all();

    const countQuery = 'SELECT COUNT(*) as total FROM registrations WHERE event_id = ?';
    const { total } = await c.env.DB.prepare(countQuery).bind(eventId).first<{ total: number }>() || { total: 0 };

    return c.json({ success: true, data: results, total, limit, offset });
  } catch (error: any) {
    console.error('GET /registrations error:', error);
    return c.json({ success: false, error: error?.message || 'Server error' }, 500);
  }
});

// GET /api/events/:eventId/registrations/:id (admin)
registrationsRouter.get('/:id', requireAdmin, async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const eventId = Number(c.req.param('eventId'));
    const reg = await c.env.DB.prepare('SELECT * FROM registrations WHERE id = ? AND event_id = ?').bind(id, eventId).first();
    if (!reg) return c.json({ success: false, error: 'Not found' }, 404);
    return c.json({ success: true, data: reg });
  } catch (error: any) {
    console.error('GET /registrations/:id error:', error);
    return c.json({ success: false, error: error?.message || 'Server error' }, 500);
  }
});

// PUT /api/events/:eventId/registrations/:id – update status (admin)
registrationsRouter.put('/:id', requireAdmin, async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const eventId = Number(c.req.param('eventId'));
    const body = await c.req.json().catch(() => null);

    // Check if registration exists
    const existing = await c.env.DB.prepare('SELECT id FROM registrations WHERE id = ? AND event_id = ?').bind(id, eventId).first();
    if (!existing) return c.json({ success: false, error: 'Registration not found' }, 404);

    await c.env.DB.prepare(
      `UPDATE registrations SET
        status = COALESCE(?, status), notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND event_id = ?`
    ).bind(body?.status || null, body?.notes || null, id, eventId).run();

    // Update approved count in stats
    if (body?.status === 'approved') {
      await c.env.DB.prepare(
        `UPDATE event_stats SET approved_count = approved_count + 1, updated_at = CURRENT_TIMESTAMP WHERE event_id = ?`
      ).bind(eventId).run();
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('PUT /registrations/:id error:', error);
    return c.json({ success: false, error: error?.message || 'Server error' }, 500);
  }
});

// DELETE /api/events/:eventId/registrations/:id (admin)
registrationsRouter.delete('/:id', requireAdmin, async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const eventId = Number(c.req.param('eventId'));
    const result = await c.env.DB.prepare('DELETE FROM registrations WHERE id = ? AND event_id = ?').bind(id, eventId).run();
    
    if (!result.meta.changes) {
      return c.json({ success: false, error: 'Registration not found' }, 404);
    }
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /registrations/:id error:', error);
    return c.json({ success: false, error: error?.message || 'Server error' }, 500);
  }
});
