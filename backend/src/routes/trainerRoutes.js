const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authMiddleware");
const trainerController = require("../controllers/trainer/trainerController");
const apiKeyMiddleware = require("../middlewares/apikey");

// Fetch all trainers
router.get("/", authenticateToken, trainerController.getAllTrainers);

// Create a new trainer
router.post("/", authenticateToken, trainerController.createTrainer);

// Update trainer details (PUT request)
router.put("/:id", authenticateToken, trainerController.updateTrainer);

// Delete trainer by ID
router.delete("/:id", authenticateToken, trainerController.deleteTrainer);

router.get(
  "/trainer-payouts",
  authenticateToken,
  trainerController.getAllTrainerPayouts
);

router.put(
  "/trainer-payouts/:payoutId/status",
  trainerController.updateTrainerPayoutStatus
);

router.post(
  "/send-email-payouts",
  authenticateToken,
  trainerController.sendTrainerPayoutSummary
);



// Fetch all trainers
router.get("/progz", apiKeyMiddleware, trainerController.getAllTrainers);

module.exports = router;
