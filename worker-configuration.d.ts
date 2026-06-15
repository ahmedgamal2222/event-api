// worker-configuration.d.ts
interface Env {
  DB: D1Database;
  SESSION_KV: KVNamespace;
  BUCKET: R2Bucket;
  JWT_SECRET: string;
}
