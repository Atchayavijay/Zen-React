const crypto = require("crypto");
const pool = require("../config/db");

const ensureTable = pool.query(`
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
`);

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const storeRefreshToken = async (userId, token, expiresAt) => {
  await ensureTable;
  const tokenHash = hashToken(token);
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (token_hash) DO UPDATE SET expires_at = EXCLUDED.expires_at, user_id = EXCLUDED.user_id`,
    [userId, tokenHash, expiresAt]
  );
};

const findRefreshToken = async (token) => {
  await ensureTable;
  const tokenHash = hashToken(token);
  const { rows } = await pool.query(
    `SELECT id, user_id, expires_at FROM refresh_tokens WHERE token_hash = $1`,
    [tokenHash]
  );
  return rows[0];
};

const deleteRefreshToken = async (token) => {
  await ensureTable;
  const tokenHash = hashToken(token);
  await pool.query(`DELETE FROM refresh_tokens WHERE token_hash = $1`, [tokenHash]);
};

const deleteTokensForUser = async (userId) => {
  await ensureTable;
  await pool.query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [userId]);
};

const purgeExpiredTokens = async () => {
  await ensureTable;
  await pool.query(`DELETE FROM refresh_tokens WHERE expires_at <= NOW()`);
};

module.exports = {
  storeRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  deleteTokensForUser,
  purgeExpiredTokens,
};
