const express = require("express");

const HomeController = require("../controllers/HomeController");

const router = express.Router();

router.get("/", HomeController.homePage);

router.get("/about", HomeController.aboutPage);

router.get("/contact", HomeController.contactPage);

module.exports = router;
