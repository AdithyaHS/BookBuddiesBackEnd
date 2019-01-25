const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");

const users = require("./routes/api/users");
const profile = require("./routes/api/profile");
const posts = require("./routes/api/posts");
const books = require("./routes/api/books");
const bookFilter = require("./routes/api/bookFilter");
const barcodeReader = require("./routes/api/barcodeReader");
const admin = require("./routes/api/admin");

const app = express();
var cors = require("cors");

//Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors()); // Use this after the variable declaration

//Body parser middleware
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(bodyParser.json());

//DB Config
const db = require("./config/keys").mongoURI;

//Connect to MongoDb
mongoose
  .connect(db)
  .then(() => console.log("MongoDb connected"))
  .catch(err => console.log(err));

// app.get("/", (req, res) => res.send("hello world..!"));
//Passport middleware
app.use(passport.initialize());

//Passport config
require("./config/passport.js")(passport);

//Use routes
app.use("/api/users", users);
app.use("/api/profile", profile);
app.use("/api/posts", posts);
app.use("/api/books", books);
app.use("/api/bookFilter", bookFilter);
app.use("/api/barcodeReader", barcodeReader);
app.use("/api/admin", admin);

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server running on port ${port}`));
