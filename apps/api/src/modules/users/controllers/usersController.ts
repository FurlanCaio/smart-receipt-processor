import usersService from "../services/usersService.js";
import type {
  ApiKeyInput,
  ChangePasswordInput,
  UpdatePreferencesInput,
  UpdateProfileInput,
} from "../services/usersService.js";
import { AuthenticationError, ValidationError } from "../../../errors/AppError.js";
import { handleControllerError } from "../../../middlewares/errorHandler.js";
import type { Request, Response } from "express";

function getAuthenticatedUserId(req: { userId?: string }): string {
  if (!req.userId) {
    throw new AuthenticationError("User is not authenticated", "INVALID_USER");
  }
  return req.userId;
}

async function getProfile(req: Request, res: Response) {
  try {
    const result = await usersService.getProfileService(getAuthenticatedUserId(req));
    res.status(200).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function insertApiKey(
  req: Request<Record<string, never>, unknown, ApiKeyInput>,
  res: Response,
) {
  try {
    if (!req.body.apiKey) {
      throw new ValidationError("API key is required", "MISSING_API_KEY");
    }

    const result = await usersService.insertApiKeyService({
      userId: getAuthenticatedUserId(req),
      apiKey: req.body.apiKey,
    });
    res.status(201).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function uploadFile(req: Request, res: Response) {
  try {
    if (!req.file) {
      throw new ValidationError("No file uploaded", "MISSING_FILE");
    }

    const result = await usersService.uploadFileService(
      req.file,
      getAuthenticatedUserId(req),
    );
    res.status(200).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function updateProfile(
  req: Request<Record<string, never>, unknown, UpdateProfileInput>,
  res: Response,
) {
  try {
    const result = await usersService.updateProfileService(
      getAuthenticatedUserId(req),
      req.body,
    );
    res.status(200).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function deleteAvatar(req: Request, res: Response) {
  try {
    await usersService.deleteAvatarService(getAuthenticatedUserId(req));
    res.status(200).json({ message: "Avatar deleted successfully" });
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function getPreferences(req: Request, res: Response) {
  try {
    const result = await usersService.getPreferencesService(getAuthenticatedUserId(req));
    res.status(200).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function changePassword(
  req: Request<Record<string, never>, unknown, ChangePasswordInput>,
  res: Response,
) {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const result = await usersService.changePasswordService(
      getAuthenticatedUserId(req),
      currentPassword,
      newPassword,
      confirmNewPassword,
    );
    res.status(200).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function deleteAccount(req: Request, res: Response) {
  try {
    const result = await usersService.deleteAccountService(getAuthenticatedUserId(req));
    res.status(200).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function updatePreferences(
  req: Request<Record<string, never>, unknown, UpdatePreferencesInput>,
  res: Response,
) {
  try {
    const { openAiPreferenceModel, openAiPreferenceTemperature } = req.body;
    const result = await usersService.updatePreferencesService(
      getAuthenticatedUserId(req),
      openAiPreferenceModel,
      openAiPreferenceTemperature,
    );
    res.status(200).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
}

export default {
  insertApiKey,
  uploadFile,
  updatePreferences,
  getProfile,
  deleteAvatar,
  updateProfile,
  changePassword,
  deleteAccount,
  getPreferences,
};
