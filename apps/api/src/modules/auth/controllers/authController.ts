import { authService } from "../services/authService.js";
import type { AuthBody } from "../services/authService.js";
import { handleControllerError } from '../../../middlewares/errorHandler.js';
import type { Request, Response } from 'express';

async function register(
  req: Request<Record<string, never>, unknown, AuthBody>,
  res: Response,
) {
  try {
    const { email, password } = req.body;

    const result = await authService.registerService({ email, password });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleControllerError(error, res);
  }
}

async function login(
  req: Request<Record<string, never>, unknown, AuthBody>,
  res: Response,
) {
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
    handleControllerError(error, res);
  }
}

async function refresh(req: Request, res: Response) {
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
    handleControllerError(error, res);
  }
}

async function logout(req: Request, res: Response) {
  try {
    if (!req.userId) {
    return res.status(401).json({
      success: false,
      message: "User is not authenticated",
    });
  }

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
    handleControllerError(error, res);
  }
}

export const authController = {
  register,
  login,
  refresh,
  logout
}
