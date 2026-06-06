
const User = require("../models/User");


class HomeController {
  async homePage(req, res) {
    try {
      res.render("frontend/pages/home", {
        title: "Home Page",
      });
    } catch (error) {
      console.log(error);
    }
  }

  async aboutPage(req, res) {

    try {

      const user = await User.findById(req?.user?.id);

      return res.render("frontend/pages/about", {
        title: "About Page",
        user,
      });
    } catch (error) {
      console.log(error);
       return res.redirect("/");
    }
  }

  async contactPage(req, res) {

    try {

      const user = await User.findById(req?.user?.id);

      return res.render("frontend/pages/contact", {
        title: "Contact Page",
        user,
      });

    } catch (error) {
      console.log(error);
      return res.redirect("/");
    }
  }
}

module.exports = new HomeController();
