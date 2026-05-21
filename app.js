const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const http = require("http");
const atsRoutes = require("./routes/atsRoutes");

// Only load .env file if we are NOT in production (Railway sets NODE_ENV=production)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Debug: Print available environment variables (keys only)
console.log("Available ENV keys on startup:", Object.keys(process.env));
const resumeRoutes = require("./routes/resumeRoutes");
const authRoutes = require("./routes/authRoutes");
const connectDB = require("./db/connect");
const { requireAuth, checkUser } = require("./middleware/authMiddleware");
const { requireRole } = require("./middleware/roleMiddleware");
const { Resume, fetchUserResumes } = require("./models/resumeModel");
const User = require("./models/userModel");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);
console.log("MONGO_URI =", process.env.MONGO_URI);
// Connect DB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

// ===== Feature Routes =====

// ATS checker routes (authenticated)
app.use("/ats", requireAuth, atsRoutes);

// Admin routes (these already have requireAuth + requireRole inside)
app.use("/admin", adminRoutes);

// Resume routes (create/view/edit/download/delete)
app.use("/resume", requireAuth, resumeRoutes);

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Global middleware to check for a logged-in user on every GET route
app.get("*", checkUser);

// ===== Public Routes (no authentication required) =====
app.get("/", (req, res) => {
  if (res.locals.user) {
    res.render("home", { user: res.locals.user });
  } else {
    res.render("landing");
  }
});

app.use("/auth", authRoutes);

// ===== Protected Routes (authentication required) =====

// Dashboard
app.get("/dashboard", requireAuth, async (req, res, next) => {
  try {
    const resumes = await fetchUserResumes(req.user._id);
    res.render("dashboard", { user: req.user, resumes });
  } catch (err) {
    next(err);
  }
});

// Search
app.get("/search", requireAuth, async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    let resumes;

    if (!q) {
      resumes = await fetchUserResumes(req.user._id);
    } else {
      resumes = await Resume.find({
        $text: { $search: q },
        userId: req.user._id,
      }).sort({ createdAt: -1 });
    }

    res.render("dashboard", { user: req.user, resumes });
  } catch (err) {
    next(err);
  }
});

// ===== Admin-only Routes =====
app.get(
  "/admin/users",
  requireAuth,
  requireRole(["admin"]),
  async (req, res, next) => {
    try {
      const users = await User.find({}).sort({ _id: -1 });
      res.render("adminUsers", { user: req.user, users });
    } catch (err) {
      next(err);
    }
  }
);

app.get(
  "/admin/resumes",
  requireAuth,
  requireRole(["admin"]),
  async (req, res, next) => {
    try {
      const resumes = await Resume.find({})
        .populate("userId")
        .sort({ createdAt: -1 });
      res.render("adminResumes", { user: req.user, resumes });
    } catch (err) {
      next(err);
    }
  }
);

// ===== Error Handler =====
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).render("error", {
    message: "Something broke! " + err.message,
    user: req.user || null,
  });
});

// ===== Socket.io Setup (WebSocket) =====
const server = http.createServer(app);
const io = require("socket.io")(server);

let onlineUsers = 0;

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // track online users for all pages that connect
  onlineUsers++;
  io.emit("online:count", onlineUsers);

  // room for resume live preview
  socket.on("resume:join", (resumeId) => {
    socket.join(resumeId);
  });

  // live preview updates
  socket.on("resume:update", (data) => {
    if (!data || !data.resumeId) return;
    io.to(data.resumeId).emit("resume:preview", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    onlineUsers = Math.max(onlineUsers - 1, 0);
    io.emit("online:count", onlineUsers);
  });
});

// Start Server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
