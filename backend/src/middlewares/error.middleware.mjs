import env from "../config/env.mjs";

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || "error";

  res.status(statusCode).json({
    status,
    message: err.message || "Internal Server Error",
    ...(env.nodeEnv === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
