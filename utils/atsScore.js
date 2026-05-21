// utils/atsScore.js

function normalize(text = "") {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s@.+-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOP_WORDS = new Set([
  "the","and","for","you","with","from","that","this","have","your","will",
  "into","they","them","their","about","than","then","when","what","where",
  "been","were","also","such","some","more","most","very","over","under",
  "able","other","only","like","just"
]);

function extractKeywords(text) {
  const norm = normalize(text);
  const parts = norm.split(" ");
  const keywords = new Set();
  for (const w of parts) {
    if (!w) continue;
    if (w.length < 4) continue;
    if (STOP_WORDS.has(w)) continue;
    keywords.add(w);
  }
  return Array.from(keywords);
}

function calculateKeywordScore(resumeText, jdText) {
  const jdKeywords = extractKeywords(jdText);
  if (jdKeywords.length === 0) {
    return { score: 0, matched: [], missing: [] };
  }

  const resumeNorm = normalize(resumeText);
  const matched = [];
  const missing = [];

  jdKeywords.forEach((kw) => {
    if (resumeNorm.includes(kw)) matched.push(kw);
    else missing.push(kw);
  });

  const baseScore = (matched.length / jdKeywords.length) * 40;
  const score = Math.round(baseScore);

  return { score, matched, missing };
}

function calculateSectionScore(resumeText) {
  const t = normalize(resumeText);
  let score = 0;
  const sections = {
    summary: /summary|objective/,
    skills: /skills?/,
    experience: /experience|work history|employment/,
    education: /education|degree|b\.?tech|btech|b\.?e\.?|be|bsc|msc|mca|diploma/,
    projects: /projects?|certifications?|awards?/,
  };

  const found = {};
  if (sections.summary.test(t)) { score += 5; found.summary = true; }
  else found.summary = false;

  if (sections.skills.test(t)) { score += 5; found.skills = true; }
  else found.skills = false;

  if (sections.experience.test(t)) { score += 7; found.experience = true; }
  else found.experience = false;

  if (sections.education.test(t)) { score += 5; found.education = true; }
  else found.education = false;

  if (sections.projects.test(t)) { score += 3; found.projects = true; }
  else found.projects = false;

  return { score, found };
}

function calculateContactScore(resumeText) {
  const text = resumeText;
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
  const phoneRegex = /(\+?\d[\d\s\-]{7,}\d)/;
  const linkedInRegex = /linkedin\.com\/[a-z0-9_\-\/]+/i;

  const hasEmail = emailRegex.test(text);
  const hasPhone = phoneRegex.test(text);
  const hasLinkedIn = linkedInRegex.test(text);

  let score = 0;
  if (hasEmail) score += 5;
  if (hasPhone) score += 5;
  if (hasLinkedIn) score += 5;

  return { score, hasEmail, hasPhone, hasLinkedIn };
}

function calculateLengthScore(resumeText) {
  const words = normalize(resumeText).split(" ").filter(Boolean);
  const count = words.length;
  let score = 0;

  if (count === 0) return { score: 0, wordCount: 0 };

  if (count >= 300 && count <= 800) score = 10;
  else if ((count >= 200 && count < 300) || (count > 800 && count <= 1100)) score = 7;
  else if ((count >= 120 && count < 200) || count > 1100) score = 4;
  else score = 2;

  return { score, wordCount: count };
}

function calculateSkillDensityScore(resumeText, jdText) {
  const jdKeywords = extractKeywords(jdText);
  if (jdKeywords.length === 0) {
    return { score: 0, matched: [], missing: [] };
  }

  const norm = normalize(resumeText);
  const skillMatches = [];
  const skillMissing = [];

  jdKeywords.forEach((kw) => {
    if (norm.includes(kw)) skillMatches.push(kw);
    else skillMissing.push(kw);
  });

  const baseScore = (skillMatches.length / jdKeywords.length) * 10;
  const score = Math.round(baseScore);

  return { score, matched: skillMatches, missing: skillMissing };
}

function calculateAtsScore(resumeText, jdText) {
  const hasJD = jdText && jdText.trim().length > 0;

  const sectionPart = calculateSectionScore(resumeText);
  const contactPart = calculateContactScore(resumeText);
  const lengthPart = calculateLengthScore(resumeText);

  let keywordPart = { score: 0, matched: [], missing: [] };
  let skillDensityPart = { score: 0, matched: [], missing: [] };
  let total = 0;

  if (hasJD) {
    // ✅ OLD behaviour: JD diya hai → pure ATS
    keywordPart = calculateKeywordScore(resumeText, jdText);
    skillDensityPart = calculateSkillDensityScore(resumeText, jdText);

    total =
      keywordPart.score +
      sectionPart.score +
      contactPart.score +
      lengthPart.score +
      skillDensityPart.score;

    if (total > 100) total = 100;
  } else {
    // ✅ NEW behaviour: JD nahi diya → sirf resume ke basis par score (0–100)
    // sections: max 25 → 40 points
    const sectionWeight = 40 / 25;
    // contact: max 15 → 30 points
    const contactWeight = 30 / 15;
    // length: max 10 → 30 points
    const lengthWeight = 30 / 10;

    total =
      Math.round(sectionPart.score * sectionWeight) +
      Math.round(contactPart.score * contactWeight) +
      Math.round(lengthPart.score * lengthWeight);

    if (total > 100) total = 100;
  }

  return {
    totalScore: total,
    breakdown: {
      keywords: keywordPart,
      sections: sectionPart,
      contact: contactPart,
      length: lengthPart,
      skillDensity: skillDensityPart,
    },
    hasJD, // 👈 EJS me use kar sakte ho
  };
}

module.exports = { calculateAtsScore };

