const Joi = require("joi");

const StatusCode = require("./StatusCode");

const UserSchemaValidation = Joi.object({
  //name validation
  name: Joi.string().min(5).max(30).required().trim(),

  //email validation
  email: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net", "in"] },
    })
    .required()
    .trim(),

  //phone validation
  phone: Joi.string().min(10).max(13).required(),

  //password valiation
  password: Joi.string()
    .min(10)
    .max(12)
    .pattern(/(?=.*[a-z])/, "lowercase")
    .pattern(/(?=.*[A-Z])/, "uppercase")
    .pattern(/(?=.*[0-9])/, "number")
    .pattern(/(?=.*[!@#$%^&*])/, "special character")
    .required()
    .trim(),

  //driving validation
  drivingLicense: Joi.string().min(15).max(15).required().trim(),

  //address validation
  address: Joi.string().required().trim(),

  //role validation
  role: Joi.string().trim(),
});

const validateRegister = (req, res, next) => {
  const { error, value } = UserSchemaValidation.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(StatusCode.BAD_REQUEST).json({
      success: false,
      message: error.details[0].message,
    });
  }

  req.body = value;

  next();
};

module.exports = validateRegister;
