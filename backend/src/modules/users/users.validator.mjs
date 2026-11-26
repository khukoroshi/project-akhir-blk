import { z } from "zod";
import { bodyStrictOptions } from "../../utils/validation.mjs";

export const usernameParamSchema = z.object({
  username: z
    .string({ error: "Username is required" })
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters"),
});

// Full update: all three fields must be sent. avatarUrl/bannerUrl are rejected
// by strict mode until uploads exist (Phase 3).
export const updateProfileSchema = z.strictObject(
  {
    displayName: z
      .string({ error: "Display name is required (text or null)" })
      .trim()
      .min(1, "Display name cannot be empty")
      .max(100, "Display name must be at most 100 characters")
      .nullable(),
    bio: z
      .string({ error: "Bio is required (text or null)" })
      .max(500, "Bio must be at most 500 characters")
      .nullable(),
    isPrivate: z.boolean({
      error: "Privacy setting is required (true or false)",
    }),
  },
  bodyStrictOptions,
);
