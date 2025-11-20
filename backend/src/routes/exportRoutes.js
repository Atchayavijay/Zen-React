const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authMiddleware");
const exportLeadController = require("../controllers/export/exportLeadController");

// Export Leads Route
router.get("/", authenticateToken, exportLeadController.exportLeads);

module.exports = router;
