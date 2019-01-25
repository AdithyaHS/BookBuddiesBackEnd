const express = require("express");
const router = express.Router();
const passport = require("passport");
const javascriptBarcodeReader = require("javascript-barcode-reader");
const searchBooks = require('./books.js');

// console.log(typeof bookSearch.populateFromGoogleBooks);

// @route POST api/barcodeReader/
// @desc Read barcode and return ISBN
// @access Private
router.post("/", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  req.body = req.body.data
  javascriptBarcodeReader(
      req.body.imagePath,
      /* Image file Path || {data: pixelArray, width, height} || HTML5 Canvas ImageData */
      {
        barcode: "ean-13"
        // type: 'industrial', //optional type
      }
    )
    .then(code => {
      // return res.json({
      //   "ISBN": "9" + code
      // });
      console.log(9 + code);
      searchBooks.populateFromGoogleBooks("isbn:9" + code, res);


    })
    .catch(err => {
      console.log(err);
    });
});

module.exports = router;