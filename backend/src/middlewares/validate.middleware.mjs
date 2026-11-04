import AppError from "../utils/appError.mjs";

const SOURCES = ["body", "params", "query"];

// validate(schema)            -> checks req.body (same as before)
// validate(schema, "params")  -> checks req.params (no overwrite)
// validate(schema, "query")   -> checks req.query (no overwrite, Express 5)
export const validate = (schema, source = "body") => {
  if (!SOURCES.includes(source)) {
    throw new Error(`validate: unknown source "${source}"`);
  }

  return (req, res, next) => {
    // Express 5 leaves req.body undefined when no body was sent
    const result = schema.safeParse(req[source] ?? {});

    if (!result.success) {
      const message = result.error.issues[0]?.message || "Data tidak valid";
      return next(new AppError(message, 400));
    }

    // Only body is replaced with cleaned data (defaults, trim, etc.)
    if (source === "body") req.body = result.data;
    next();
  };
};
