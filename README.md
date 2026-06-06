# 🚗 Cental-Car Rental System

A full-stack Car Rental Management System built with **Node.js**, **Express.js**, **MongoDB**, **EJS**, and **Bootstrap**.
The platform allows users to browse, book, and pay for cars online, while admins can manage cars, bookings, analytics, and customer records.

---

# 📌 Features

## 👤 User Features

* User Registration & Login
* JWT Authentication with Access & Refresh Tokens
* Forgot Password Functionality
* Secure Password Hashing using bcrypt
* User Profile Management
* Upload Profile Picture using Cloudinary
* Browse Available Cars
* Search & Filter Cars
* View Car Details
* Book Cars Online
* Razorpay Payment Gateway Integration
* Booking Cancellation
* Email Notification after Successful Payment
* View Booking History
* Responsive Modern UI

---

## 🔐 Authentication Features

* JWT Authentication
* Access Token & Refresh Token System
* Secure HTTPOnly Cookies
* Role-Based Authorization
* Protected Routes
* Admin & User Dashboard Separation

---

## 🚘 Car Management Features

### Admin

* Add New Cars
* Upload Car Images using Cloudinary
* Edit Car Details
* Delete Cars
* Manage Car Availability
* View All Cars

### User

* View Available Cars Only
* Search Cars using Regex
* Filter Cars by:

  * Brand
  * Fuel Type
  * Transmission
  * Location
  * Car Type

---

## 📖 Booking Features

* Book Available Cars
* Calculate Rental Duration
* Dynamic Total Amount Calculation
* Payment Integration using Razorpay
* Booking Status Management
* Payment Status Tracking
* Cancel Bookings
* Refund Status Handling

---

## 💳 Razorpay Payment Gateway

Integrated Razorpay Standard Checkout with:

* Order Creation API
* Payment Verification
* Signature Validation
* Payment Success Handling
* Payment Failure Handling

---

## 📊 Admin Dashboard Analytics

Admin dashboard includes:

* Total Earnings
* Total Cars
* Available Cars
* Booked Cars
* Total Users
* Total Bookings
* Monthly Earnings Bar Chart
* Car Availability Pie Chart

Implemented using MongoDB Aggregation Pipeline and Chart.js.

---

# 🛠️ Tech Stack

## Frontend

* EJS
* Bootstrap 4.5 / 5
* Font Awesome
* Google Fonts
* AOS Animation Library
* Chart.js

## Backend

* Node.js
* Express.js

## Database

* MongoDB
* Mongoose

## Authentication

* JWT
* bcrypt

## Cloud Storage

* Cloudinary

## Payment Gateway

* Razorpay

## Email Service

* Nodemailer

---

# 📂 Project Structure

```bash
Car_Rental_System/
│
├── config/
│   ├── cloudinary.js
│   ├── db.js
│   └── razorpay.js
│
├── controllers/
│   ├── AdminController.js
│   ├── BookingController.js
│   ├── CarController.js
│   ├── HomeController.js
│   └── UserController.js
│
├── middleware/
│   ├── authCheck.js
│   ├── authorizeRoles.js
│   └── upload.js
│
├── models/
│   ├── Booking.js
│   ├── Car.js
│   └── User.js
│
├── routes/
│   ├── AdminRoute.js
│   ├── BookingRoute.js
│   ├── CarRoute.js
│   ├── HomeRoute.js
│   ├── UserRoute.js
│   └── index.js
│
├── views/
│   ├── backend/
│   └── frontend/
│
├── public/
│
├── .env
├── app.js
├── package.json
└── README.md
```

---

# ⚙️ Installation

## 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/car-rental-system.git
```

---

## 2️⃣ Install Dependencies

```bash
npm install
```

---

## 3️⃣ Create `.env` File

```env
PORT=5000

MONGO_URI=your_mongodb_connection

JWT_SECRET_KEY=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

---

# ▶️ Run Project

```bash
npm start
```

or

```bash
nodemon app.js
```

---

# 🔑 Default Roles

| Role  | Access                           |
| ----- | -------------------------------- |
| Admin | Manage Cars, Bookings, Analytics |
| User  | Book Cars, Manage Profile        |

---

# 📸 Screens Included

* Home Page
* Car Listing
* Car Details
* Booking Page
* Payment Page
* User Dashboard
* Admin Dashboard
* Analytics Charts

---

# 🔒 Security Features

* Password Hashing using bcrypt
* JWT Authentication
* HTTPOnly Cookies
* Role-Based Access Control
* Payment Signature Verification
* Protected Admin Routes

---

# 📈 MongoDB Aggregation Used For

* Total Earnings Calculation
* Monthly Revenue Analytics
* Car Availability Analytics
* Dashboard Statistics

---

# 📧 Email Notifications

Users receive booking confirmation emails after successful payment containing:

* Booking Details
* Payment Information
* Car Information
* Rental Duration
* Total Amount

---

# 💡 Future Improvements

* Live Car Tracking
* Google Maps Integration
* Online Refund API
* Admin Reports Export
* Multi-language Support
* Reviews & Ratings
* Coupon System

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the project
2. Create your feature branch
3. Commit your changes
4. Push to branch
5. Open a Pull Request

---

# 📜 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

Developed by Suman Bhattacharjee

---

# ⭐ Support

If you like this project, give it a ⭐ on GitHub.
