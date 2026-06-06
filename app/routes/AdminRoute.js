const express = require("express");

const validateRegister = require("../utils/UserSchemaValidation");

const AdminController = require("../controllers/AdminController");

const tokenCheck = require("../middleware/tokenCheck");

const adminCheck = require("../middleware/adminCheck");

const Upload = require("../utils/CloudinaryImageUpload");

//const Rolechek = require("../middleware/roleCheck");

const router = express.Router();

// user register
router.get("/admin/register", AdminController.registerView);

router.post("/register-admin", validateRegister, AdminController.adminRegister);

// user login
router.get("/admin/login", AdminController.loginView);

router.post("/login-admin", AdminController.adminLogin);

router.get("/admin/dashboard", tokenCheck, adminCheck, AdminController.adminDashboard);

// get user profile
router.get(
  "/admin/profile",
  tokenCheck,
  adminCheck,
  AdminController.adminProfile,
);

router.get(
  "/admin/edit-profile",
  tokenCheck,
  adminCheck,
  AdminController.editProfilePage,
);

router.post(
  "/admin/update-profile",
  Upload.single("profileImage"),
  tokenCheck,
  adminCheck,
  AdminController.updateProfile,
);

router.get("/admin/logout", tokenCheck, adminCheck, AdminController.adminLogout);


module.exports = router;