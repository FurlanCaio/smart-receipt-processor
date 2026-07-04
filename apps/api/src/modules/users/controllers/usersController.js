const usersService = require("../services/usersService");
const { AppError } = require("../../../errors/AppError");

function handleControllerError(error, res) {
  if (error.name === "ValidationError" && error.errors) {
    const messages = Object.values(error.errors).map((err) => err.message);
    return res.status(400).json({
      success: false,
      message: "Erro de validação nos campos informados.",
      code: "MONGOOSE_VALIDATION_ERROR",
      errors: messages,
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
    });
  }

  if (error.message.includes("not found")) {
    return res
      .status(404)
      .json({ success: false, message: error.message, code: "NOT_FOUND" });
  }
  if (
    error.message.includes("is required") ||
    error.message.includes("Invalid") ||
    error.message.includes("do not match")
  ) {
    return res
      .status(400)
      .json({ success: false, message: error.message, code: "BAD_REQUEST" });
  }
  if (error.message.includes("incorrect")) {
    return res
      .status(401)
      .json({ success: false, message: error.message, code: "UNAUTHORIZED" });
  }

  return res.status(500).json({
    success: false,
    message: error.message || "Internal Server Error",
    code: "INTERNAL_SERVER_ERROR",
  });
}

async function getProfile(req, res) {
  try {
    const userId = req.userId;
    const result = await usersService.getProfileService(userId);
    res.status(200).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function insertApiKey(req, res) {
  try {
    const { apiKey } = req.body;
    const userId = req.userId;

    if (!apiKey) {
      return res
        .status(400)
        .json({
          success: false,
          message: "API key is required",
          code: "BAD_REQUEST",
        });
    }

    const result = await usersService.insertApiKeyService({ userId, apiKey });
    res.status(201).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function uploadFile(req, res) {
  try {
    const file = req.file;

    if (!file) {
      return res
        .status(400)
        .json({
          success: false,
          message: "No file uploaded",
          code: "BAD_REQUEST",
        });
    }

    if (!req.userId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "User ID is required",
          code: "BAD_REQUEST",
        });
    }

    const result = await usersService.uploadFileService(file, req.userId);
    return res.status(200).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function updateProfile(req, res) {
  try {
    const userId = req.userId;
    const { name, phoneNumber, company } = req.body;

    const result = await usersService.updateProfileService(userId, {
      name,
      phoneNumber,
      company,
    });
    res.status(200).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function deleteAvatar(req, res) {
  try {
    const userId = req.userId;
    await usersService.deleteAvatarService(userId);
    res.status(200).json({ message: "Avatar deleted successfully" });
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function getPreferences(req, res) {
  try {
    const userId = req.userId;
    const result = await usersService.getPreferencesService(userId);
    res.status(200).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function changePassword(req, res) {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    const result = await usersService.changePasswordService(
      userId,
      currentPassword,
      newPassword,
      confirmNewPassword,
    );
    res.status(200).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function deleteAccount(req, res) {
  try {
    const userId = req.userId;
    const result = await usersService.deleteAccountService(userId);
    res.status(200).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function updatePreferences(req, res) {
  try {
    const userId = req.userId;
    const { openAiPreferenceModel, openAiPreferenceTemperature } = req.body;

    const result = await usersService.updatePreferencesService(
      userId,
      openAiPreferenceModel,
      openAiPreferenceTemperature,
    );
    res.status(200).json(result);
  } catch (error) {
    handleControllerError(error, res);
  }
}

module.exports = {
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
