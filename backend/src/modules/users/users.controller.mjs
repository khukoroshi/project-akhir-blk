import {
  getProfile,
  updateOwnProfile,
  followUser,
  unfollowUser,
} from "./users.service.mjs";

export const getUserProfile = async (req, res) => {
  const data = await getProfile(req.params.username.trim(), req.user?.id);
  res.status(200).json({ status: "success", data });
};

export const updateMyProfile = async (req, res) => {
  const data = await updateOwnProfile(req.user.id, req.body);
  res.status(200).json({ status: "success", data });
};

export const followUserHandler = async (req, res) => {
  const data = await followUser(req.user.id, req.params.username.trim());
  res.status(200).json({ status: "success", data });
};

export const unfollowUserHandler = async (req, res) => {
  const data = await unfollowUser(req.user.id, req.params.username.trim());
  res.status(200).json({ status: "success", data });
};
