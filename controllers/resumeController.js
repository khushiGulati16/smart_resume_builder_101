const {
  saveResume,
  fetchResume,
  fetchUserResumes,
  deleteResumeById,
  updateResumeById,
} = require("../models/resumeModel");
const puppeteer = require("puppeteer");
const path = require("path");
const ejs = require("ejs");

// Fetches and renders the dashboard page with user's resumes
exports.showDashboard = async (req, res, next) => {
  try {
    const resumes = await fetchUserResumes(req.user._id);
    res.render("dashboard", { resumes, user: req.user });
  } catch (err) {
    next(err);
  }
};

// Renders the resume creation form
exports.showForm = (req, res) => {
  res.render("index", { user: req.user });
};

// Renders the edit form with existing data
exports.showEditForm = async (req, res, next) => {
  try {
    const resume = await fetchResume(req.params.id);

    const isOwner = resume.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).send("Unauthorized");
    }

    res.render("edit", { resume, id: req.params.id, user: req.user });
  } catch (err) {
    next(err);
  }
};

// Creates a new resume
exports.createResume = async (req, res, next) => {
  try {
    const resumeData = { ...req.body, userId: req.user._id };
    const id = await saveResume(resumeData);
    res.redirect(`/resume/${id}`);
  } catch (err) {
    next(err);
  }
};

// Updates an existing resume
exports.updateResume = async (req, res, next) => {
  try {
    const id = req.params.id;
    const userId = req.user._id;
    const updateData = req.body;

    // First try as normal user (must own resume)
    let result = await updateResumeById(id, userId, updateData);

    // If not found and user is admin -> allow admin to update any resume
    if (!result && req.user.role === "admin") {
      result = await updateResumeById(id, undefined, updateData);
    }

    if (!result) {
      return res
        .status(404)
        .json({ message: "Resume not found or you are not authorized to update it." });
    }

    res.redirect(`/resume/${id}`);
  } catch (err) {
    next(err);
  }
};

// Renders a specific resume based on ID
exports.renderResume = async (req, res, next) => {
  try {
    const resume = await fetchResume(req.params.id);

    const isOwner = resume.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    // Allow either owner OR admin
    if (!isOwner && !isAdmin) {
      return res.status(403).send("Unauthorized");
    }

    const template = resume.template || "template1";
    res.render(`templates/${template}`, {
      resume,
      id: req.params.id,
      user: req.user,
    });
  } catch (err) {
    next(err);
  }
};

// Downloads a resume as a PDF
exports.downloadResume = async (req, res, next) => {
  try {
    const id = req.params.id;
    const resume = await fetchResume(id);

    const isOwner = resume.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    // Allow either owner OR admin
    if (!isOwner && !isAdmin) {
      return res.status(403).send("Unauthorized");
    }

    const template = resume.template || "template1";
    const templatePath = path.join(
      __dirname,
      "..",
      "views",
      "templates",
      `${template}.ejs`
    );

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const htmlContent = await ejs.renderFile(templatePath, {
      resume,
      id,
      user: req.user,
    });

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    await page.addStyleTag({
      path: path.join(__dirname, "..", "public", "css", "style.css"),
    });

    await page.waitForSelector(".main-resume-container", { timeout: 10000 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm",
      },
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${resume.name.replace(/\s+/g, "-")}-Resume.pdf`
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF generation error:", err.message);
    next(new Error("PDF generation failed."));
  }
};

// Deletes a resume
exports.deleteResume = async (req, res, next) => {
  try {
    const id = req.params.id;
    const userId = req.user._id;

    // normal users can only delete their own
    let result = await deleteResumeById(id, userId);

    // allow admin to delete any resume
    if (!result && req.user.role === "admin") {
      result = await deleteResumeById(id, undefined);
    }

    if (!result) {
      return res
        .status(404)
        .json({ message: "Resume not found or unauthorized." });
    }

    res.status(200).json({ message: "Resume deleted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while deleting." });
  }
};
