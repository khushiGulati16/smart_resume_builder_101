const express = require("express");
const {
  createResume,
  showForm,
  showEditForm,
  updateResume,
  renderResume,
  downloadResume,
  deleteResume,
} = require("../controllers/resumeController");

const router = express.Router();

// Routes for creating and showing a single resume
router.get("/create", showForm);
router.post("/create", createResume);
router.get("/:id", renderResume);
router.get("/:id/download", downloadResume);

// Routes for updating a resume
router.get("/:id/edit", showEditForm);
router.post("/:id/edit", updateResume);

// Route to delete a resume
router.delete("/:id", deleteResume);

module.exports = router;
