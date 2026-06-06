const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["Stripe", "Razorpay", "PayPal"],
      default: Razorpay,
    },

    transactionId: {
      type: String,
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Success", "Failed", "Refunded"],
      default: "Pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Payment", PaymentSchema);
