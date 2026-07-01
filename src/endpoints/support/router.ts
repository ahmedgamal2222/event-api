// src/endpoints/support/router.ts
import { Hono } from 'hono';
import { HonoEnv } from '../../types';
import { requireAdmin } from '../../middleware/auth';

export const supportRouter = new Hono<HonoEnv>();

// ── Public Routes ────────────────────────────────────────────────────────────

// POST /api/events/:eventId/support/messages
// Submit support message
supportRouter.post('/messages', async (c) => {
  try {
    const eventId = Number(c.req.param('eventId'));
    const body = await c.req.json().catch(() => null);

    if (!body?.name || !body?.email || !body?.subject || !body?.message) {
      return c.json({
        success: false,
        error: 'Missing required fields: name, email, subject, message'
      }, 400);
    }

    const { name, email, phone, subject, message, category } = body;

    const result = await c.env.DB.prepare(`
      INSERT INTO support_messages (
        event_id, name, email, phone, subject, message, category, status, priority
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'new', 'medium')
    `).bind(
      eventId, name, email, phone || null, subject, message, category || 'general'
    ).run();

    return c.json({ success: true, data: { id: result.meta.last_row_id } }, 201);
  } catch (err: any) {
    console.error('POST /support/messages error:', err);
    return c.json({ success: false, error: err.message || 'Failed to submit support message' }, 500);
  }
});

// GET /api/events/:eventId/support/pixels (public)
// Get pixel tracking codes
supportRouter.get('/pixels', async (c) => {
  try {
    const eventId = Number(c.req.param('eventId'));

    const pixels = await c.env.DB.prepare(`
      SELECT 
        facebook_pixel_code,
        linkedin_pixel_code,
        twitter_pixel_code,
        gtag_code,
        custom_pixel_code
      FROM pixel_tracking
      WHERE event_id = ? AND is_active = 1
    `).bind(eventId).first();

    if (!pixels) {
      return c.json({ success: true, data: {} });
    }

    return c.json({ success: true, data: pixels });
  } catch (err: any) {
    console.error('GET /support/pixels error:', err);
    return c.json({ success: false, error: err.message || 'Failed to fetch pixels' }, 500);
  }
});

// ── Admin Routes ─────────────────────────────────────────────────────────────

// GET /api/events/:eventId/support/messages (admin)
// Get all support messages
supportRouter.get('/messages', requireAdmin, async (c) => {
  try {
    const eventId = Number(c.req.param('eventId'));

    const { results } = await c.env.DB.prepare(`
      SELECT 
        id, name, email, phone, subject, message, category,
        status, priority, admin_response, admin_name, responded_at,
        created_at, updated_at
      FROM support_messages
      WHERE event_id = ?
      ORDER BY 
        CASE status
          WHEN 'new' THEN 0
          WHEN 'in_progress' THEN 1
          WHEN 'open' THEN 2
          WHEN 'resolved' THEN 3
          ELSE 4
        END,
        CASE priority
          WHEN 'urgent' THEN 0
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          ELSE 3
        END,
        created_at DESC
    `).bind(eventId).all();

    return c.json({ success: true, data: results || [] });
  } catch (err: any) {
    console.error('GET /support/messages error:', err);
    return c.json({ success: false, error: err.message || 'Failed to fetch support messages' }, 500);
  }
});

// GET /api/events/:eventId/support/messages/:id (admin)
// Get single support message
supportRouter.get('/messages/:id', requireAdmin, async (c) => {
  try {
    const eventId = Number(c.req.param('eventId'));
    const id = Number(c.req.param('id'));

    const message = await c.env.DB.prepare(`
      SELECT * FROM support_messages
      WHERE id = ? AND event_id = ?
    `).bind(id, eventId).first();

    if (!message) {
      return c.json({ success: false, error: 'Message not found' }, 404);
    }

    return c.json({ success: true, data: message });
  } catch (err: any) {
    console.error('GET /support/messages/:id error:', err);
    return c.json({ success: false, error: err.message || 'Failed to fetch message' }, 500);
  }
});

