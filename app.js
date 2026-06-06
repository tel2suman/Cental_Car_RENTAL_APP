require("dotenv").config();

const express = require("express");

const path = require("path");

const app = express();

const cookieParser = require("cookie-parser");

const cors = require("cors");

const morgan = require("morgan");

const helmet = require("helmet");

const session = require("express-session");

const flash = require("connect-flash");

const rateLimit = require("./app/utils/limiter");

//database connection
const DatabaseConnection = require("./app/config/dbconn");

DatabaseConnection();

// ejs template engine
const ejs = require("ejs");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(cors());

app.use(morgan("dev"));

app.use(
  helmet({
    contentSecurityPolicy: false,
    xDownloadOptions: false,
  }),
);

//static files
app.use(express.static(path.join(__dirname,'public')));
app.use("uploads", express.static(path.join(__dirname, "/uploads")));
app.use("/uploads", express.static("uploads"));

// Apply the rate limiting middleware to all requests.
app.use(rateLimit);

//define json
app.use(express.json());

// Parse form data
app.use(express.urlencoded({ extended: true }));

// session & cookie storage
app.use(cookieParser());

app.use(
  session({
    secret: "car-rental-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  }),
);

app.use(async (req, res, next) => {

  res.locals.user = req?.user?.id || null;

  next();
});

// 2. Flash Configuration
app.use(flash());

// ================= GLOBAL FLASH VARIABLE =================
app.use((req, res, next) => {

  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");

  next();
});

// This makes 'success_msg' available in all your views automatically
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  next();
});

//defining routes
app.use(require("./app/routes/index"));


const port = 5500;

app.listen(port, () => {
  console.log(`💻 Server running at http://localhost:${port}`);
});
