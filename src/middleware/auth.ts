// src/middleware/auth.ts – protect admin routes
import { MiddlewareHandler } from 'hono';
import { HonoEnv } from '../types';
import { verifyToken } from '../utils/auth';

export const requireAdmin: MiddlewareHandler<HonoEnv> = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const payload = await verifyToken(token, c.env.JWT_SECRET);
  if (!payload || !payload.adminId) {
    return c.json({ success: false, error: 'Invalid or expired token' }, 401);
  }

  // Verify admin still exists and is active
  const admin = await c.env.DB.prepare('SELECT id, name, email, role FROM admins WHERE id = ? AND is_active = 1')
    .bind(payload.adminId)
    .first();

  if (!admin) {
    return c.json({ success: false, error: 'Admin not found or disabled' }, 401);
  }

  c.set('adminId', admin.id as number);
  c.set('admin', admin);
  await next();
};
