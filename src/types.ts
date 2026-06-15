// src/types.ts
export interface AppEnv {
  DB: D1Database;
  SESSION_KV: KVNamespace;
  BUCKET: R2Bucket;
  JWT_SECRET: string;
}

export type HonoEnv = { Bindings: AppEnv; Variables: { adminId?: number; admin?: any } };
