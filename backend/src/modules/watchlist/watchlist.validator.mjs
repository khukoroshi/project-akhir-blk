import { z } from "zod";
import { bodyStrictOptions } from "../../utils/validation.mjs";

// Fields the client used to send before the server filled the catalog (C3).
const LEGACY_FIELDS = ["title", "imgUrl", "totalEps", "type", "teps"];
const externalIdMsg = "External ID must be a positive whole number";

const strictOptions = {
  error: (issue) => {
    if (issue.code === "unrecognized_keys") {
      const legacy = issue.keys.filter((key) => LEGACY_FIELDS.includes(key));
      if (legacy.length > 0) {
        const names = legacy.map((key) => `'${key}'`).join(", ");
        return `Field ${names} is not recognized. The catalog is filled by the server from AniList`;
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

const scoreMsg =
  "Score must be a number from 1 to 10 (at most 1 decimal place)";

const statusField = z.enum(STATUSES, {
  error: `Status must be one of: ${STATUSES.join(", ")}`,
});

const tierField = z
  .enum(TIERS, { error: `Tier must be one of: ${TIERS.join(", ")}` })
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
  .string({ error: "Notes must be text" })
  .max(2000, "Notes must be at most 2000 characters")
  .nullish()
  .default(null);

const epsMsg = (name) => `${name} must be a whole number of 0 or more`;

// ---------- params ----------
export const animIdParamSchema = z.strictObject(
  {
    anim_id: z
      .string({ error: "Anime ID is required" })
      .regex(/^[1-9]\d{0,9}$/, "Anime ID must be a positive whole number"),
  },
  strictOptions,
);

// ---------- POST /anime ----------
export const createAnimeSchema = z.strictObject(
  {
    externalId: z
      .int(required("External ID", externalIdMsg))
      .positive(externalIdMsg)
      .max(2_147_483_647, "External ID is too large"),
    externalSource: z
      .literal("anilist", { error: 'External source must be "anilist"' })
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
    eps: z
      .int(required("Episodes", epsMsg("Episodes")))
      .min(0, epsMsg("Episodes")),
    status: statusField,
    tier: tierField,
    score: scoreField,
    notes: notesField,
  },
  strictOptions,
);
