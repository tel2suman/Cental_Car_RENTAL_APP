
const Car = require("../models/Car");

const User = require("../models/User");

const cloudinary = require("../config/cloudinary");

const fs = require("fs");

class CarController {
  async addCarPage(req, res) {
    res.render("backend/admin/addCar", {
      title: "Car Create Page",
    });
  }

  async availableCars(req, res) {

    try {

      const cars = await Car.find({ availability: true });

      const user = await User.findById(req.user.id);

      return res.render("frontend/pages/carlist", {
        title: "User Vehicles Page",
        cars,
        user,
      });
    } catch (error) {
      console.log(error);

      return res.redirect("/admin/dashboard");
    }
  }

  async allCars(req, res) {
    try {
      const cars = await Car.find();

      return res.render("backend/admin/manageCar", {
        title: "Car Manager Page",
        data: cars,
      });
    } catch (error) {
      console.log(error);

      return res.redirect("/admin/dashboard");
    }
  }

  async addCar(req, res) {
    try {
      const {
        brand,
        model,
        type,
        seatingCapacity,
        registrationYear,
        fuelType,
        transmission,
        pricePerDay,
        location,
        availability,
      } = req.body;

      // VALIDATION
      if (
        (!brand || !model || !type || !seatingCapacity || !registrationYear,
        !fuelType || !transmission || !pricePerDay || !location)
      ) {
        req.flash("error_msg", "All fields are required");

        return res.redirect("/add-car-page");
      }

      // IMAGE UPLOAD
      let imageUrl = "";

      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "uploads",
          width: 500,
          height: 500,
          crop: "limit",
          quality: "auto",
        });

        imageUrl = result.secure_url;

        // REMOVE LOCAL FILE
        fs.unlinkSync(req.file.path);
      }

      // CREATE CAR
      await Car.create({
        brand,
        model,
        type,
        seatingCapacity,
        registrationYear,
        fuelType,
        transmission,
        pricePerDay,
        location,
        availability,
        image: imageUrl,
      });

      req.flash("success_msg", "Car added successfully");

      return res.redirect("/manage-cars");
    } catch (error) {
      console.log(error);

      req.flash("error_msg", "Something went wrong");

      return res.redirect("/add-car-page");
    }
  }

  // ================= SINGLE CAR =================
  async singleCar(req, res) {
    try {
      const cars = await Car.findById(req.params.id);

      if (!cars) {
        req.flash("error_msg", "Car not found");

        return res.redirect("/manage-cars");
      }

      return res.render("backend/admin/viewCar", {
        title: "View Car Page",
        data: cars,
      });
    } catch (error) {
      console.log(error);

      return res.redirect("/manage-cars");
    }
  }

  // ================= EDIT CAR PAGE =================

  async editCarPage(req, res) {
    try {
      const car = await Car.findById(req.params.id);

      if (!car) {
        req.flash("error_msg", "Car not found");

        return res.redirect("/manage-cars");
      }

      return res.render("backend/admin/editCar", {
        title: "Edit Car Page",
        data: car,
      });
    } catch (error) {
      console.log(error);

      return res.redirect("/manage-cars");
    }
  }

  // ================= UPDATE CAR =================
  async updateCar(req, res) {
    try {
      const {
        brand,
        model,
        type,
        seatingCapacity,
        registrationYear,
        fuelType,
        transmission,
        pricePerDay,
        location,
        availability,
      } = req.body;

      const car = await Car.findById(req.params.id);

      if (!car) {
        req.flash("error_msg", "Car not found");

        return res.redirect("/manage-cars");
      }

      // IMAGE UPDATE
      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "uploads",
          width: 500,
          height: 500,
          crop: "limit",
          quality: "auto",
        });

        car.image = result.secure_url;

        fs.unlinkSync(req.file.path);
      }

      // UPDATE DATA
      car.brand = brand;
      car.model = model;
      car.type = type;
      car.seatingCapacity = seatingCapacity;
      car.registrationYear = registrationYear;
      car.fuelType = fuelType;
      car.transmission = transmission;
      car.pricePerDay = pricePerDay;
      car.location = location;
      car.availability = availability;

      await car.save();

      req.flash("success_msg", "Car updated successfully");

      return res.redirect("/manage-cars");
    } catch (error) {
      console.log(error);

      req.flash("error_msg", "Something went wrong");

      return res.redirect("/manage-cars");
    }
  }

  // ================= DELETE CAR =================
  async deleteCar(req, res) {
    try {
      await Car.findByIdAndDelete(req.params.id);

      req.flash("success_msg", "Car deleted successfully");

      return res.redirect("/manage-cars");
    } catch (error) {
      console.log(error);

      return res.redirect("/manage-cars");
    }
  }

  // ================= SEARCH CARS USING REGEX =================

  async searchCars(req, res) {

    try {

      const { keyword } = req.query;

      // VALIDATE SEARCH INPUT
      if (!keyword || keyword.trim() === "") {
        req.flash("error_msg", "Please enter search keyword");

        return res.redirect("/available-cars");
      }

      // Users
      const user = await User.findById(req.user.id);


      // REGEX SEARCH
      const cars = await Car.find({ availability: true,
        $or: [
          {
            brand: {
              $regex: keyword,
              $options: "i",
            },
          },

          {
            model: {
              $regex: keyword,
              $options: "i",
            },
          },

          {
            type: {
              $regex: keyword,
              $options: "i",
            },
          },

          {
            fuelType: {
              $regex: keyword,
              $options: "i",
            },
          },

          {
            transmission: {
              $regex: keyword,
              $options: "i",
            },
          },

          {
            location: {
              $regex: keyword,
              $options: "i",
            },
          },
        ],
      });

      return res.render("frontend/pages/carlist", {
        title: "Car List Page",
        cars,
        user,
      });

    } catch (error) {

      console.log(error);

      req.flash("error_msg", "Search failed");

      return res.redirect("/available-cars");
    }
  }

  // ================= CHANGE CAR AVAILABILITY =================

  async changeAvailability(req, res) {

    try {

      // FIND CAR
      const car = await Car.findById(req.params.id);

      if (!car) {

        req.flash("error_msg", "Car not found");

        return res.redirect("/manage-cars");
      }

      // TOGGLE AVAILABILITY
      car.availability = !car.availability;

      await car.save();

      req.flash(
        "success_msg",
        `Car availability changed to ${
          car.availability ? "Available" : "Unavailable"
        }`,
      );

      return res.redirect("/manage-cars");

    } catch (error) {

      console.log(error);

      req.flash("error_msg", "Something went wrong");

      return res.redirect("/manage-cars");
    }
  }
}


module.exports = new CarController();
