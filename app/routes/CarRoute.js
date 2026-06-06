
const express = require("express");

const CarController = require("../controllers/CarController");

const tokenCheck = require("../middleware/tokenCheck");

const Upload = require("../utils/CloudinaryImageUpload");

const adminCheck = require("../middleware/adminCheck");

const router = express.Router();

// CAR LIST
router.get("/available-cars", tokenCheck, CarController.availableCars);


// ================= ADMIN CAR ROUTES =================

// VIEW ALL CARS
router.get("/manage-cars", tokenCheck, adminCheck,
  CarController.allCars
);

// ADD CAR
router.get(
  "/add-car-page", tokenCheck, adminCheck,
  CarController.addCarPage
);

router.post(
  "/add-car", tokenCheck, adminCheck,
  Upload.single("image"),
  CarController.addCar,
);

// VIEW SINGLE CAR
router.get("/view-car/:id", tokenCheck, adminCheck, CarController.singleCar);

// EDIT CAR PAGE
router.get(
  "/edit-car/:id", tokenCheck,
  adminCheck, CarController.editCarPage
);

// UPDATE CAR
router.post(
  "/update-car/:id", tokenCheck,
  adminCheck, Upload.single("image"),
  CarController.updateCar,
);

// DELETE CAR
router.get("/delete-car/:id", tokenCheck, adminCheck, CarController.deleteCar);

// SEARCH & FILTER CAR
router.get("/search-cars", tokenCheck, CarController.searchCars);

// CHANGE AVAILABILITY
router.get(
  "/change-availability/:id",
  tokenCheck, adminCheck,
  CarController.changeAvailability,
);



module.exports = router;