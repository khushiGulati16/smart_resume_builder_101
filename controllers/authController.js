const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

const maxAge = 3 * 24 * 60 * 60; // 3 days in seconds

// include role in JWT
const createToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: maxAge,
    }
  );
};

// Common cookie options
const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  maxAge: maxAge * 1000,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
};

exports.showSignup = (req, res) => {
  res.render("auth/signup");
};

exports.showLogin = (req, res) => {
  res.render("auth/login");
};

// Handle signup (no role selection from UI – defaults to "user")
exports.signupUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user = await User.create({ name, email, password }); // role defaults to 'user'
    const token = createToken(user);

    res.cookie("jwt", token, cookieOptions);

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    let errors = { name: "", email: "", password: "" };

    if (err.code === 11000) {
      errors.email = "That email is already registered";
      return res.status(400).json({ errors });
    }

    if (err.message.includes("user validation failed")) {
      Object.values(err.errors).forEach(({ properties }) => {
        errors[properties.path] = properties.message;
      });
    }

    res.status(400).json({ errors });
  }
};

// Handle login (now includes role check)
exports.loginUser = async (req, res) => {
  const { email, password, role } = req.body;
  let errors = { email: "", password: "", role: "" };

  try {
    const user = await User.login(email, password);

    // ✅ New: check if selected role matches user's role in DB
    if (role && role !== user.role) {
      errors.role = "Selected role does not match this account.";
      return res.status(400).json({ errors });
    }

    const token = createToken(user);
    res.cookie("jwt", token, cookieOptions);

    res.status(200).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    if (err.message === "Incorrect email") {
      errors.email = err.message;
    } else if (err.message === "Incorrect password") {
      errors.password = err.message;
    }

    res.status(400).json({ errors });
  }
};

// Handle logout
exports.logoutUser = (req, res) => {
  res.cookie("jwt", "", { maxAge: 1 });
  res.redirect("/auth/login");
};
