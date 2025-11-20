const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth/authController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);

module.exports = router;

