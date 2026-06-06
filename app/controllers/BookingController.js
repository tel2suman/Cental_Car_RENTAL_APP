
const Car = require("../models/Car");

const User = require("../models/User");

const Booking = require("../models/Booking");

const transporter = require("../config/emailConfig");

const crypto = require("crypto");

const Razorpay = require("razorpay");

require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

class BookingController {
  // ================= BOOK CAR PAGE =================
  async bookCarPage(req, res) {
    try {
      // FIND CAR
      const car = await Car.findById(req.params.id);

      // FIND USER
      const user = await User.findById(req.user.id);

      if (!car) {
        req.flash("error_msg", "Car not found");

        return res.redirect("/available-cars");
      }

      // CHECK AVAILABILITY
      if (!car.availability) {
        req.flash("error_msg", "Car is not available");

        return res.redirect("/available-cars");
      }

      return res.render("frontend/pages/bookCar", {
        title: "Car Booking Page",
        car,
        user,
      });
    } catch (error) {
      console.log(error);

      return res.redirect("/available-cars");
    }
  }

  // ================= STORE BOOKING =================
  async ConfirmBooking(req, res) {

    try {

      const { pickupDate, returnDate } = req.body;

      // FIND CAR
      const car = await Car.findById(req.params.id);

      // FIND USER
      const user = await User.findById(req.user.id);

      if (!car) {
        req.flash("error_msg", "Car not found");

        return res.redirect("/available-cars");
      }

      // CHECK AVAILABILITY
      if (!car.availability) {
        req.flash("error_msg", "Car already booked");

        return res.redirect("/available-cars");
      }

      // VALIDATE DATES
      if (!pickupDate || !returnDate) {

        req.flash("error_msg", "All fields are required");

        return res.redirect(`/book-car/${car._id}`);
      }

      // TOTAL DAYS
      const startDate = new Date(pickupDate);

      const endDate = new Date(returnDate);

      const totalDays = Math.ceil(

        (endDate - startDate) / (1000 * 60 * 60 * 24),
      );

      // INVALID DATES
      if (totalDays <= 0) {
        req.flash("error_msg", "Invalid booking dates");

        return res.redirect(`/book-car/${car._id}`);
      }

      // TOTAL AMOUNT
      const totalAmount = totalDays * car.pricePerDay;

      // CREATE BOOKING
      const booking = await Booking.create({
        userId: req.user.id,

        carId: car._id,

        pickupDate,

        returnDate,

        totalDays,

        totalAmount,

        bookingStatus: "Approved",

        paymentStatus: "Pending",
      });

      // CREATE ORDER
      const options = {
        amount: totalAmount * 100,

        currency: "INR",

        receipt: `booking_${booking._id}`,
      };

      const order = await razorpay.orders.create(options);

      // PAYMENT PAGE
      return res.render("frontend/pages/payment", {

        title: "Payment Page",

        booking,

        car,

        order,

        user,

        razorpayKey: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      console.log(error);

      req.flash("error_msg", "Booking failed");

      return res.redirect("/available-cars");
    }
  }

  // ================= USER BOOKINGS =================
  async myBookings(req, res) {
    try {
      const bookings = await Booking.find({
        userId: req.user.id,
      })
        .populate("carId")
        .sort({ createdAt: -1 });

      const user = await User.findById(req.user.id);

      return res.render("frontend/pages/myBookings", {
        title: "My Booking Page",
        bookings,
        user,
      });
    } catch (error) {
      console.log(error);

      return res.redirect("/dashboard");
    }
  }

  // ================= PAYMENT SUCCESS =================

  async verifyPayment(req, res) {
    try {
      const {
        razorpay_order_id,

        razorpay_payment_id,

        razorpay_signature,

        bookingId,
      } = req.body;

      // GENERATE SIGNATURE
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      // VERIFY
      if (generatedSignature !== razorpay_signature) {
        return res.json({
          success: false,
        });
      }

      // UPDATE BOOKING
      await Booking.findByIdAndUpdate(bookingId, {
        bookingStatus: "Approved",

        paymentStatus: "Success",
      });

      // FIND BOOKING
      const booking = await Booking.findById(bookingId);

      // MAKE CAR UNAVAILABLE
      await Car.findByIdAndUpdate(booking.carId, {
        availability: false,
      });

      // ================= SEND EMAIL =================

      // const mailOptions = {

      //   from: process.env.EMAIL_USER,

      //   to: booking.userId?.email,

      //   subject: "Booking Confirmed - Cental",

      //   html: `

      //   <div style="font-family: Arial; padding: 20px;">

      //     <h2 style="color: green;">
      //       Booking Confirmed
      //     </h2>

      //     <p>
      //       Hello
      //       <strong>
      //         ${booking.userId?.name}
      //       </strong>,
      //     </p>

      //     <p>
      //       Your car booking has been confirmed successfully.
      //     </p>

      //     <hr>

      //     <h3>
      //       Booking Details
      //     </h3>

      //     <p>
      //       <strong>
      //         Car:
      //       </strong>

      //       ${booking.carId?.brand}
      //       ${booking.carId?.model}
      //     </p>

      //     <p>
      //       <strong>
      //         Pickup Date:
      //       </strong>

      //       ${new Date(booking.pickupDate).toDateString()}
      //     </p>

      //     <p>
      //       <strong>
      //         Return Date:
      //       </strong>

      //       ${new Date(booking.returnDate).toDateString()}
      //     </p>

      //     <p>
      //       <strong>
      //         Total Days:
      //       </strong>

      //       ${booking.totalDays}
      //     </p>

      //     <p>
      //       <strong>
      //         Total Amount:
      //       </strong>

      //       ₹${booking.totalAmount}
      //     </p>

      //     <p>
      //       <strong>
      //         Payment Status:
      //       </strong>

      //       Paid
      //     </p>

      //     <p>
      //       <strong>
      //         Payment ID:
      //       </strong>

      //       ${razorpay_payment_id}
      //     </p>

      //     <br>

      //     <p>
      //       Thank you for choosing our service.
      //     </p>

      //   </div>
      // `,
      // };

      // SEND EMAIL
      //await transporter.sendMail(mailOptions);

      return res.json({
        success: true,
        message: "Payment verified successfully",
      });
    } catch (error) {

      console.log(error);

      return res.json({
        success: false,
        message: "Something went wrong",
      });
    }
  }

  // ================= CANCEL BOOKING =================

  async cancelledBookingsPage(req, res) {
    try {
      const bookings = await Booking.find({
        userId: req.user.id,

        bookingStatus: "Cancelled",
      })
        .populate("carId")
        .sort({ updatedAt: -1 });

      // FIND USER
      const user = await User.findById(req.user.id);

      return res.render("frontend/pages/cancelledBookings", {
        title: "Cancelled Booking Page",
        bookings,
        user,
      });
    } catch (error) {
      console.log(error);

      req.flash("error_msg", "Unable to fetch cancelled bookings");

      return res.redirect("/my-bookings");
    }
  }

  async cancelBooking(req, res) {
    try {
      // FIND BOOKING
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        req.flash("error_msg", "Booking not found");

        return res.redirect("/my-bookings");
      }

      // CHECK USER OWNERSHIP
      if (booking.userId.toString() !== req.user.id) {
        req.flash("error_msg", "Unauthorized access");

        return res.redirect("/my-bookings");
      }

      // CHECK STATUS
      if (booking.bookingStatus === "Cancelled") {
        req.flash("error_msg", "Booking already cancelled");

        return res.redirect("/my-bookings");
      }

      // UPDATE BOOKING STATUS
      booking.bookingStatus = "Cancelled";

      // UPDATE PAYMENT STATUS
      booking.paymentStatus = "Refunded";

      await booking.save();

      // MAKE CAR AVAILABLE AGAIN
      const car = await Car.findById(booking.carId);

      if (car) {
        car.availability = true;

        await car.save();
      }

      req.flash("success_msg", "Booking cancelled & payment refunded");

      return res.redirect("/my-bookings");
    } catch (error) {
      console.log(error);

      req.flash("error_msg", "Unable to cancel booking");

      return res.redirect("/my-bookings");
    }
  }

  // ================= ALL BOOKINGS =================

  async allBookings(req, res) {
    try {
      const bookings = await Booking.find()
        .populate("userId")
        .populate("carId")
        .sort({ createdAt: -1 });

      return res.render("backend/admin/manageBookings", {
        title: "manage Booking Page",
        data: bookings,
      });
    } catch (error) {
      console.log(error);

      return res.redirect("/admin/dashboard");
    }
  }

  // ================= APPROVE BOOKING =================
  async approveBooking(req, res) {
    try {
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        req.flash("error_msg", "Booking not found");

        return res.redirect("/all-bookings");
      }

      booking.bookingStatus = "Approved";

      booking.paymentStatus = "Success";

      await booking.save();

      req.flash("success_msg", "Booking approved successfully");

      return res.redirect("/all-bookings");
    } catch (error) {
      console.log(error);

      return res.redirect("/all-bookings");
    }
  }

