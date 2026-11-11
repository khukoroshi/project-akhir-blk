import { z } from "zod";
import { bodyStrictOptions } from "./common.mjs";

// Fields the client used to send before the server filled the catalog (C3).
const LEGACY_FIELDS = ["title", "imgUrl", "totalEps", "type", "teps"];

const strictOptions = {
  error: (issue) => {
    if (issue.code === "unrecognized_keys") {
      const legacy = issue.keys.filter((key) => LEGACY_FIELDS.includes(key));
      if (legacy.length > 0) {
        const names = legacy.map((key) => `'${key}'`).join(", ");
        return `Field ${names} tidak dikenal. Katalog diisi server dari AniList.`;
      }
    }
    return bodyStrictOptions.error(issue);
  },
};

// "<label> wajib diisi" when missing, otherwise the given type message
const required = (label, message) => ({
  error: (issue) =>
    issue.input === undefined ? `${label} wajib diisi` : message,
});

const STATUSES = ["watching", "completed", "dropped", "plan to watch"];
const TIERS = ["S", "A", "B", "C", "D"];

const scoreMsg = "score harus angka 1-10 (maksimal 1 angka desimal)";

const statusField = z.enum(STATUSES, {
  error: `status harus salah satu dari: ${STATUSES.join(", ")}`,
});

const tierField = z
  .enum(TIERS, { error: `tier harus salah satu dari: ${TIERS.join(", ")}` })
  .nullish()
  .default(null);

const scoreField = z
  .number({ error: scoreMsg })
  .min(1, scoreMsg)
  .max(10, scoreMsg)
  .refine((v) => Math.round(v * 10) / 10 === v, scoreMsg) // max 1 decimal (DECIMAL(3,1))
  .nullish()
  .default(null);

const notesField = z
  .string({ error: "notes harus berupa teks" })
  .max(2000, "notes maksimal 2000 karakter")
  .nullish()
  .default(null);

const epsMsg = (name) => `${name} harus bilangan bulat >= 0`;

// ---------- params ----------
export const animIdParamSchema = z.strictObject(
  {
    anim_id: z
      .string({ error: "anim_id wajib diisi" })
      .regex(/^[1-9]\d{0,9}$/, "anim_id harus bilangan bulat positif"),
  },
  strictOptions,
);

// ---------- POST /anime ----------
export const createAnimeSchema = z.strictObject(
  {
    externalId: z
      .int(required("externalId", "externalId harus bilangan bulat positif"))
      .positive("externalId harus bilangan bulat positif")
      .max(2_147_483_647, "externalId terlalu besar"),
    externalSource: z
      .literal("anilist", { error: 'externalSource hanya boleh "anilist"' })
      .default("anilist"),
    status: statusField.default("watching"),
    tier: tierField,
    score: scoreField,
    notes: notesField,
  },
  strictOptions,
);

// ---------- PUT /anime/:anim_id (all fields sent at once) ----------
// ---------- PUT /anime/:anim_id (all fields sent at once) ----------
// The eps <= total rule is checked in the model against the catalog total.
export const updateAnimeSchema = z.strictObject(
  {
    eps: z.int(required("eps", epsMsg("eps"))).min(0, epsMsg("eps")),
    status: statusField,
    tier: tierField,
    score: scoreField,
    notes: notesField,
  },
  strictOptions,
);
