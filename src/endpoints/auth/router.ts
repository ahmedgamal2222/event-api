// src/endpoints/auth/login.ts
import { Hono } from 'hono';
import { HonoEnv } from '../../types';
import { hashPassword, createToken } from '../../utils/auth';

export const authRouter = new Hono<HonoEnv>();

// POST /api/auth/login
authRouter.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return c.json({ success: false, error: 'Email and password required' }, 400);
  }

  const admin = await c.env.DB.prepare('SELECT * FROM admins WHERE email = ? AND is_active = 1')
    .bind(body.email.toLowerCase().trim())
    .first<any>();

  if (!admin) {
    return c.json({ success: false, error: 'Invalid credentials' }, 401);
  }

  const passwordHash = await hashPassword(body.password);
  if (admin.password_hash !== passwordHash) {
    return c.json({ success: false, error: 'Invalid credentials' }, 401);
  }

  // Update last login
  await c.env.DB.prepare('UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?').bind(admin.id).run();

  const token = await createToken({ adminId: admin.id, email: admin.email, role: admin.role }, c.env.JWT_SECRET);

  return c.json({
    success: true,
    data: {
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role }
    }
  });
});

// GET /api/auth/me
authRouter.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return c.json({ success: false, error: 'Unauthorized' }, 401);

  const { verifyToken } = await import('../../utils/auth');
  const payload = await verifyToken(token, c.env.JWT_SECRET);
  if (!payload) return c.json({ success: false, error: 'Invalid token' }, 401);

  const admin = await c.env.DB.prepare('SELECT id, name, email, role FROM admins WHERE id = ? AND is_active = 1')
    .bind(payload.adminId).first();

  if (!admin) return c.json({ success: false, error: 'Not found' }, 404);
  return c.json({ success: true, data: admin });
});
