// ── auth.validate.ts ──────────────────────────────────────────────────────────
import { z } from "zod";

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  username: z.string().min(2),
  email:    z.string().email(),
  password: z.string().min(6),
  name:     z.string().min(1),
});

export type LoginInput    = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;