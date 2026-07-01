// src/endpoints/tickets/router.ts
import { Hono } from 'hono';
import { HonoEnv } from '../../types';
import { requireAdmin } from '../../middleware/auth';

export const ticketsRouter = new Hono<HonoEnv>();

// ── Public Routes ────────────────────────────────────────────────────────────

// GET /api/events/:eventId/tickets
// List all active ticket types for an event
ticketsRouter.get('/', async (c) => {
  try {
    const eventId = Number(c.req.param('eventId'));
    const { results } = await c.env.DB.prepare(`
      SELECT 
        id,
        name_ar,
        name_en,
        description,
        price_per_unit,
        duration_type,
        custom_days,
        day_numbers,
        quantity_available,
        quantity_sold,
        sort_order
      FROM ticket_types
      WHERE event_id = ? AND is_active = 1
      ORDER BY sort_order, id
    `).bind(eventId).all();

    return c.json({ success: true, data: results || [] });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to fetch tickets' }, 500);
  }
});

// GET /api/events/:eventId/tickets/available/:ticketTypeId
// Check ticket availability
ticketsRouter.get('/available/:ticketTypeId', async (c) => {
  try {
    const eventId = Number(c.req.param('eventId'));
    const ticketTypeId = Number(c.req.param('ticketTypeId'));

    const ticket = await c.env.DB.prepare(`
      SELECT 
        id,
        name_ar,
        price_per_unit,
        quantity_available,
        quantity_sold,
        (quantity_available - quantity_sold) as remaining
      FROM ticket_types
      WHERE id = ? AND event_id = ? AND is_active = 1
    `).bind(ticketTypeId, eventId).first();

    if (!ticket) {
      return c.json({ success: false, error: 'Ticket type not found' }, 404);
    }

    return c.json({ success: true, data: ticket });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'Failed to fetch ticket availability' }, 500);
  }
});

// ── Admin Routes ─────────────────────────────────────────────────────────────

// POST /api/events/:eventId/tickets (admin)
// Create ticket type
ticketsRouter.post('/', requireAdmin, async (c) => {
  try {
    const eventId = Number(c.req.param('eventId'));
    const body = await c.req.json().catch(() => null);

    if (!body?.name_ar) return c.json({ success: false, error: 'name_ar required' }, 400);

    const {
      name_ar,
      name_en,
      description,
      price_per_unit,
      duration_type,
      custom_days,
      day_numbers,
      quantity_available,
      sort_order
    } = body;

    const result = await c.env.DB.prepare(`
      INSERT INTO ticket_types (
        event_id, name_ar, name_en, description, price_per_unit,
        duration_type, custom_days, day_numbers, quantity_available, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      eventId, name_ar, name_en || null, description || null, price_per_unit || 0,
      duration_type || 'single_day', custom_days || null, day_numbers || '[]', 
      quantity_available || 0, sort_order || 0
    ).run();

    return c.json({ success: true, data: { id: result.meta.last_row_id } }, 201);
  } catch (err: any) {
    console.error('POST /tickets error:', err);
    return c.json({ success: false, error: err.message || 'Failed to create ticket type' }, 500);
  }
});

// PUT /api/events/:eventId/tickets/:id (admin)
// Update ticket type
ticketsRouter.put('/:id', requireAdmin, async (c) => {
  try {
    const eventId = Number(c.req.param('eventId'));
    const id = Number(c.req.param('id'));
    const body = await c.req.json().catch(() => null);

    if (!body) return c.json({ success: false, error: 'Invalid request body' }, 400);

    const {
      name_ar,
      name_en,
      description,
      price_per_unit,
      duration_type,
      custom_days,
      day_numbers,
      quantity_available,
      is_active,
      sort_order
    } = body;

    await c.env.DB.prepare(`
      UPDATE ticket_types SET
        name_ar = COALESCE(?, name_ar),
        name_en = COALESCE(?, name_en),
        description = COALESCE(?, description),
        price_per_unit = COALESCE(?, price_per_unit),
        duration_type = COALESCE(?, duration_type),
        custom_days = ?,
        day_numbers = COALESCE(?, day_numbers),
        quantity_available = COALESCE(?, quantity_available),
        is_active = COALESCE(?, is_active),
        sort_order = COALESCE(?, sort_order),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND event_id = ?
    `).bind(
      name_ar, name_en, description, price_per_unit,
      duration_type, custom_days, day_numbers,
      quantity_available, is_active, sort_order, id, eventId
    ).run();

    return c.json({ success: true });
  } catch (err: any) {
    console.error('PUT /tickets/:id error:', err);
    return c.json({ success: false, error: err.message || 'Failed to update ticket type' }, 500);
  }
});

// DELETE /api/events/:eventId/tickets/:id (admin)
// Soft delete ticket type
ticketsRouter.delete('/:id', requireAdmin, async (c) => {
  try {
    const eventId = Number(c.req.param('eventId'));
    const id = Number(c.req.param('id'));

    await c.env.DB.prepare(`
      UPDATE ticket_types SET is_active = 0 WHERE id = ? AND event_id = ?
    `).bind(id, eventId).run();

    return c.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /tickets/:id error:', err);
    return c.json({ success: false, error: err.message || 'Failed to delete ticket type' }, 500);
  }
});

export default ticketsRouter;
