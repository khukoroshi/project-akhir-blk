import { z } from "zod";
import { bodyStrictOptions as strictOptions } from "../../utils/validation.mjs";

const emailField = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .max(100, "Email must be at most 100 characters")
  .email("Email is not valid");

export const registerSchema = z.strictObject(
  {
    name: z
      .string({ error: "Name is required" })
      .trim()
      .min(3, "Name must be 3-50 characters")
      .max(50, "Name must be 3-50 characters")
      .regex(
        /^[A-Za-z0-9][A-Za-z0-9_.-]{2,49}$/,
        "Name can only contain letters, numbers, dots, underscores, and hyphens, and must start with a letter or number (no spaces)",
      ),
    email: emailField,
    password: z
      .string({ error: "Password is required" })
      .min(8, "Password must be 8-72 characters")
      .max(72, "Password must be 8-72 characters")
      .regex(/[A-Za-z]/, "Password must include a letter")
      .regex(/\d/, "Password must include a number"),
  },
  strictOptions,
);

export const loginSchema = z.strictObject(
  {
    email: emailField,
    password: z
      .string({ error: "Password is required" })
      .min(1, "Password is required"),
  },
  strictOptions,
);
