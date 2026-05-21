// routes/atsRoutes.js
const express = require("express");
const multer = require("multer");
const { showAtsForm, handleAtsCheck } = require("../controllers/atsController");

const router = express.Router();

// Store files in memory (Buffer) – 2 MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
});

// GET /ats  → show ATS checker form
router.get("/", showAtsForm);

// POST /ats → resume file + JD file (both optional)
router.post(
  "/",
  upload.fields([
    { name: "resumeFile", maxCount: 1 },
    { name: "jdFile", maxCount: 1 },
  ]),
  handleAtsCheck
);

module.exports = router;
    