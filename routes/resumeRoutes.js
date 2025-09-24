const express = require("express");
const {
  createResume,
  showForm,
  renderResume,
  downloadResume,
  deleteResume,
  showDashboard, // ✅ Now imported here
} = require("../controllers/resumeController");

const router = express.Router();

// Route for the resume creation form
router.get("/create", showForm);
// Route to get a specific resume for viewing
router.get("/:id", renderResume);
// Route to download a specific resume
router.get("/:id/download", downloadResume);
// Route to create a new resume
router.post("/create", createResume);
// Route to delete a resume
router.delete("/:id", deleteResume);

module.exports = router;