const express = require("express");

const validateRegister = require("../utils/UserSchemaValidation");

const UserController = require("../controllers/UserController");

const tokenCheck = require("../middleware/tokenCheck");

const adminCheck = require("../middleware/adminCheck");

const Upload = require("../utils/CloudinaryImageUpload");

//const Rolechek = require("../middleware/roleCheck");

const router = express.Router();

// user register
router.get("/register", UserController.registerPage);

router.post("/register-user", validateRegister, UserController.register);

// user login
router.get("/login", UserController.loginPage);

router.post("/login-user", UserController.login);

// forgot password page
router.get("/forgot-password-page", UserController.forgotPasswordPage);

router.post("/forgot-password", UserController.forgotPassword);


// reset password page
router.get("/reset-password-page/:token", UserController.resetPasswordPage);

router.post("/reset-password/:token", UserController.resetPasswordLink);

router.use(tokenCheck);

// get user profile
router.get("/profile", UserController.userProfile);

router.get(
  "/edit-profile", UserController.editProfilePage,
);

router.post("/update-profile", Upload.single("profileImage"), UserController.updateProfile);

// get user dashboard
router.get("/dashboard", UserController.userDashboard);

router.get("/logout", UserController.logout);

// ================= ADMIN DASHBOARD =================

router.get(
  "/admin-dashboard",
  adminCheck, UserController.adminDashboard,
);

module.exports = router;