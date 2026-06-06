// middleware/adminCheck.js

const adminCheck = (req, res, next) => {

  try {

    if (req.user.role !== "admin") {

      req.flash("error_msg", "Access denied");

      return res.redirect("/admin/dashboard");
    }

    next();

  } catch (error) {

        console.log(error);

        return res.redirect("/admin/dashboard");
  }

};

module.exports = adminCheck;
