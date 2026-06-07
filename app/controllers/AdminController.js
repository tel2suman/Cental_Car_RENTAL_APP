const User = require("../models/User");

const Booking = require("../models/Booking");

const Car = require("../models/Car");

const cloudinary = require("../config/cloudinary");

const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const crypto = require("crypto");

const nodemailer = require("nodemailer");

const fs = require("fs");

class AdminController {
  // Register page
  async registerView(req, res) {
    res.render("backend/admin/register", {
      title: "Register Page",
    });
  }

  // Login page
  async loginView(req, res) {
    res.render("backend/admin/login", {
      title: "Login Page",
    });
  }

  async adminRegister(req, res) {
    try {
      const { name, email, password, phone, drivingLicense, address, role } =
        req.body;

      //validate all fields
      if (
        !name ||
        !email ||
        !password ||
        !phone ||
        !drivingLicense ||
        !address
      ) {
        req.flash("error_msg", "All fields are required");

        return res.redirect("/admin/register");
      }

      // CHECK EXISTING USER
      const existingUser = await User.findOne({
        $or: [{ email }, { drivingLicense }],
      });

      if (existingUser) {
        req.flash("error_msg", "Email or Driving License already exists");

        return res.redirect("/admin/register");
      }

      // Password strength
      if (password.length < 10) {
        req.flash("error_msg", "Password must be 10 length character");

        return res.redirect("/admin/register");
      }

      // Password strength
      if (phone.length < 10) {
        req.flash("error_msg", "Phone Number must be 10 length character");

        return res.redirect("/admin/register");
      }

      // HASH PASSWORD
      const salt = await bcrypt.genSalt(10);
      const hashedpassword = await bcrypt.hash(password, salt);

      // CREATE USER
      const user = await User.create({
        name,
        email,
        password: hashedpassword,
        phone,
        drivingLicense,
        address,
        role,
      });

      // SUCCESS FLASH MESSAGE
      req.flash("success_msg", "Registration successful. Please login.");

      return res.redirect("/admin/login");
    } catch (error) {
      console.log(error);

      req.flash("error_msg", "Something went wrong");

      res.redirect("/admin/register");
    }
  }

  // LOGIN CONTROLLER WITH ACCESS & REFRESH TOKEN

