import { Router } from "express";
import usersController from "../controllers/usersController.js";
import type {
  ApiKeyInput,
  ChangePasswordInput,
  UpdatePreferencesInput,
  UpdateProfileInput,
} from "../services/usersService.js";
import { ensureAuthenticated } from "../../../middlewares/ensureAuthenticated.js";
import upload from "../multer.js";

const usersRoutes = Router();

usersRoutes.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});
usersRoutes.post("/upload", ensureAuthenticated, upload.single("file"), usersController.uploadFile);
usersRoutes.delete("/avatar", ensureAuthenticated, usersController.deleteAvatar);
usersRoutes.put<Record<string, never>, unknown, ApiKeyInput>("/apiKey", ensureAuthenticated, usersController.insertApiKey);
usersRoutes.get("/profile", ensureAuthenticated, usersController.getProfile);
usersRoutes.put<Record<string, never>, unknown, UpdateProfileInput>("/profile", ensureAuthenticated, usersController.updateProfile);
usersRoutes.put<Record<string, never>, unknown, ChangePasswordInput>("/change-password", ensureAuthenticated, usersController.changePassword);
usersRoutes.delete("/delete-account", ensureAuthenticated, usersController.deleteAccount);
usersRoutes.get("/preferences", ensureAuthenticated, usersController.getPreferences);
usersRoutes.put<Record<string, never>, unknown, UpdatePreferencesInput>("/preferences", ensureAuthenticated, usersController.updatePreferences);

export default usersRoutes;
