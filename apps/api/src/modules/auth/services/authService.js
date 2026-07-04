const User = require("../../../../../../packages/database/src/models/User.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const RefreshToken = require("../../../../../../packages/database/src/models/RefreshToken.js");
const crypto = require("crypto");
const {
  ValidationError,
  AuthenticationError,
  ResourceGoneError,
  ConfigurationError,
} = require("../../../errors/AppError.js");

async function registerService({ email, password }) {
  if (!email || !password) {
    throw new ValidationError("Email and password are required", "MISSING_CREDENTIALS");
  }
  try {
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    
    await newUser.save();

    return {
      message: "User registered successfully",
      userId: newUser._id,
      email: newUser.email,
    };

  } catch (error) {

    if (error.code === 11000) {
      throw new ValidationError("Email already in use", "EMAIL_ALREADY_EXISTS");
    }

    throw error;
  }
}

async function loginService({ email, password }) {
  if (!email || !password) {
    throw new ValidationError("Email and password are required", "MISSING_CREDENTIALS");
  }

  const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
  const accessSecret = process.env.JWT_SECRET;

  if (!refreshSecret || !accessSecret) {
    throw new ConfigurationError("Token secrets not configured", "MISSING_SECRETS");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new AuthenticationError("Invalid email or password", "USER_NOT_FOUND");
  }

  if (user.isDeleted) {
    throw new ResourceGoneError(
      "This account has been deleted. Contact support if this was a mistake.",
      "ACCOUNT_DELETED"
    );
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new AuthenticationError("Invalid email or password", "INVALID_PASSWORD");
  }

  const refreshToken = jwt.sign(
    { id: user._id, type: "refresh" },
    refreshSecret,
    { expiresIn: "7d", algorithm: "HS256" }
  );

  const tokenHash = crypto
    .createHmac("sha256", refreshSecret)
    .update(refreshToken)
    .digest("hex");

  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  const accessToken = jwt.sign({ userId: user._id }, accessSecret, {
    expiresIn: "1h",
  });

  return { accessToken, refreshToken };
}

async function refreshTokenService(token) {
  if (!token) {
    throw new ValidationError("Token is required", "MISSING_TOKEN");
  }

  const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
  const accessSecret = process.env.JWT_SECRET;

  if (!refreshSecret || !accessSecret) {
    throw new ConfigurationError("Token secrets not configured", "MISSING_SECRETS");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, refreshSecret);
  } catch (err) {
    throw new AuthenticationError("Invalid refresh token", "INVALID_TOKEN");
  }

  const tokenHash = crypto
    .createHmac("sha256", refreshSecret)
    .update(token)
    .digest("hex");

  const storedToken = await RefreshToken.findOne({ tokenHash });

  if (!storedToken) {
    throw new AuthenticationError("Refresh token not found in database", "TOKEN_NOT_IN_DB");
  }

  if (storedToken.expiresAt < new Date()) {
    throw new AuthenticationError("Refresh token expired", "TOKEN_EXPIRED");
  }

  const accessToken = jwt.sign(
    { userId: decoded.id },
    accessSecret,
    { expiresIn: "1h" }
  );

  return { accessToken };
}

async function logoutService(token, userId) {
  if (!token) {
    throw new ValidationError("Token is required", "MISSING_TOKEN");
  }

  if (!userId) {
    throw new AuthenticationError("User ID is required", "INVALID_USER");
  }

  const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

  if (!refreshSecret) {
    throw new ConfigurationError("Token secrets not configured", "MISSING_SECRETS");
  }

  const tokenHash = crypto
    .createHmac("sha256", refreshSecret)
    .update(token)
    .digest("hex");

  await RefreshToken.deleteOne({ userId, tokenHash });

  return { message: "Logout successful" };
}

module.exports = {
  registerService,
  loginService,
  refreshTokenService,
  logoutService,
};
