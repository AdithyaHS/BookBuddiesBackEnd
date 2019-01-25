const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//Create schema
const UserSchema = new Schema({
  name: {
    type: String
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String
  },
  date: {
    type: String,
    default: Date.now
  },
  type: {
    type: String,
    default: "user"
  }
});

module.exports = User = mongoose.model("users", UserSchema);
