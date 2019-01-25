const Validator = require("validator");
const isEmpty = require("./is-empty");

// module.exports = function validateBookInput(data) {
//   let errors = {};
//   console.log("data111:");
//   console.log(data);
//   data.subtitle = !isEmpty(data.subtitle) ? data.subtitle : "";
//   data.Location = !isEmpty(data.Location) ? data.Location : "Bloomington";
//   data.genre = !isEmpty(data.genre) ? data.genre : ["NOT_FOUND"];
//   data.rating = !isEmpty(data.rating) ? data.rating : -1;
//   data.thumbnailURL = !isEmpty(data.thumbnailURL)
//     ? data.thumbnailURL
//     : "http://admin.johnsons.net/janda/files/flipbook-coverpage/nocoverimg.jpg";
//   data.smallThumbnailURL = !isEmpty(data.smallThumbnailURL)
//     ? data.smallThumbnailURL
//     : "http://admin.johnsons.net/janda/files/flipbook-coverpage/nocoverimg.jpg";
//   data.language = !isEmpty(data.language) ? data.language : "en";
//   data.authors = !isEmpty(data.authors) ? data.authors : ["NOT_FOUND"];
//   data.publishedDate = !isEmpty(data.publishedDate)
//     ? data.publishedDate
//     : "01-01-1990";
//   data.description = !isEmpty(data.description) ? data.description : "";
//   data.userContent = !isEmpty(data.userContent) ? data.userContent : "";

//   if (!Validator.isISBN(data.ISBN)) {
//     errors.ISBN = "Enter a valid ISBN number";
//   }

//   if (Validator.isEmpty(data.title)) {
//     errors.Title = "Title field is required";
//   }

//   return {
//     errors,
//     isValid: isEmpty(errors),
//     validAndFixedInput: data
//   };
// };

module.exports = function validateBookInput(data) {
  console.log(data);
  if (data.bookInfo != undefined) {
    data = data.bookInfo;
  }
  let errors = {};
  // console.log("data111:");
  // console.log("data.genre.length: " + data.genre.length);
  data.subtitle = !isEmpty(data.subtitle) ? data.subtitle : "";
  data.Location = !isEmpty(data.Location) ? data.Location : "Bloomington";
  data.genre = !isEmpty(data.genre) && data.genre.length > 0 ? data.genre : ["Unknown genre"];
  data.authors = !isEmpty(data.authors) && data.authors.length > 0 ?
    data.authors : ["Unknown author"];
  data.rating = !isEmpty(data.rating) ? data.rating : -1;
  data.thumbnailURL = !isEmpty(data.thumbnailURL) ?
    data.thumbnailURL :
    "http://admin.johnsons.net/janda/files/flipbook-coverpage/nocoverimg.jpg";
  data.smallThumbnailURL = !isEmpty(data.smallThumbnailURL) ?
    data.smallThumbnailURL :
    "http://admin.johnsons.net/janda/files/flipbook-coverpage/nocoverimg.jpg";
  data.language = !isEmpty(data.language) ? data.language : "en";
  data.publishedDate = !isEmpty(data.publishedDate) ?
    data.publishedDate :
    "01-01-1990";
  data.description = !isEmpty(data.description) ? data.description : "";
  data.userContent = !isEmpty(data.userContent) ? data.userContent : "";

  if (data.ISBN == undefined) {
    errors.ISBN = "Enter a valid ISBN number";
  }

  if (data.title == undefined || Validator.isEmpty(data.title)) {
    errors.Title = "Title field is required";
  }
  // console.log(data);

  return {
    errors,
    isValid: isEmpty(errors),
    validAndFixedInput: data
  };
};