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

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const changeEmailSchema = z.object({
  email: z.string().email(),
});

export const changeUsernameSchema = z.object({
  username: z.string().min(2),
});

export type LoginInput          = z.infer<typeof loginSchema>;
export type RegisterInput       = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ChangeEmailInput    = z.infer<typeof changeEmailSchema>;
export type ChangeUsernameInput = z.infer<typeof changeUsernameSchema>;