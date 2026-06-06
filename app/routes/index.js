const express = require("express");

const router = express.Router();

//defining routes
const HomeRoute = require("./HomeRoute");

const UserRoute = require("./UserRoute");

const AdminRoute = require("./AdminRoute");

const CarRoute = require("./CarRoute");

const BookingRoute = require("./BookingRoute");


router.use(HomeRoute);

router.use(AdminRoute);

router.use(UserRoute);

router.use(CarRoute);

router.use(BookingRoute);


module.exports = router;
