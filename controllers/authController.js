const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

const maxAge = 3 * 24 * 60 * 60;

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: maxAge,
  });
};

exports.showSignup = (req, res) => {
  res.render("auth/signup");
};

// Show login page
exports.showLogin = (req, res) => {
  res.render("auth/login");
};

// Handle signup
exports.signupUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user = await User.create({ name, email, password });
    const token = createToken(user._id);

    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });

    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email } });
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

// Handle login
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.login(email, password);
    const token = createToken(user._id);

    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAge * 1000 });

    res.status(200).json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    let errors = { email: "", password: "" };

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