import { z } from "zod";

export const createUserSchema = z.object({
  email: z.email().max(255).transform((val) => val.toLowerCase()),
  username: z.string()
    .min(3)
    .max(255)
    .transform(val => val.toLowerCase())
    .refine(val => /^[a-z0-9]+$/.test(val), { message: "Username can only contain lowercase letters and numbers, no spaces or symbols" }),
  password: z.string({ error: "Password is required" }).min(8).max(255)
});

export const loginUserSchema = z.object({
  usernameOrEmail: z.string().min(3).max(255).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(255),
});

export const forgetPasswordSchema = z.object({
  identifier: z.string().min(3).max(255).transform((value) => value.toLowerCase())
})

export const changePasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export const resetPasswordSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters")
});
