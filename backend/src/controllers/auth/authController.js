const bcrypt = require("bcryptjs");
const pool = require("../../config/db");
const jwtService = require("../../services/jwtService");
const refreshTokenService = require("../../services/refreshTokenService");

const isProduction = process.env.NODE_ENV === "production";

const buildRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: jwtService.REFRESH_TOKEN_MAX_AGE,
  path: "/",
});

const createAuthPayload = (user) => ({
  id: user.id,
  r_id: user.role_id,
});

exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required." });
  }

  try {
    const { rows } = await pool.query(
      `SELECT 
          user_id   AS id, 
          username, 
          password  AS hash, 
          role_id,
          profile_image
       FROM users 
      WHERE username = $1`,
      [username]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.hash);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const payload = createAuthPayload(user);
    const accessToken = jwtService.generateAccessToken(payload);
    const refreshToken = jwtService.generateRefreshToken(payload);

    await refreshTokenService.deleteTokensForUser(user.id);
    await refreshTokenService.storeRefreshToken(
      user.id,
      refreshToken,
      new Date(Date.now() + jwtService.REFRESH_TOKEN_MAX_AGE)
    );

    refreshTokenService.purgeExpiredTokens().catch((err) => {
      console.warn("Failed to purge expired refresh tokens", err);
    });

    // Convert profile_image buffer to base64
    const bufferToBase64 = (value) =>
      Buffer.isBuffer(value) ? value.toString("base64") : null;

    res
      .cookie("refreshToken", refreshToken, buildRefreshCookieOptions())
      .status(200)
      .json({
        token: accessToken,
        accessToken,
        role_id: user.role_id,
        r_id: user.role_id,
        username: user.username,
        profile_image: bufferToBase64(user.profile_image),
        expiresIn: jwtService.ACCESS_TOKEN_EXPIRY,
      });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
};

exports.logout = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  try {
    if (refreshToken) {
      await refreshTokenService.deleteRefreshToken(refreshToken);
    }

    res.clearCookie("refreshToken", {
      ...buildRefreshCookieOptions(),
      maxAge: undefined,
    });

    let userId = req.user?.id || req.user?.userId;
    let username = req.user?.username;

    if (!userId && refreshToken) {
      try {
        const payload = jwtService.verifyRefreshToken(refreshToken);
        userId = payload.id;
        username = payload.username;
      } catch (err) {
        // ignore invalid refresh token when attempting to log
      }
    }

    if (!username && userId) {
      try {
        const { rows } = await pool.query(
          "SELECT username FROM users WHERE user_id = $1",
          [userId]
        );
        username = rows[0]?.username;
      } catch (err) {
        console.warn("Failed to fetch username for logout logging", err);
      }
    }

    if (username) {
      await pool.query(
        "INSERT INTO user_logs (username, action, timestamp) VALUES ($1, $2, $3)",
        [username, "Logout", new Date()]
      );
    }

    res.status(200).json({
      success: true,
      message: "Logout action completed successfully.",
    });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Failed to complete logout." });
  }
};

exports.refreshToken = async (req, res) => {
  const incomingToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingToken) {
    return res.status(401).json({ error: "Refresh token missing." });
  }

  try {
    const payload = jwtService.verifyRefreshToken(incomingToken);
    const tokenRecord = await refreshTokenService.findRefreshToken(
      incomingToken
    );

    if (!tokenRecord || tokenRecord.user_id !== payload.id) {
      if (tokenRecord) {
        await refreshTokenService.deleteRefreshToken(incomingToken);
      }
      return res.status(401).json({ error: "Invalid refresh token." });
    }

    if (new Date(tokenRecord.expires_at) <= new Date()) {
      await refreshTokenService.deleteRefreshToken(incomingToken);
      return res.status(401).json({ error: "Refresh token expired." });
    }

    await refreshTokenService.deleteRefreshToken(incomingToken);

    const userPayload = {
      id: payload.id,
      r_id: payload.r_id,
    };

    const accessToken = jwtService.generateAccessToken(userPayload);
    const newRefreshToken = jwtService.generateRefreshToken(userPayload);

    await refreshTokenService.storeRefreshToken(
      payload.id,
      newRefreshToken,
      new Date(Date.now() + jwtService.REFRESH_TOKEN_MAX_AGE)
    );

    refreshTokenService.purgeExpiredTokens().catch((err) => {
      console.warn("Failed to purge expired refresh tokens", err);
    });

    res
      .cookie("refreshToken", newRefreshToken, buildRefreshCookieOptions())
      .status(200)
      .json({
        token: accessToken,
        accessToken,
        role_id: payload.r_id,
        r_id: payload.r_id,
      });
  } catch (error) {
    console.error("Refresh token error:", error);
    await refreshTokenService.deleteRefreshToken(incomingToken).catch(() => {});
    res.status(401).json({ error: "Invalid refresh token." });
  }
};
