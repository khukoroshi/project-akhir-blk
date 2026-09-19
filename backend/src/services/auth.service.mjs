import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import db from "../config/db.mjs";
import AppError from "../utils/appError.mjs";

// Fungsi untuk Register
export const registerUser = async (data) => {
  const { name, email, password } = data;

  const queryEmail = "SELECT us_id FROM users WHERE us_email = ?";
  const [existingUser] = await db.execute(queryEmail, [email]);

  if (existingUser.length > 0) {
    throw new AppError("Email sudah digunakan", 400);
  }

  // Hash Password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const [result] = await db.execute("CALL sp_insert_user(?, ?, ?)", [
    name,
    email,
    hashedPassword,
  ]);
  // Ambil new_us_id dari baris pertama hasil Stored Procedure

  const newUserId = result[0][0].new_us_id;
  return {
    us_id: newUserId,
    us_name: name,
    us_email: email,
  };
};

// Fungsi untuk Login
export const loginUser = async (email, password) => {
  // Mencari user berdasarkan email di MySQL
  const queryUser = "SELECT * FROM users WHERE us_email = ?";
  const [rows] = await db.execute(queryUser, [email]);

  // Jika user tidak ditemukan
  if (rows.length === 0) {
    throw new AppError("Email atau password salah", 401);
  }
  const user = rows[0];
  // Cek Password
  const isMatch = await bcrypt.compare(password, user.us_password);
  if (!isMatch) {
    throw new AppError("Email atau password salah", 401);
  }

  // Buat token JWT
  const token = jwt.sign(
    { id: user.us_id, name: user.us_name, email: user.us_email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );

  return {
    user: {
      id: user.us_id,
      name: user.us_name,
      email: user.us_email,
    },
    token,
  };
};
