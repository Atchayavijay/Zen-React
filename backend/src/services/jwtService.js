const jwt = require("jsonwebtoken");
require("dotenv").config();

const accessTokenSecret = process.env.JWT_SECRET;
const refreshTokenSecret =
  process.env.REFRESH_TOKEN_SECRET || `${process.env.JWT_SECRET || "default"}_refresh`;

const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "7d";
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";

const parseExpiryToMs = (expiry, fallbackMs) => {
  if (!expiry || typeof expiry !== "string") return fallbackMs;
  const match = expiry.trim().toLowerCase().match(/^([0-9]+)([smhd])$/);
  if (!match) return fallbackMs;
  const value = Number(match[1]);
  const unit = match[2];
  const unitMap = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * (unitMap[unit] || fallbackMs);
};

const ACCESS_TOKEN_MAX_AGE = parseExpiryToMs(ACCESS_TOKEN_EXPIRY, 7 * 24 * 60 * 60 * 1000);
const REFRESH_TOKEN_MAX_AGE = parseExpiryToMs(REFRESH_TOKEN_EXPIRY, 7 * 24 * 60 * 60 * 1000);

const generateAccessToken = (payload, options = {}) =>
  jwt.sign(payload, accessTokenSecret, { expiresIn: ACCESS_TOKEN_EXPIRY, ...options });

const generateRefreshToken = (payload, options = {}) =>
  jwt.sign(payload, refreshTokenSecret, { expiresIn: REFRESH_TOKEN_EXPIRY, ...options });

const verifyAccessToken = (token) => jwt.verify(token, accessTokenSecret);

const verifyRefreshToken = (token) => jwt.verify(token, refreshTokenSecret);

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
};
