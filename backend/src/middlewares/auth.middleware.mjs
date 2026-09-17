import jwt from "jsonwebtoken";
import AppError from "../utils/appError.mjs";

export const protect = (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("Anda belum login. Silakan bawa token Anda.", 401),
    );
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    next(
      new AppError(
        "Token tidak valid atau sudah kadaluarsa. Silahkan login lagi",
        401,
      ),
    );
  }
};
