// src/utils/auth.ts – JWT-based session helpers
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return (await hashPassword(password)) === hash;
}

/** Create a signed JWT token (HS256) */
export async function createToken(payload: Record<string, any>, secret: string, expiresInSeconds = 86400 * 7): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSeconds };

  const encode = (obj: object) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const headerEncoded = encode(header);
  const bodyEncoded = encode(body);
  const signingInput = `${headerEncoded}.${bodyEncoded}`;

  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));
  const sigEncoded = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${signingInput}.${sigEncoded}`;
}

/** Verify and decode a JWT token */
export async function verifyToken(token: string, secret: string): Promise<Record<string, any> | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerEncoded, bodyEncoded, sigEncoded] = parts;
    const signingInput = `${headerEncoded}.${bodyEncoded}`;

    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const sig = Uint8Array.from(atob(sigEncoded.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(signingInput));
    if (!valid) return null;

    const payload = JSON.parse(atob(bodyEncoded.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Generate a random ticket code */
export function generateTicketCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'EVT-';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
