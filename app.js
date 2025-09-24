const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

dotenv.config();

const resumeRoutes = require("./routes/resumeRoutes");
const authRoutes = require("./routes/authRoutes");
const connectDB = require("./db/connect");
const { requireAuth, checkUser } = require("./middleware/authMiddleware");
const { fetchUserResumes } = require("./models/resumeModel");

const app = express();
const PORT = process.env.PORT || 3000;

// Connect DB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Global middleware to check for a logged-in user on every route
app.get("*", checkUser);

// ===== Public Routes (no authentication required) =====
app.get("/", (req, res) => {
  if (res.locals.user) {
    // ✅ If user is logged in, show the home page
    res.render("home", { user: res.locals.user });
  } else {
    // ✅ If user is not logged in, redirect to the login page
    res.redirect("/auth/login");
  }
});
app.use("/auth", authRoutes);

// ===== Protected Routes (authentication required) =====
app.get("/dashboard", requireAuth, async (req, res, next) => {
  try {
    const resumes = await fetchUserResumes(req.user._id);
    res.render("dashboard", { user: req.user, resumes });
  } catch (err) {
    next(err);
  }
});
app.use("/resume", requireAuth, resumeRoutes);

// ===== Error Handler =====
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).render("error", { message: "Something broke! " + err.message, error: err });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});