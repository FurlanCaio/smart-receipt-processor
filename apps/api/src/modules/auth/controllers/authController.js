const authService = require("../services/authService");
const { AppError } = require("../../../errors/AppError");
const handleControllerError = require('../../../middlewares/errorHandler');

async function register(req, res) {
  try {
    const { email, password } = req.body;

    const result = await authService.registerService({ email, password });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleControllerError(error, res, 'register');
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const { accessToken, refreshToken } = await authService.loginService({
      email,
      password,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    handleControllerError(error, res, 'login');
  }
}

async function refresh(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;

    const { accessToken } = await authService.refreshTokenService(refreshToken);

    res.status(200).json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    handleControllerError(error, res, 'refresh');
  }
}

async function logout(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token not found",
        code: "MISSING_TOKEN"
      });
    }

    await authService.logoutService(refreshToken, req.userId);

    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "strict",
    });

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    handleControllerError(error, res, 'logout');
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
};
