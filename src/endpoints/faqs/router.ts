// src/endpoints/faqs/router.ts
import { Hono } from 'hono';
import { HonoEnv } from '../../types';
import { requireAdmin } from '../../middleware/auth';

export const faqsRouter = new Hono<HonoEnv>();

// GET /api/events/:eventId/faqs (public)
faqsRouter.get('/', async (c) => {
  const eventId = Number(c.req.param('eventId'));
  const { results } = await c.env.DB.prepare(
    'SELECT id, question_ar, answer_ar, sort_order FROM faqs WHERE event_id = ? ORDER BY sort_order ASC'
  ).bind(eventId).all();
  return c.json({ success: true, data: results });
});

// POST /api/events/:eventId/faqs (admin)
faqsRouter.post('/', requireAdmin, async (c) => {
  const eventId = Number(c.req.param('eventId'));
  const body = await c.req.json().catch(() => null);
  if (!body?.question_ar || !body?.answer_ar) return c.json({ success: false, error: 'question_ar and answer_ar required' }, 400);

  const result = await c.env.DB.prepare(
    'INSERT INTO faqs (event_id, question, question_ar, answer, answer_ar, sort_order) VALUES (?,?,?,?,?,?)'
  ).bind(eventId, body.question_ar, body.question_ar, body.answer_ar, body.answer_ar, body.sort_order ?? 0).run();

  return c.json({ success: true, data: { id: result.meta.last_row_id } }, 201);
});

// DELETE /api/events/:eventId/faqs/:id (admin)
faqsRouter.delete('/:id', requireAdmin, async (c) => {
  await c.env.DB.prepare('DELETE FROM faqs WHERE id = ? AND event_id = ?')
    .bind(Number(c.req.param('id')), Number(c.req.param('eventId'))).run();
  return c.json({ success: true });
});
