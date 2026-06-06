const express = require("express");

const BookingController = require("../controllers/BookingController");

const tokenCheck = require("../middleware/tokenCheck");
const adminCheck = require("../middleware/adminCheck");

const router = express.Router();

// BOOK CAR PAGE
router.get("/book-car/:id", tokenCheck, BookingController.bookCarPage);

// STORE BOOKING
router.post("/confirm-booking/:id", tokenCheck, BookingController.ConfirmBooking);

// MY BOOKINGS
router.get("/my-bookings", tokenCheck, BookingController.myBookings);

router.get("/cancelled-bookings", tokenCheck, BookingController.cancelledBookingsPage);

router.get("/cancel-booking/:id", tokenCheck, BookingController.cancelBooking);

//router.get("/payment-success", tokenCheck, BookingController.paymentSuccess);

router.post("/verify-payment", tokenCheck, BookingController.verifyPayment);

// ALL ADMIN BOOKINGS Route
router.get(
  "/all-bookings",
  tokenCheck, adminCheck,
  BookingController.allBookings,
);

// APPROVE BOOKING
router.get(
  "/approve-booking/:id",
  tokenCheck, adminCheck,
  BookingController.approveBooking,
);

// REJECT BOOKING
router.get(
  "/reject-booking/:id",
  tokenCheck, adminCheck,
  BookingController.rejectBooking,
);

// RETURN CAR
router.get(
  "/return-car/:id",
  tokenCheck, adminCheck,
  BookingController.returnCar,
);

module.exports = router;