// Meta Campaign Routes
const express = require("express");
const router = express.Router();
const metaCampaignController = require("../controllers/meta/metaCampaignController");

// CRUD routes
router.get("/", metaCampaignController.getAllMetaCampaigns);
router.get("/:id", metaCampaignController.getMetaCampaignById);
router.post("/", metaCampaignController.createMetaCampaign);
router.put("/:id", metaCampaignController.updateMetaCampaign);
router.delete("/:id", metaCampaignController.deleteMetaCampaign);

module.exports = router;
