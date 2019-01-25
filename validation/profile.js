const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateProfileInput(data) {
  let errors = {};

  data.name = !isEmpty(data.name) ? data.name : "";
  data.email = !isEmpty(data.email) ? data.email : "";
  data.handle = !isEmpty(data.handle) ? data.handle : "";
  data.city = !isEmpty(data.city) ? data.city : "";
  data.state = !isEmpty(data.state) ? data.state : "";


  if (Validator.isEmpty(data.email)) {
    errors.email = "Email field is required";
  }
  if (!Validator.isEmail(data.email)) {
    errors.email = "Enter a valid email address";
  }
  if (Validator.isEmpty(data.name)) {
    errors.name = "Name field is required";
  }
  if (!Validator.isLength(data.handle, {
      min: 2,
      max: 40
    })) {
    errors.handle = "Handle needs to be 2 and 40 characters";
  }
  if (Validator.isEmpty(data.handle)) {
    errors.handle = "handle field is required";
  }
  if (Validator.isEmpty(data.city)) {
    errors.city = "City field is required";
  }
  if (Validator.isEmpty(data.state)) {
    errors.state = "State field is required";
  }
  if (!isEmpty(data.youtube)) {
    if (!Validator.isURL(data.youtube)) {
      errors.youtube = "Not a a valid URL ";
    }
  }
  if (!isEmpty(data.twitter)) {
    if (!Validator.isURL(data.twitter)) {
      errors.twitter = "Not a a valid URL ";
    }
  }
  if (!isEmpty(data.facebook)) {
    if (!Validator.isURL(data.facebook)) {
      errors.facebook = "Not a a valid URL ";
    }
  }

  if (!isEmpty(data.instagram)) {
    if (!Validator.isURL(data.instagram)) {
      errors.instagram = "Not a a valid URL ";
    }
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};