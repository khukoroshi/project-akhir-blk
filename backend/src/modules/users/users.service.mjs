import AppError from "../../utils/appError.mjs";
import { getUserStats } from "../watchlist/index.mjs";
import User from "./users.model.mjs";

export const isEmailTaken = (email) => User.emailExists(email);
export const findUserByEmail = (email) => User.findByEmail(email);
export const createUser = (data) => User.create(data);

// Never include email, password hash, or us_id in this shape.
const buildProfile = async (row, viewerId) => {
  const isSelf = viewerId != null && viewerId === row.us_id;
  const isPrivate = Boolean(row.is_private);
  const stats = isPrivate && !isSelf ? null : await getUserStats(row.us_id);

  return {
    username: row.us_name,
    displayName: row.display_name ?? row.us_name,
    bio: row.bio ?? null,
    isPrivate,
    joinedAt: new Date(row.us_created_at).toISOString(),
    isSelf,
    stats,
  };
};

export const getProfile = async (username, viewerId) => {
  const row = await User.findProfileByUsername(username);
  if (!row) throw new AppError("Pengguna tidak ditemukan", 404);
  return buildProfile(row, viewerId);
};

export const updateOwnProfile = async (userId, input) => {
  await User.upsertProfile(userId, input);
  const row = await User.findProfileById(userId);
  if (!row) throw new AppError("Pengguna tidak ditemukan", 404);
  return buildProfile(row, userId);
};
