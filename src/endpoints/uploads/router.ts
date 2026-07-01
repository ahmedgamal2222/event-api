// src/endpoints/uploads/router.ts
import { Hono } from 'hono';
import { HonoEnv } from '../../types';
import { requireAdmin } from '../../middleware/auth';

export const uploadsRouter = new Hono<HonoEnv>();

/**
 * POST /api/uploads/image
 * Upload image to R2 and return public URL
 * Body: { file: Blob, filename: string }
 */
uploadsRouter.post('/image', requireAdmin, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file || !file.type.startsWith('image/')) {
      return c.json({ success: false, error: 'Invalid image file' }, 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${timestamp}-${random}.${ext}`;

    // Upload to R2
    const buffer = await file.arrayBuffer();
    await c.env.BUCKET.put(filename, buffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Return public URL
    const url = `https://pub-4b15f44d6ae9429fa0111dcc25a5bce0.r2.dev/${filename}`;
    
    return c.json({ success: true, url, filename }, 201);
  } catch (e: any) {
    console.error('Upload error:', e);
    return c.json({ success: false, error: e.message }, 500);
  }
});

/**
 * DELETE /api/uploads/:filename
 * Delete image from R2
 */
uploadsRouter.delete('/:filename', requireAdmin, async (c) => {
  try {
    const filename = c.req.param('filename');
    if (!filename) {
      return c.json({ success: false, error: 'Filename required' }, 400);
    }

    await c.env.BUCKET.delete(filename);
    return c.json({ success: true });
  } catch (e: any) {
    console.error('Delete error:', e);
    return c.json({ success: false, error: e.message }, 500);
  }
});
