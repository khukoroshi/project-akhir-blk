import { z } from "zod";
import { bodyStrictOptions as strictOptions } from "./common.mjs";

const emailField = z
  .string({ error: "Email wajib diisi" })
  .trim()
  .toLowerCase()
  .max(100, "Email maksimal 100 karakter")
  .email("Format email tidak valid");

export const registerSchema = z.strictObject(
  {
    name: z
      .string({ error: "Nama wajib diisi" })
      .trim()
      .min(3, "Nama minimal 3 karakter")
      .max(50, "Nama maksimal 50 karakter"),
    email: emailField,
    password: z
      .string({ error: "Password wajib diisi" })
      .min(8, "Password minimal 8 karakter")
      .max(72, "Password maksimal 72 karakter")
      .regex(/[A-Za-z]/, "Password harus mengandung huruf")
      .regex(/\d/, "Password harus mengandung angka"),
  },
  strictOptions,
);

export const loginSchema = z.strictObject(
  {
    email: emailField,
    password: z
      .string({ error: "Password wajib diisi" })
      .min(1, "Password wajib diisi"),
  },
  strictOptions,
);
