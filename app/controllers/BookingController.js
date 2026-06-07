
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
      const car = await Car.findByIdAndUpdate(booking.carId, {
        availability: false,
        new: true,
      });

      // FIND USER
      const user = await User.findById(booking.userId);

      // SEND EMAIL
      if (user?.email) {

        await transporter.sendMail({

          from: process.env.EMAIL_USER,

          to: user.email,

          subject: "🚗 Booking Confirmed - Cental Car Rental System",

          html: `

          <!DOCTYPE html>

          <html>

          <head>

            <meta charset="UTF-8">

            <title>
              Booking Confirmation
            </title>

            <!-- GOOGLE FONTS -->
            <link href="
              https://fonts.googleapis.com/css2?
              family=Montserrat:wght@400;500;600;700&
              family=Lato:wght@300;400;700&
              display=swap
            "
            rel="stylesheet">

          </head>

          <body style="

            margin: 0;
            padding: 0;
            background: #f4f6fb;
            font-family: 'Lato', sans-serif;
          ">

            <table width="100%" cellpadding="0" cellspacing="0">

              <tr>

                <td align="center">

                  <table width="680" cellpadding="0" cellspacing="0" style="

                    background: #ffffff;
                    margin: 40px auto;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow:
                      0 12px 40px rgba(0,0,0,0.08);
                  ">

                    <!-- HEADER -->

                    <tr>

                      <td align="center" style="

                        background:
                          linear-gradient(
                            135deg,
                            #1f2e4e,
                            #ea001e
                          );

                        padding:
                          55px 25px;
                      ">

                        <img

                          src="
                          https://cdn-icons-png.flaticon.com/512/744/744465.png
                          "

                          width="90"

                          style="
                            margin-bottom: 18px;
                          "
                        >

                        <h1 style="

                          margin: 0;
                          color: #ffffff;
                          font-size: 38px;
                          font-family: 'Montserrat', sans-serif;
                          font-weight: 700;
                          letter-spacing: 1px;
                        ">

                          Car Rental System

                        </h1>

                        <p style="

                          color: #f5d6da;
                          margin-top: 14px;
                          font-size: 17px;
                          font-family: 'Lato', sans-serif;
                          line-height: 1.8;
                        ">

                          Your booking has been successfully confirmed

                        </p>

                      </td>

                    </tr>

                    <!-- BODY -->

                    <tr>

                      <td style="

                        padding: 50px;
                        color: #333333;
                      ">

                        <h2 style="

                          margin-top: 0;
                          font-size: 30px;
                          font-family: 'Montserrat', sans-serif;
                          font-weight: 700;
                          color: #1f2e4e;
                        ">

                          Hello ${user.name},
                        </h2>

                        <p style="

                          font-size: 17px;
                          line-height: 2;
                          color: #555555;
                          margin-top: 20px;
                        ">

                          Thank you for choosing
                          <strong style="

                            color: #ea001e;
                          ">

                            Car Rental System

                          </strong>.

                          Your payment has been verified successfully
                          and your booking is now officially confirmed.

                        </p>

                        <!-- BOOKING DETAILS CARD -->

                        <table width="100%" cellpadding="0" cellspacing="0" style="

                          margin-top: 40px;
                          border-radius: 16px;
                          overflow: hidden;
                          border: 1px solid #e9edf5;
                        ">

                          <tr>

                            <td colspan="2" style="

                              background: #1f2e4e;
                              color: #ffffff;
                              padding: 20px;
                              font-size: 24px;
                              font-family: 'Montserrat', sans-serif;
                              font-weight: 600;
                            ">

                              Booking Details

                            </td>

                          </tr>

                          <tr>

                            <td style="

                              padding: 18px;
                              font-weight: 700;
                              color: #1f2e4e;
                              border-bottom:
                                1px solid #f2f2f2;
                            ">

                              🚘 Car

                            </td>

                            <td style="

                              padding: 18px;
                              border-bottom:
                                1px solid #f2f2f2;
                            ">

                              ${car.brand}
                              ${car.model}

                            </td>

                          </tr>

                          <tr>

                            <td style="

                              padding: 18px;
                              font-weight: 700;
                              color: #1f2e4e;
                              border-bottom:
                                1px solid #f2f2f2;
                            ">

                              📅 Pickup Date

                            </td>

                            <td style="

                              padding: 18px;
                              border-bottom:
                                1px solid #f2f2f2;
                            ">

                              ${new Date(booking.pickupDate).toDateString()}

                            </td>

                          </tr>

                          <tr>

                            <td style="

                              padding: 18px;
                              font-weight: 700;
                              color: #1f2e4e;
                              border-bottom:
                                1px solid #f2f2f2;
                            ">

                              📅 Return Date

                            </td>

                            <td style="

                              padding: 18px;
                              border-bottom:
                                1px solid #f2f2f2;
                            ">

                              ${new Date(booking.returnDate).toDateString()}

                            </td>

                          </tr>

                          <tr>

                            <td style="

                              padding: 18px;
                              font-weight: 700;
                              color: #1f2e4e;
                              border-bottom:
                                1px solid #f2f2f2;
                            ">

                              ⏳ Duration

                            </td>

                            <td style="

                              padding: 18px;
                              border-bottom:
                                1px solid #f2f2f2;
                            ">

                              ${booking.totalDays}
                              Days

                            </td>

                          </tr>

                          <tr>

                            <td style="

                              padding: 18px;
                              font-weight: 700;
                              color: #1f2e4e;
                              border-bottom:
                                1px solid #f2f2f2;
                            ">

                              💳 Payment ID

                            </td>

                            <td style="

                              padding: 18px;
                              border-bottom:
                                1px solid #f2f2f2;
                            ">

                              ${razorpay_payment_id}

                            </td>

                          </tr>

                          <tr>

                            <td style="

                              padding: 20px;
                              font-weight: 700;
                              color: #1f2e4e;
                            ">

                              💰 Total Amount

                            </td>

                            <td style="

                              padding: 20px;
                              color: #ea001e;
                              font-size: 28px;
                              font-weight: 700;
                              font-family: 'Montserrat', sans-serif;
                            ">

                              ₹${booking.totalAmount}

                            </td>

                          </tr>

                        </table>

                        <!-- STATUS -->

                        <div style="

                          margin-top: 40px;
                          text-align: center;
                        ">

                          <span style="

                            background: #ea001e;
                            color: #ffffff;
                            padding: 15px 34px;
                            border-radius: 50px;
                            font-size: 16px;
                            font-weight: 700;
                            display: inline-block;
                            letter-spacing: 0.5px;
                            font-family: 'Montserrat', sans-serif;
                            box-shadow:
                              0 6px 18px rgba(234,0,30,0.25);
                          ">

                            ✔ Booking Approved

                          </span>

                        </div>

                        <!-- CTA BUTTON -->

                        <div style="

                          text-align: center;
                          margin-top: 45px;
                        ">

                          <a
                            href="
                            http://localhost:5000/my-bookings
                            "

                            style="

                              background:
                                linear-gradient(
                                  135deg,
                                  #ea001e,
                                  #1f2e4e
                                );

                              color: #ffffff;
                              text-decoration: none;
                              padding: 17px 38px;
                              border-radius: 10px;
                              font-size: 16px;
                              font-family: 'Montserrat', sans-serif;
                              font-weight: 600;
                              display: inline-block;
                              box-shadow:
                                0 6px 20px rgba(31,46,78,0.25);
                            "
                          >

                            View My Bookings

                          </a>

                        </div>

                      </td>

                    </tr>

                    <!-- FOOTER -->

                    <tr>

                      <td align="center" style="

                        background: #1f2e4e;
                        padding: 35px 25px;
                        color: #d7dbe5;
                      ">

                        <p style="

                          margin: 0;
                          font-size: 16px;
                          font-family: 'Montserrat', sans-serif;
                          font-weight: 600;
                        ">

                          © 2026 Car Rental System

                        </p>

                        <p style="

                          margin-top: 12px;
                          line-height: 1.9;
                          font-size: 14px;
                          color: #b8c1d4;
                        ">

                          Drive Safe • Travel Smart • Rent Easy

                        </p>

                      </td>

                    </tr>

                  </table>

                </td>

              </tr>

            </table>

          </body>

          </html>
        `,
      });
    }

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