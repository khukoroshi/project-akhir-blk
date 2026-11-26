import { z } from "zod";
import { queryStrictOptions as strictOptions } from "../../utils/validation.mjs";

const MAX_PAGE = 200;
const MAX_TOP_PAGE = 10;

export const CATALOG_FILTERS = [
  "all",
  "airing",
  "upcoming",
  "tv",
  "movie",
  "ova",
  "ona",
  "special",
  "popular",
  "favorited",
];

const pageMsg = `Page must be a whole number from 1 to ${MAX_PAGE}`;

// Query values always arrive as strings, so page is checked as text.
export const catalogQuerySchema = z
  .strictObject(
    {
      q: z
        .string({ error: "Search query must be text" })
        .max(100, "Search query must be at most 100 characters")
        .optional(),
      page: z
        .string({ error: pageMsg })
        .regex(/^[1-9]\d{0,2}$/, pageMsg)
        .refine((v) => Number(v) <= MAX_PAGE, pageMsg)
        .optional(),
      filter: z
        .enum(CATALOG_FILTERS, { error: "Filter is not valid" })
        .optional(),
    },
    strictOptions,
  )
  .refine(
    (d) => (d.q ?? "").trim() !== "" || Number(d.page ?? 1) <= MAX_TOP_PAGE,
    {
      path: ["page"],
      error: `The top list is limited to ${MAX_TOP_PAGE} pages`,
    },
  );

// No query parameters are allowed; any key is rejected with 400.
export const featuredQuerySchema = z.strictObject({}, strictOptions);
