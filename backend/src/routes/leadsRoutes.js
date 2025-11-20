// Import necessary modules
const express = require("express");
const router = express.Router();
const multer = require("multer");
const apiKeyMiddleware = require("../middlewares/apikey");

// Import controllers for lead-related operations
const {
  leadController,
  archiveController,
  onHoldController,
  batchController,
  cardTypesController,
  unitController,
  sourceController,
  roleController,
  paymentsController,
  placementPaymentsController,
} = require("../controllers/leads");

// Import middleware for authentication (protects routes from unauthorized access)
const { authenticateToken } = require("../middlewares/authMiddleware");

// Configure Multer for file uploads, storing files in the "uploads/" directory
const upload = multer({ dest: "uploads/" });

/* ====================================================================================
   LEAD MANAGEMENT ROUTES
   ==================================================================================== */

// GET: All trainer shares for a lead
router.get(
  "/:lead_id/trainer-shares",
  authenticateToken,
  paymentsController.getTrainerSharesForLead
);
// GET: All installments for a lead
router.get(
  "/:lead_id/installments",
  authenticateToken,
  paymentsController.getInstallmentsForLead
);

// POST: Add a new lead
// This route accepts lead details (e.g., name, contact info, course) and creates a new lead in the database
router.post("/", authenticateToken, leadController.addLead);

// GET: Fetch all leads with optional filters
// This route retrieves leads, optionally filtered by course, status, trainer, etc.
router.get("/", authenticateToken, leadController.getLeads);

// PUT: Update an existing lead by ID
// This route updates the details of an existing lead using their unique lead ID
router.put("/:id", authenticateToken, leadController.updateLead);

// DELETE: Delete a lead by ID
// This route removes a lead from the system (logical deletion or archival, depending on implementation)
router.delete("/:id", authenticateToken, leadController.deleteLead);

//Drag and Drop Updating only status
router.patch("/status/:id", authenticateToken, leadController.updateStatusLead);

// New API: Get all leads with status = 'trainingprogress'
router.get(
  "/trainingprogress",
  apiKeyMiddleware,
  leadController.getTrainingProgressLeads
);

/* ====================================================================================
   ARCHIVE AND RESTORE ROUTES
   ==================================================================================== */

// POST: Not applicable for archiving leads

// GET: Retrieve all archived leads
// This route fetches leads that have been marked as archived
router.get("/archived", authenticateToken, archiveController.getArchivedLeads);

// PUT: Archive a lead by ID
// This route updates a lead's status to "Archived" using their unique lead ID
router.put("/archive/:id", authenticateToken, archiveController.archiveLead);

// PUT: Restore an archived lead by ID
// This route changes the status of an archived lead back to "Active" or a specified status
router.put("/restore/:id", authenticateToken, archiveController.restoreLead);

// DELETE: Not applicable for archiving leads

/* ====================================================================================
   ON-HOLD LEAD MANAGEMENT ROUTES
   ==================================================================================== */

// Fetch on-hold leads
router.get("/onhold", authenticateToken, onHoldController.getOnHoldLeads);

// PUT: Move a lead to on-hold status by ID
router.put("/onhold/:id", authenticateToken, onHoldController.moveToOnHold);

// PUT: Restore a lead from on-hold status by ID
router.put(
  "/restore-onhold/:id",
  authenticateToken,
  onHoldController.restoreFromOnHold
);

/* ====================================================================================
   BATCH MANAGEMENT ROUTES
   ==================================================================================== */

// ========== BATCH MANAGEMENT ROUTES ==========
router.get("/batches", authenticateToken, batchController.getBatches);
router.post("/batches", authenticateToken, batchController.createBatch);
router.put(
  "/batches/:batch_id",
  authenticateToken,
  batchController.updateBatch
);
router.delete(
  "/batches/:batch_id",
  authenticateToken,
  batchController.deleteBatch
);
router.get(
  "/batches/distinct",
  authenticateToken,
  batchController.getDistinctBatches
);

//Batch_trainers

router.post(
  "/batch/:batch_id/trainers",
  batchController.addOrUpdateBatchTrainer
);
router.put("/batch/:batch_id/trainers", batchController.updateAllBatchTrainers);
router.delete(
  "/batch/:batch_id/trainers/:trainer_id",
  batchController.removeBatchTrainer
);
router.get("/batch/:batch_id/trainers", batchController.getBatchTrainers);
router.get("/trainer/:trainer_id/batches", batchController.getTrainerBatches);
// Get students (leads) in a batch
router.get(
  "/batches/:batch_id/leads",
  authenticateToken,
  batchController.getBatchLeads
);

//installments


// GET: Payment info for a lead
router.get(
  "/:lead_id/payment-info",
  authenticateToken,
  paymentsController.getPaymentInfo
);

// Placement payments
router.get(
  "/:lead_id/placement-payments",
  authenticateToken,
  placementPaymentsController.getPlacementPaymentInfo
);
router.post(
  "/:lead_id/placement-payments",
  authenticateToken,
  placementPaymentsController.recordPlacementPayment
);

// GET: Lead details by lead_id (must be after more specific routes)
// Restrict to numeric lead_id only to avoid conflict with /leads/sources, /leads/roles, etc.
router.get(
  "/:lead_id(\\d+)",
  authenticateToken,
  leadController.getLeadById
);

// POST: Record installment and split shares
router.post(
  "/:lead_id/installments",
  paymentsController.recordInstallmentAndSplitShares
);

// GET: All installments across all leads
router.get(
  "/all-installments",
  authenticateToken,
  paymentsController.getAllInstallments
);

/* ====================================================================================
   Unit and CardType Feilds
   ==================================================================================== */
router.get("/units", authenticateToken, unitController.getUnits);
router.get("/card-types", authenticateToken, cardTypesController.getCardTypes);

/* ======= Role Management ======== */

// GET
router.get("/roles", authenticateToken, roleController.getRoles);

// POST
router.post("/roles", authenticateToken, roleController.createRole);

// PUT
router.put("/roles/:id", authenticateToken, roleController.updateRole);

// DELETE
router.delete("/roles/:id", authenticateToken, roleController.deleteRole);

/* ======= Source Management ======== */

// GET
router.get("/sources", authenticateToken, sourceController.getSources);

// POST
router.post("/sources", authenticateToken, sourceController.createSource);

// PUT
router.put("/sources/:id", authenticateToken, sourceController.updateSource);

// DELETE
router.delete("/sources/:id", authenticateToken, sourceController.deleteSource);

/* ====================================================================================
   Progz API Endpoints 
   ==================================================================================== */
router.get(
  "/progztrainingprogress",
  apiKeyMiddleware,
  leadController.getTrainingProgressLeads
);

router.get("/batches/progz", apiKeyMiddleware, batchController.getBatches);


/* ====================================================================================
   EXPORT ROUTER
   ==================================================================================== */

// Export the router for use in the main application (e.g., app.js)
module.exports = router;
