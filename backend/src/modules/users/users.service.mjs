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

  const [stats, counts, isFollowing] = await Promise.all([
    isPrivate && !isSelf ? null : getUserStats(row.us_id),
    User.getFollowCounts(row.us_id),
    viewerId != null && !isSelf ? User.isFollowing(viewerId, row.us_id) : false,
  ]);

  return {
    username: row.us_name,
    displayName: row.display_name ?? row.us_name,
    bio: row.bio ?? null,
    isPrivate,
    joinedAt: new Date(row.us_created_at).toISOString(),
    isSelf,
    followersCount: counts.followersCount,
    followingCount: counts.followingCount,
    isFollowing,
    stats,
  };
};

const USER_NOT_FOUND = "User not found";

export const getProfile = async (username, viewerId) => {
  const row = await User.findProfileByUsername(username);
  if (!row) throw new AppError(USER_NOT_FOUND, 404);
  return buildProfile(row, viewerId);
};

export const updateOwnProfile = async (userId, input) => {
  await User.upsertProfile(userId, input);
  const row = await User.findProfileById(userId);
  if (!row) throw new AppError(USER_NOT_FOUND, 404);
  return buildProfile(row, userId);
};

const resolveFollowTarget = async (viewerId, username) => {
  const target = await User.findIdByUsername(username);
  if (!target) throw new AppError(USER_NOT_FOUND, 404);
  if (target.us_id === viewerId) {
    throw new AppError("You cannot follow yourself", 400);
  }
  return target;
};

export const followUser = async (viewerId, username) => {
  const target = await resolveFollowTarget(viewerId, username);
  await User.follow(viewerId, target.us_id);
  const { followersCount } = await User.getFollowCounts(target.us_id);
  return { username: target.us_name, isFollowing: true, followersCount };
};

export const unfollowUser = async (viewerId, username) => {
  const target = await resolveFollowTarget(viewerId, username);
  await User.unfollow(viewerId, target.us_id);
  const { followersCount } = await User.getFollowCounts(target.us_id);
  return { username: target.us_name, isFollowing: false, followersCount };
};
