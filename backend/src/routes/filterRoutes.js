const express = require("express");
const router = express.Router();
const filterController = require("../controllers/filter/filterController.js"); // Replace with the actual path to your filterController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.get('/filters', authenticateToken, filterController.filterLeads);



module.exports = router;
