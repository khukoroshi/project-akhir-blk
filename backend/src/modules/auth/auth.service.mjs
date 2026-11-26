import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import env from "../../config/env.mjs";
import AppError from "../../utils/appError.mjs";
import { isEmailTaken, findUserByEmail, createUser } from "../users/index.mjs";

// Fungsi untuk Register
export const registerUser = async (data) => {
  const { name, email, password } = data;

  if (await isEmailTaken(email)) {
    throw new AppError("Email is already registered", 400);
  }

  // Hash Password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  let newUserId;
  try {
    newUserId = await createUser({ name, email, hashedPassword });
  } catch (error) {
    // Safety net for race conditions: the pre-check above can pass
    // while another request inserts the same value first.
    if (error.code === "ER_DUP_ENTRY") {
      const message = error.sqlMessage || error.message || "";
      const key = message.match(/for key '([^']+)'/)?.[1] || "";

      if (key.endsWith("us_name")) {
        throw new AppError("Name is already taken", 400);
      }
      if (key.endsWith("us_email")) {
        throw new AppError("Email is already registered", 400);
      }
      throw new AppError("Name or email is already in use", 400);
    }
    throw error;
  }

  return {
    us_id: newUserId,
    us_name: name,
    us_email: email,
  };
};

// Fungsi untuk Login
export const loginUser = async (email, password) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  // Cek Password
  const isMatch = await bcrypt.compare(password, user.us_password);
  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  // Buat token JWT
  const token = jwt.sign(
    { id: user.us_id, name: user.us_name, email: user.us_email },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn },
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
