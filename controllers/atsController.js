// controllers/atsController.js
const { Resume } = require("../models/resumeModel");
const { calculateAtsScore } = require("../utils/atsScore");

// ---- PDF PARSER SETUP (pdf-parse with CJS/ESM compatibility) ----
let pdfParse = null;
try {
  pdfParse = require("pdf-parse");

  // agar ESM default export ho to .default se function nikalo
  if (
    pdfParse &&
    typeof pdfParse !== "function" &&
    typeof pdfParse.default === "function"
  ) {
    pdfParse = pdfParse.default;
  }
} catch (e) {
  console.warn(
    "[ATS] pdf-parse is not available. PDF upload to ATS will not work:",
    e.message
  );
  pdfParse = null;
}

// ---- Helpers ----

// DB se resume object ko ek plain text me convert karna
function buildTextFromResume(resume) {
  const parts = [];

  if (resume.name) parts.push(`Name: ${resume.name}`);
  if (resume.role) parts.push(`Role: ${resume.role}`);
  if (resume.email) parts.push(`Email: ${resume.email}`);
  if (resume.phone) parts.push(`Phone: ${resume.phone}`);
  if (resume.address) parts.push(`Address: ${resume.address}`);
  if (resume.linkedin) parts.push(`LinkedIn: ${resume.linkedin}`);

  // ✅ NEW: Summary section
  if (resume.summary) parts.push(`Summary: ${resume.summary}`);

  if (resume.education) parts.push(`Education: ${resume.education}`);

  if (resume.experience1) parts.push(`Experience: ${resume.experience1}`);
  if (resume.experience2) parts.push(resume.experience2);
  if (resume.experience3) parts.push(resume.experience3);

  // ✅ NEW: Projects / Certifications
  if (resume.projects)
    parts.push(`Projects & Certifications: ${resume.projects}`);

  if (resume.skills) parts.push(`Skills: ${resume.skills}`);

  return parts.join("\n");
}

// Uploaded file (PDF / TXT) → plain text
async function extractTextFromFile(file) {
  if (!file) return "";

  const ext = (file.originalname.split(".").pop() || "").toLowerCase();

  // TXT file
  if (ext === "txt") {
    const text = file.buffer.toString("utf-8");
    console.log("[ATS] TXT extracted length:", text.length);
    return text || "";
  }

  // PDF file
  if (ext === "pdf") {
    if (!pdfParse) {
      throw new Error(
        "PDF parsing library is not configured on the server. Please contact the administrator."
      );
    }

    const data = await pdfParse(file.buffer);
    const text = (data.text || "").trim();
    console.log("[ATS] PDF extracted length:", text.length);
    return text;
  }

  // koi aur extension
  throw new Error("Unsupported file type. Please upload a PDF or TXT file.");
}

// ---- Controllers ----

exports.showAtsForm = async (req, res) => {
  try {
    // 🔹 Default: normal user ke liye sirf uske hi resumes
    let query = {};

    if (req.user) {
      if (req.user.role === "admin") {
        // 🔹 Admin: saare users ke resumes (no filter)
        query = {};
      } else {
        // 🔹 Normal user: sirf apne
        query = { userId: req.user._id };
      }
    }

    const resumes = await Resume.find(query).sort({ createdAt: -1 }).lean();

    res.render("atsForm", {
      user: req.user,
      resumes,
      error: null,
      formData: { jobDescription: "" },
      preselectedResumeId: req.query.resumeId || "",
    });
  } catch (err) {
    console.error("Error loading ATS form:", err);
    res.status(500).render("error", { message: "Failed to load ATS checker." });
  }
};

// POST /ats  → calculate score (resume file / DB resume + JD file / JD text)
exports.handleAtsCheck = async (req, res, next) => {
  try {
    const { resumeId, jobDescription = "" } = req.body;
    const files = req.files || {};
    const resumeFile =
      files.resumeFile && files.resumeFile.length ? files.resumeFile[0] : null;
    const jdFile =
      files.jdFile && files.jdFile.length ? files.jdFile[0] : null;

    // 🔹 ADMIN FIX HERE
    // Admin → saare resumes, User → apne hi
    const resumes =
      req.user.role === "admin"
        ? await Resume.find().sort({ createdAt: -1 })
        : await Resume.find({ userId: req.user._id }).sort({ createdAt: -1 });

    // Debug
    if (resumeFile) {
      console.log("[ATS] Uploaded resume file:", {
        originalname: resumeFile.originalname,
        mimetype: resumeFile.mimetype,
        size: resumeFile.size,
      });
    }
    if (jdFile) {
      console.log("[ATS] Uploaded JD file:", {
        originalname: jdFile.originalname,
        mimetype: jdFile.mimetype,
        size: jdFile.size,
      });
    }

    // Dono blank → error
    if ((!resumeId || resumeId === "") && !resumeFile) {
      return res.status(400).render("atsForm", {
        user: req.user,
        resumes,
        preselectedResumeId: "",
        error:
          "Please select one of your resumes or upload a resume file to analyze.",
        formData: { jobDescription },
      });
    }

    let finalResumeText = "";

    // 1️⃣ Resume content: uploaded file priority
    if (resumeFile) {
      try {
        finalResumeText = await extractTextFromFile(resumeFile);
      } catch (fileErr) {
        console.error("[ATS] Resume file parse error:", fileErr.message);
        return res.status(400).render("atsForm", {
          user: req.user,
          resumes,
          preselectedResumeId: resumeId || "",
          error:
            fileErr.message ||
            "Failed to read the uploaded resume. Please upload a valid text-based PDF or .txt file.",
          formData: { jobDescription },
        });
      }
    } else if (resumeId) {
      // Nahi toh DB wala resume use karo
      const resume = await Resume.findById(resumeId);

      // 🔹 ADMIN FIX APPLIED HERE
      if (
        !resume ||
        (req.user.role !== "admin" &&
          resume.userId.toString() !== req.user._id.toString())
      ) {
        return res.status(404).render("error", {
          user: req.user,
          message: "Selected resume not found or unauthorized.",
        });
      }

      finalResumeText = buildTextFromResume(resume);
    }

    console.log(
      "[ATS] Final resume text length:",
      finalResumeText ? finalResumeText.length : 0
    );

    if (!finalResumeText || finalResumeText.trim().length === 0) {
      return res.status(400).render("atsForm", {
        user: req.user,
        resumes,
        preselectedResumeId: resumeId || "",
        error:
          "We could not read any text from this resume. Please upload a text-based PDF (not scanned image) or a .txt file, or select a resume created in the app.",
        formData: { jobDescription },
      });
    }

    // 2️⃣ Job Description: JD file > textarea text
    let jdText = jobDescription || "";

    if (jdFile) {
      try {
        jdText = await extractTextFromFile(jdFile);
      } catch (jdErr) {
        console.error("[ATS] JD file parse error:", jdErr.message);
        return res.status(400).render("atsForm", {
          user: req.user,
          resumes,
          preselectedResumeId: resumeId || "",
          error:
            jdErr.message ||
            "Failed to read the uploaded job description file. Please upload a valid PDF/TXT or paste the JD in the textbox.",
          formData: { jobDescription },
        });
      }
    }

    console.log(
      "[ATS] JD text length (after file/text):",
      jdText ? jdText.length : 0
    );

    // ATS score calculate (JD optional)
    const result = calculateAtsScore(finalResumeText, jdText || "");

    res.render("atsResult", {
      user: req.user,
      result,
      jobDescription: jdText || "",
      resumeText: finalResumeText,
    });
  } catch (err) {
    next(err);
  }
};
