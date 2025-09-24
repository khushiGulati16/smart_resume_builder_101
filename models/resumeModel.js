const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  name: { type: String, required: true },
  role: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  address: String,
  linkedin: String,
  education: String,
  experience1: String,
  experience2: String,
  experience3: String,
  skills: String,
  template: { type: String, required: true, default: "template1" },
}, { timestamps: true });

const Resume = mongoose.model("resume", resumeSchema);

async function saveResume(data) {
  const resume = new Resume(data);
  await resume.save();
  return resume._id;
}

async function fetchResume(id) {
  const resume = await Resume.findById(id);
  if (!resume) {
    throw new Error("Resume not found");
  }
  return resume;
}

async function fetchUserResumes(userId) {
  const resumes = await Resume.find({ userId }).sort({ createdAt: -1 });
  return resumes;
}

async function deleteResumeById(resumeId, userId) {
  const result = await Resume.findOneAndDelete({ _id: resumeId, userId: userId });
  return result;
}

module.exports = { Resume, saveResume, fetchResume, fetchUserResumes, deleteResumeById };