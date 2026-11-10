import { z } from "zod";
import { bodyStrictOptions as strictOptions } from "./common.mjs";

// "<label> wajib diisi" when missing, otherwise the given type message
const required = (label, message) => ({
  error: (issue) =>
    issue.input === undefined ? `${label} wajib diisi` : message,
});

const STATUSES = ["watching", "completed", "dropped", "plan to watch"];
const TIERS = ["S", "A", "B", "C", "D"];
const TYPES = ["TV", "Movie", "OVA", "ONA", "Special", "TV Short", "Music"];
const TYPE_MAP = Object.fromEntries(TYPES.map((t) => [t.toLowerCase(), t]));

const typeMsg = `type harus salah satu dari: ${TYPES.join(", ")}`;
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
      .positive("externalId harus bilangan bulat positif"),
    title: z
      .string(required("Judul anime (title)", "title harus berupa teks"))
      .trim()
      .min(1, "Judul anime (title) wajib diisi")
      .max(255, "title maksimal 255 karakter"),
    externalSource: z
      .literal("anilist", { error: 'externalSource hanya boleh "anilist"' })
      .default("anilist"),
    imgUrl: z
      .url({
        protocol: /^https?$/,
        error: "imgUrl harus berupa URL http/https yang valid",
      })
      .max(500, "imgUrl maksimal 500 karakter")
      .nullish()
      .default(null),
    totalEps: z
      .int({ error: epsMsg("totalEps") })
      .min(0, epsMsg("totalEps"))
      .default(0),
    // Case-insensitive: AniList sends "MOVIE", DB enum expects "Movie"
    type: z
      .string({ error: typeMsg })
      .transform(
        (v) =>
          TYPE_MAP[
            v
              .trim()
              .toLowerCase()
              .replace(/[_\s]+/g, " ")
          ],
      )
      .pipe(z.enum(TYPES, { error: typeMsg }))
      .default("TV"),
    status: statusField.default("watching"),
    tier: tierField,
    score: scoreField,
    notes: notesField,
  },
  strictOptions,
);

// ---------- PUT /anime/:anim_id (all fields sent at once) ----------
export const updateAnimeSchema = z
  .strictObject(
    {
      eps: z.int(required("eps", epsMsg("eps"))).min(0, epsMsg("eps")),
      teps: z.int(required("teps", epsMsg("teps"))).min(0, epsMsg("teps")),
      status: statusField,
      tier: tierField,
      score: scoreField,
      notes: notesField,
    },
    strictOptions,
  )
  .refine((d) => d.teps === 0 || d.eps <= d.teps, {
    path: ["eps"],
    error: "eps tidak boleh melebihi teps",
  });
