const User = require("../models/User");

const Booking = require("../models/Booking");

const Car = require("../models/Car");

const cloudinary = require("../config/cloudinary");

const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

const crypto = require("crypto");

const transporter = require("../config/emailConfig");

const fs = require("fs");


class UserController {
  // Register page
  async registerPage(req, res) {
    res.render("frontend/pages/register", {
      title: "Register Page",
    });
  }

  // Login page
  async loginPage(req, res) {
    res.render("frontend/pages/login", {
      title: "Login Page",
    });
  }

  //User Dashbaord
  async userDashboard(req, res) {
    try {

      const user = await User.findById(req.user.id);

      const cars = await Car.find({ availability: true });

      if (!user) {
        return res.redirect("/login");
      }

      return res.render("frontend/pages/userIndex", {
        title: "User Page",
        user,
        cars,
      });
    } catch (error) {
      return res.send(error.message);
    }
  }

  //Forgot Password page
  async forgotPasswordPage(req, res) {
    res.render("frontend/pages/forget_password", {
      title: "Forget Password Page",
    });
  }

  //reset password link page
  async resetPasswordPage(req, res) {
    res.render("frontend/pages/reset_password", {
      token: req.params.token,
      title: "Reset Password Page",
    });
  }

  async register(req, res) {
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

        return res.redirect("/register");
      }

      // CHECK EXISTING USER
      const existingUser = await User.findOne({
        $or: [{ email }, { drivingLicense }],
      });

      if (existingUser) {
        req.flash("error_msg", "Email or Driving License already exists");

        return res.redirect("/register");
      }

      // Password strength
      if (password.length < 10) {
        req.flash("error_msg", "Password must be 10 length character");

        return res.redirect("/register");
      }

      // Password strength
      if (phone.length < 10) {
        req.flash("error_msg", "Phone Number must be 10 length character");

        return res.redirect("/register");
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

      return res.redirect("/login");
    } catch (error) {
      console.log(error);

      req.flash("error_msg", "Something went wrong");

      res.redirect("/register");
    }
  }

  // LOGIN CONTROLLER WITH ACCESS & REFRESH TOKEN

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // FIND USER
      const user = await User.findOne({ email });

      if (!user) {
        return res.redirect("/login");
      }

      // CHECK PASSWORD
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.redirect("/login");
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

      return res.redirect("/dashboard");
    } catch (error) {
      console.log(error);

      return res.redirect("/login");
    }
  }

  async logout(req, res) {
    try {
      const user = await User.findById(req.user.id);

      if (user) {
        user.refreshToken = null;
        await user.save();
      }

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      return res.redirect("/login");
    } catch (error) {
      console.log(error);

      return res.redirect("/login");
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      // FIND USER
      const user = await User.findOne({ email });

      if (!user) {
        req.flash("error_msg", "User not found");

        return res.redirect("/forgot-password-page");
      }

      // GENERATE TOKEN
      const resetToken = crypto.randomBytes(32).toString("hex");

      // HASH TOKEN
      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      // SAVE TOKEN
      user.resetPasswordToken = hashedToken;

      user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

      await user.save();

      // RESET URL
      const resetURL = `http://localhost:5500/reset-password/${resetToken}`;

      // MAIL TRANSPORTER
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // SEND MAIL
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Reset Password",
        html: `
        <h3>Reset Password</h3>

        <p>
          Click the link below to reset password:
        </p>

        <a href="${resetURL}">
          Reset Password
        </a>
      `,
      });

      req.flash("success_msg", "Reset link sent to your email");

      return res.redirect("/forgot-password-page");
    } catch (error) {
      console.log(error);

      req.flash("error_msg", "Something went wrong");

      return res.redirect("/forgot-password-page");
    }
  }

  async resetPasswordLink(req, res) {
    try {
      const { token } = req.params;

      const { password } = req.body;

      // HASH TOKEN
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      // FIND USER
      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: {
          $gt: Date.now(),
        },
      });

      if (!user) {
        req.flash("error_msg", "Invalid or expired token");

        return res.redirect("/forgot-password-page");
      }

      // HASH NEW PASSWORD
      const hashedPassword = await bcrypt.hash(password, 10);

      // UPDATE PASSWORD
      user.password = hashedPassword;

      user.resetPasswordToken = undefined;

      user.resetPasswordExpire = undefined;

      await user.save();

      req.flash("success_msg", "Password reset successful");

      return res.redirect("/login");
    } catch (error) {
      console.log(error);

      req.flash("error_msg", "Something went wrong");

      return res.redirect("/forgot-password-page");
    }
  }

  async userProfile(req, res) {
    try {
      // FIND LOGGED IN USER
      const user = await User.findById(req.user.id);

      if (!user) {
        req.flash("error_msg", "User not found");
        return res.redirect("/login");
      }

      // RENDER PROFILE PAGE
      return res.render("frontend/pages/profile", {
        title: "User Profile Page",
        user,
      });
    } catch (error) {
      console.log(error);

      req.flash("error_msg", "Something went wrong");

      return res.redirect("/dashboard");
    }
  }

  // ================= EDIT PROFILE PAGE =================

  async editProfilePage(req, res) {
    try {
      // FIND USER
      const user = await User.findById(req.user.id);

      if (!user) {
        req.flash("error_msg", "User not found");

        return res.redirect("/profile");
      }

      // RENDER EDIT PAGE
      return res.render("frontend/pages/editProfile", {
        title: "Edit Profile Page",
        user,
      });
    } catch (error) {
      console.log(error);

      req.flash("error_msg", "Something went wrong");

      return res.redirect("/profile");
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

        return res.redirect("/edit-profile");
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

      return res.redirect("/profile");
    } catch (error) {
      console.log(error);

      req.flash("error_msg", error.message);

      return res.redirect("/edit-profile");
    }
  }

  // ================= ADMIN DASHBOARD =================

  async adminDashboard(req, res) {
    try {
      const user = await User.findById(req.user.id);

      // ================= ADMIN DASHBOARD =================

      if (req.user.role === "admin") {
        // MONTHLY EARNINGS
        const earningsData = await Booking.aggregate([
          {
            $match: {
              paymentStatus: "Paid",
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

        // MONTHS
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

        // EARNINGS ARRAY
        const earningsChart = new Array(12).fill(0);

        earningsData.forEach((item) => {
          earningsChart[item._id.month - 1] = item.totalEarnings;
        });

        // CAR AVAILABILITY
        const availableCars = await Car.countDocuments({
          availability: true,
        });

        const unavailableCars = await Car.countDocuments({
          availability: false,
        });

        // TOTAL DATA
        const totalCars = await Car.countDocuments();

        const totalUsers = await User.countDocuments({
          role: "user",
        });

        const totalBookings = await Booking.countDocuments();

        // RENDER ADMIN DASHBOARD
        return res.render("admin/dashboard", {
          title: "Admin Dashboard Page",
          months,
          earningsChart,
          availableCars,
          unavailableCars,
          totalCars,
          totalUsers,
          totalBookings,
          user: req.user,
        });
      }
    } catch (error) {
      console.log(error);

      return res.redirect("/dashboard");
    }
  }
}

module.exports = new UserController();