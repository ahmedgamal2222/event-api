// src/endpoints/faqs/router.ts
import { Hono } from 'hono';
import { HonoEnv } from '../../types';
import { requireAdmin } from '../../middleware/auth';

export const faqsRouter = new Hono<HonoEnv>();

// GET /api/events/:eventId/faqs (public)
faqsRouter.get('/', async (c) => {
  try {
    const eventId = Number(c.req.param('eventId'));
    const { results } = await c.env.DB.prepare(
      'SELECT id, question_ar, answer_ar, sort_order FROM faqs WHERE event_id = ? ORDER BY sort_order ASC'
    ).bind(eventId).all();
    return c.json({ success: true, data: results });
  } catch (error: any) {
    console.error('GET /faqs error:', error);
    return c.json({ success: false, error: error?.message || 'Server error' }, 500);
  }
});

// POST /api/events/:eventId/faqs (admin)
faqsRouter.post('/', requireAdmin, async (c) => {
  try {
    const eventId = Number(c.req.param('eventId'));
    const body = await c.req.json().catch(() => null);
    if (!body?.question_ar || !body?.answer_ar) return c.json({ success: false, error: 'question_ar and answer_ar required' }, 400);

    const result = await c.env.DB.prepare(
      'INSERT INTO faqs (event_id, question, question_ar, answer, answer_ar, sort_order) VALUES (?,?,?,?,?,?)'
    ).bind(eventId, body.question_ar, body.question_ar, body.answer_ar, body.answer_ar, body.sort_order ?? 0).run();

    return c.json({ success: true, data: { id: result.meta.last_row_id } }, 201);
  } catch (error: any) {
    console.error('POST /faqs error:', error);
    return c.json({ success: false, error: error?.message || 'Server error' }, 500);
  }
});

// DELETE /api/events/:eventId/faqs/:id (admin)
faqsRouter.delete('/:id', requireAdmin, async (c) => {
  try {
    const id = Number(c.req.param('id'));
    const eventId = Number(c.req.param('eventId'));
    const result = await c.env.DB.prepare('DELETE FROM faqs WHERE id = ? AND event_id = ?')
      .bind(id, eventId).run();
    
    if (!result.meta.changes) {
      return c.json({ success: false, error: 'FAQ not found' }, 404);
    }
    
    return c.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /faqs/:id error:', error);
    return c.json({ success: false, error: error?.message || 'Server error' }, 500);
  }
});
