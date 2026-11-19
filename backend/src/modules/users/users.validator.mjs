import { z } from "zod";
import { bodyStrictOptions } from "../../utils/validation.mjs";

export const usernameParamSchema = z.object({
  username: z
    .string({ error: "Username wajib diisi" })
    .trim()
    .min(3, "Username minimal 3 karakter")
    .max(50, "Username maksimal 50 karakter"),
});

// Full update: all three fields must be sent. avatarUrl/bannerUrl are rejected
// by strict mode until uploads exist (Phase 3).
export const updateProfileSchema = z.strictObject(
  {
    displayName: z
      .string({ error: "displayName wajib diisi (teks atau null)" })
      .trim()
      .min(1, "Nama tampilan tidak boleh kosong")
      .max(100, "Nama tampilan maksimal 100 karakter")
      .nullable(),
    bio: z
      .string({ error: "bio wajib diisi (teks atau null)" })
      .max(500, "Bio maksimal 500 karakter")
      .nullable(),
    isPrivate: z.boolean({ error: "isPrivate wajib diisi (true atau false)" }),
  },
  bodyStrictOptions,
);
