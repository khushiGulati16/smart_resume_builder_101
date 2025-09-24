const express = require("express");
const router = express.Router();
const { showSignup, signupUser, showLogin, loginUser, logoutUser } = require("../controllers/authController");

router.get("/signup", showSignup);
router.post("/signup", signupUser);
router.get("/login", showLogin);
router.post("/login", loginUser);
router.get("/logout", logoutUser);

module.exports = router;