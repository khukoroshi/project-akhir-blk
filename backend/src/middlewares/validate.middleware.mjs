import AppError from "../utils/appError.mjs";

// Reusable middleware: validate(schema) checks req.body against a Zod schema.
export const validate = (schema) => (req, res, next) => {
  // Express 5 leaves req.body undefined when no body was sent
  const result = schema.safeParse(req.body ?? {});

  if (!result.success) {
    const message = result.error.issues[0]?.message || "Data tidak valid";
    return next(new AppError(message, 400));
  }

  // Replace body with the cleaned data (trimmed, lowercased, etc.)
  req.body = result.data;
  next();
};
