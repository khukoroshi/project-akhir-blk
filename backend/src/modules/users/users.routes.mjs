import { Router } from "express";
import { protect, optionalAuth } from "../../middlewares/auth.middleware.mjs";
import { validate } from "../../middlewares/validate.middleware.mjs"; // sesuaikan jenis ekspor
import {
  updateProfileSchema,
  usernameParamSchema,
} from "./users.validator.mjs";
import {
  getUserProfile,
  updateMyProfile,
  followUserHandler,
  unfollowUserHandler,
} from "./users.controller.mjs";

// Factory because the per-user limiter is injected from app.mjs.
export const createUsersRoutes = (limiters) => {
  const router = Router();

  router.put(
    "/profile",
    protect,
    limiters.profileUpdate,
    validate(updateProfileSchema),
    updateMyProfile,
  );

  router.get(
    "/:username",
    optionalAuth,
    validate(usernameParamSchema, "params"),
    getUserProfile,
  );

  // Both routes share ONE limiter instance, so follow + unfollow count together.
  router.post(
    "/:username/follow",
    protect,
    limiters.follow,
    validate(usernameParamSchema, "params"),
    followUserHandler,
  );

  router.delete(
    "/:username/follow",
    protect,
    limiters.follow,
    validate(usernameParamSchema, "params"),
    unfollowUserHandler,
  );

  return router;
};