// PUT /api/events/:eventId/support/messages/:id (admin)
// Update support message (respond)
supportRouter.put('/messages/:id', requireAdmin, async (c) => {
  try {
    const eventId = Number(c.req.param('eventId'));
    const id = Number(c.req.param('id'));
    const body = await c.req.json().catch(() => null);

    if (!body) return c.json({ success: false, error: 'Invalid request body' }, 400);

    const { admin_response, admin_name, status, priority } = body;

    await c.env.DB.prepare(`
      UPDATE support_messages SET
        admin_response = ?,
        admin_name = ?,
        status = ?,
        priority = ?,
        responded_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND event_id = ?
    `).bind(
      admin_response || null,
      admin_name || null,
      status || 'open',
      priority || 'medium',
      id,
      eventId
    ).run();

    return c.json({ success: true });
  } catch (err: any) {
    console.error('PUT /support/messages/:id error:', err);
    return c.json({ success: false, error: err.message || 'Failed to update message' }, 500);
  }
});

// PUT /api/events/:eventId/support/pixels (admin)
// Update pixel tracking codes
supportRouter.put('/pixels', requireAdmin, async (c) => {
  try {
    const eventId = Number(c.req.param('eventId'));
    const body = await c.req.json().catch(() => null);

    if (!body) return c.json({ success: false, error: 'Invalid request body' }, 400);

    const {
      facebook_pixel_id,
      facebook_pixel_code,
      linkedin_pixel_id,
      linkedin_pixel_code,
      twitter_pixel_id,
      twitter_pixel_code,
      gtag_id,
      gtag_code,
      custom_pixel_code,
      is_active
    } = body;

    // Check if record exists
    const existing = await c.env.DB.prepare(`
      SELECT id FROM pixel_tracking WHERE event_id = ?
    `).bind(eventId).first();

    if (existing) {
      // Update existing
      await c.env.DB.prepare(`
        UPDATE pixel_tracking SET
          facebook_pixel_id = COALESCE(?, facebook_pixel_id),
          facebook_pixel_code = COALESCE(?, facebook_pixel_code),
          linkedin_pixel_id = COALESCE(?, linkedin_pixel_id),
          linkedin_pixel_code = COALESCE(?, linkedin_pixel_code),
          twitter_pixel_id = COALESCE(?, twitter_pixel_id),
          twitter_pixel_code = COALESCE(?, twitter_pixel_code),
          gtag_id = COALESCE(?, gtag_id),
          gtag_code = COALESCE(?, gtag_code),
          custom_pixel_code = COALESCE(?, custom_pixel_code),
          is_active = COALESCE(?, is_active),
          updated_at = CURRENT_TIMESTAMP
        WHERE event_id = ?
      `).bind(
        facebook_pixel_id, facebook_pixel_code,
        linkedin_pixel_id, linkedin_pixel_code,
        twitter_pixel_id, twitter_pixel_code,
        gtag_id, gtag_code,
        custom_pixel_code,
        is_active,
        eventId
      ).run();
    } else {
      // Create new
      await c.env.DB.prepare(`
        INSERT INTO pixel_tracking (
          event_id, facebook_pixel_id, facebook_pixel_code,
          linkedin_pixel_id, linkedin_pixel_code,
          twitter_pixel_id, twitter_pixel_code,
          gtag_id, gtag_code, custom_pixel_code, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        eventId,
        facebook_pixel_id, facebook_pixel_code,
        linkedin_pixel_id, linkedin_pixel_code,
        twitter_pixel_id, twitter_pixel_code,
        gtag_id, gtag_code,
        custom_pixel_code,
        is_active !== undefined ? is_active : 1
      ).run();
    }

    return c.json({ success: true });
  } catch (err: any) {
    console.error('PUT /support/pixels error:', err);
    return c.json({ success: false, error: err.message || 'Failed to update pixels' }, 500);
  }
});

export default supportRouter;