  // ================= REJECT BOOKING =================
  async rejectBooking(req, res) {
    try {
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        req.flash("error_msg", "Booking not found");

        return res.redirect("/all-bookings");
      }

      booking.bookingStatus = "Cancelled";

      booking.paymentStatus = "Refunded";

      await booking.save();

      // MAKE CAR AVAILABLE AGAIN
      const car = await Car.findById(booking.carId);

      if (car) {
        car.availability = true;

        await car.save();
      }

      req.flash("success_msg", "Booking rejected");

      return res.redirect("/all-bookings");
    } catch (error) {
      console.log(error);

      return res.redirect("/all-bookings");
    }
  }

  // ================= RETURN CAR =================
  async returnCar(req, res) {
    try {
      const booking = await Booking.findById(req.params.id);

      if (!booking) {
        req.flash("error_msg", "Booking not found");

        return res.redirect("/all-bookings");
      }

      booking.returnStatus = "Returned";

      booking.bookingStatus = "Completed";

      await booking.save();

      // MAKE CAR AVAILABLE AGAIN
      const car = await Car.findById(booking.carId);

      if (car) {
        car.availability = true;

        await car.save();
      }

      req.flash("success_msg", "Car returned successfully");

      return res.redirect("/all-bookings");
    } catch (error) {
      console.log(error);

      return res.redirect("/all-bookings");
    }
  }
}

module.exports = new BookingController();