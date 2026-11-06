import { z } from "zod";

const MAX_PAGE = 200;
const MAX_TOP_PAGE = 10;

const strictOptions = {
  error: (issue) => {
    if (issue.code === "unrecognized_keys") {
      return `Parameter tidak dikenal: ${issue.keys.join(", ")}`;
    }
    if (issue.code === "invalid_type") return "Query request tidak valid";
    return undefined;
  },
};

const pageMsg = `page harus bilangan bulat 1-${MAX_PAGE}`;

// Query values always arrive as strings, so page is checked as text.
export const catalogQuerySchema = z
  .strictObject(
    {
      q: z
        .string({ error: "q harus berupa teks" })
        .max(100, "q maksimal 100 karakter")
        .optional(),
      page: z
        .string({ error: pageMsg })
        .regex(/^[1-9]\d{0,2}$/, pageMsg)
        .refine((v) => Number(v) <= MAX_PAGE, pageMsg)
        .optional(),
    },
    strictOptions,
  )
  .refine(
    (d) => (d.q ?? "").trim() !== "" || Number(d.page ?? 1) <= MAX_TOP_PAGE,
    {
      path: ["page"],
      error: `Daftar top dibatasi maksimal ${MAX_TOP_PAGE} halaman`,
    },
  );