  async adminLogin(req, res) {
    try {
      const { email, password } = req.body;

      // FIND USER
      const user = await User.findOne({ email });

      if (!user) {
        return res.redirect("/admin/login");
      }

      // CHECK PASSWORD
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.redirect("/admin/login");
      }

      // ================= ACCESS TOKEN =================
      const accessToken = jwt.sign(
        {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET_KEY,
        {
          expiresIn: "60m",
        },
      );

      // ================= REFRESH TOKEN =================
      const refreshToken = jwt.sign(
        {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        process.env.JWT_REFRESH_SECRET,
        {
          expiresIn: "7d",
        },
      );

      // SAVE REFRESH TOKEN IN DATABASE
      user.refreshToken = refreshToken;

      await user.save();

      // STORE TOKENS IN COOKIE
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });

      return res.redirect("/admin/dashboard");
    } catch (error) {
      console.log(error);

      return res.redirect("/admin/login");
    }
  }

  async adminLogout(req, res) {
    try {
      const user = await User.findById(req.user.id);

      if (user) {
        user.refreshToken = null;
        await user.save();
      }

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      return res.redirect("/admin/login");
    } catch (error) {
      console.log(error);

      return res.redirect("/admin/login");
    }
  }

  // ================= ADMIN DASHBOARD =================
  async adminDashboard(req, res) {
    try {
      // FIND ADMIN
      const user = await User.findById(req.user.id);

      // CHECK ADMIN
      if (req.user.role !== "admin") {
        return res.redirect("/admin/dashboard");
      }

      // ================= MONTHLY EARNINGS =================

      const earningsData = await Booking.aggregate([
        {
          $match: {
            paymentStatus: "Success",
          },
        },

        {
          $group: {
            _id: {
              month: {
                $month: "$createdAt",
              },
            },

            totalEarnings: {
              $sum: "$totalAmount",
            },
          },
        },

        {
          $sort: {
            "_id.month": 1,
          },
        },
      ]);

      // ================= MONTHS =================

      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      // ================= CHART DATA =================

      const earningsChart = new Array(12).fill(0);

      earningsData.forEach((item) => {
        earningsChart[item._id.month - 1] = item.totalEarnings;
      });

      // ================= TOTAL EARNINGS =================

      const totalEarnings = await Booking.aggregate([
        {
          $match: {
            paymentStatus: "Success",
          },
        },

        {
          $group: {
            _id: null,

            total: {
              $sum: "$totalAmount",
            },
          },
        },
      ]);

      // ================= CAR STATS =================

      const availableCars = await Car.countDocuments({
        availability: true,
      });

      const unavailableCars = await Car.countDocuments({
        availability: false,
      });

      // ================= TOTAL COUNTS =================

      const totalCars = await Car.countDocuments();

      const totalUsers = await User.countDocuments({
        role: "user",
      });

      const totalBookings = await Booking.countDocuments();

      // ================= PENDING BOOKINGS =================

      const pendingBookings = await Booking.countDocuments({
        bookingStatus: "Pending",
      });

      // ================= APPROVED BOOKINGS =================

      const approvedBookings = await Booking.countDocuments({
        bookingStatus: "Approved",
      });

      // ================= CANCELLED BOOKINGS =================

      const cancelledBookings = await Booking.countDocuments({
        bookingStatus: "Cancelled",
      });

      // ================= TOTAL REVENUE THIS MONTH =================

      const currentMonth = new Date().getMonth() + 1;

      const monthlyRevenue = await Booking.aggregate([
        {
          $match: {
            paymentStatus: "Success",

            $expr: {
              $eq: [
                {
                  $month: "$createdAt",
                },

                currentMonth,
              ],
            },
          },
        },

        {
          $group: {
            _id: null,

            total: {
              $sum: "$totalAmount",
            },
          },
        },
      ]);

      // ================= RENDER =================

      return res.render("backend/admin/dashboard", {
        title: "Admin Dashboard Page",

        months,

        earningsChart,

        totalEarnings: totalEarnings[0]?.total || 0,

        monthlyRevenue: monthlyRevenue[0]?.total || 0,

        availableCars,

        unavailableCars,

        totalCars,

        totalUsers,

        totalBookings,

        pendingBookings,

        approvedBookings,

        cancelledBookings,

        user,
      });
    } catch (error) {
      console.log(error);

      return res.redirect("/admin/dashboard");
    }
  }

  async adminProfile(req, res) {
    try {
      // FIND LOGGED IN USER
      const user = await User.findById(req.user.id);

      if (!user) {
        req.flash("error_msg", "User not found");
        return res.redirect("/admin/login");
      }

      // RENDER PROFILE PAGE
      return res.render("backend/admin/profile", {
        title: "Admin Profile Page",
        data: user,
      });
    } catch (error) {
      console.log(error);

      req.flash("error_msg", "Something went wrong");

      return res.redirect("/admin/dashboard");
    }
  }

  // ================= EDIT PROFILE PAGE =================

  async editProfilePage(req, res) {
    try {
      // FIND USER
      const user = await User.findById(req.user.id);

      if (!user) {
        req.flash("error_msg", "User not found");

        return res.redirect("/admin/profile");
      }

      // RENDER EDIT PAGE
      return res.render("backend/admin/editProfile", {
        title: "Edit Profile Page",
        data: user,
      });
    } catch (error) {
      console.log(error);

      req.flash("error_msg", "Something went wrong");

      return res.redirect("/admin/profile");
    }
  }

  async updateProfile(req, res) {
    try {
      const { name, email, phone, drivingLicense, address, password } =
        req.body;

      // FIND USER
      const user = await User.findById(req.user.id);

      if (!user) {
        req.flash("error_msg", "User not found");

        return res.redirect("/admin/edit-profile");
      }

      // UPDATE BASIC INFO
      user.name = name;

      user.email = email;

      user.phone = phone;

      user.drivingLicense = drivingLicense;

      user.address = address;

      // ================= IMAGE UPLOAD =================

      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "uploads",
        });

        user.profileImage = result.secure_url;

        // DELETE LOCAL FILE
        fs.unlinkSync(req.file.path);
      }

      // ================= PASSWORD =================

      if (password && password.trim() !== "") {
        const hashedPassword = await bcrypt.hash(password, 10);

        user.password = hashedPassword;
      }

      // SAVE
      await user.save();

      req.flash("success_msg", "Profile updated successfully");

      return res.redirect("/admin/profile");
    } catch (error) {
      console.log(error);

      req.flash("error_msg", error.message);

      return res.redirect("/admin/edit-profile");
    }
  }
}



module.exports = new AdminController();