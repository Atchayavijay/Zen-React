const bcrypt = require("bcryptjs");

// Hash a plain-text password
const hashPassword = (password) => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
};

// Verify a password against a hash
const verifyPassword = (password, hash) => {
  return bcrypt.compareSync(password, hash);
};

module.exports = { hashPassword, verifyPassword };
