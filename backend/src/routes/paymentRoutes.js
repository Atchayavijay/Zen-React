const express = require("express");
const router = express.Router();
const { getPayments } = require("../controllers/payments/paymentsController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.get("/payments", authenticateToken, getPayments);

module.exports = router;
