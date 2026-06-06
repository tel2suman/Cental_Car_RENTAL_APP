const mongoose = require("mongoose");

const CarSchema = new mongoose.Schema(
  {
    brand: {
      type: String,
      required: true,
    },

    model: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["SUV", "Sedan", "Hatchback", "Luxury", "Electric"],
      default: "Hatchback",
    },

    seatingCapacity: {
      type: String,
      enum: ["4STR", "7STR", "9STR"],
      default: "7STR",
    },

    registrationYear: {
      type: Number,
      required: true,
    },

    fuelType: {
      type: String,
      enum: ["Petrol", "Diesel", "Electric", "Hybrid"],
      default: "Petrol",
    },

    transmission: {
      type: String,
      enum: ["Manual", "Automatic"],
      default: "Manual",
    },

    pricePerDay: {
      type: Number,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    availability: {
      type: Boolean,
      default: true,
    },

    image: {
      type: String,
    },
  },
  { timestamps: true },
  { versionKey: false },
);

module.exports = mongoose.model("Car", CarSchema);
