import { Router } from "express";
import { protect, optionalAuth } from "../../middlewares/auth.middleware.mjs";
import { validate } from "../../middlewares/validate.middleware.mjs"; // sesuaikan jenis ekspor
import { getUserProfile, updateMyProfile } from "./users.controller.mjs";
import {
  updateProfileSchema,
  usernameParamSchema,
} from "./users.validator.mjs";

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

  return router;
};
