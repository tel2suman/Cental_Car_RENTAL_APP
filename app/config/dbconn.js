require("dotenv").config();

const mongoose = require("mongoose");

require("node:dns/promises").setServers(["1.1.1.1"]);

const MONGO_URL = process.env.MONGODB_URL;

const DatabaseConnection = async () => {
  try {
    const connect = await mongoose.connect(MONGO_URL);

    if (connect) {
      console.log("🚀 MongoDB CONNECTED SUCCESSFULLY !!!");
    } else {
      console.log("Database is not connected");
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = DatabaseConnection;