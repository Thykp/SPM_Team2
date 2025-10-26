const express = require("express");
const router = express.Router();
const recurrenceController = require("../controller/RecurrenceController");

// Recurrence routes
router.get("/:id", recurrenceController.getRecurrenceById);
router.get("/task/:taskId", recurrenceController.getRecurrenceByTaskId);
router.post("/", recurrenceController.createRecurrence);
router.put("/:id", recurrenceController.updateRecurrence);
router.delete("/:id", recurrenceController.deleteRecurrence);

module.exports = router;