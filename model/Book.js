const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//Create Schema
const BookSchema = new Schema({
  ISBN: {
    type: String,
    required: true
  },
  uploadUser: {
    type: Schema.Types.ObjectId,
    ref: "users"
  },
  requestUser: {
    type: Schema.Types.ObjectId,
    ref: "users"
  },
  title: {
    type: String,
    required: true
  },
  // id: {
  //   type: String
  // },
  subtitle: {
    type: String
  },
  location: {
    type: String
  },
  genre: [{
    type: String
  }],
  rating: {
    type: Number
  },
  thumbnailURL: {
    //imageLinks>Thumbnail
    type: String
  },
  smallThumbnailURL: {
    //imageLinks>smallThumbnail
    type: String
  },
  language: {
    type: String
  },
  authors: [{
    type: String
  }],
  publishedDate: {
    type: Date
    // default: Date.now
  },
  uploadedDate: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String
    // required: true
  },
  originalID: {
    type: String
  },
  userContent: {
    type: String
  }
});

// module.exports = Book = mongoose.model("book", BookSchema);
// module.exports = RequestedBook = mongoose.model("requestedBook", BookSchema);
// module.exports = SharedBook = mongoose.model("sharedBook", BookSchema);
Book = mongoose.model("book", BookSchema);
RequestedBook = mongoose.model("requestedBook", BookSchema);
SharedBook = mongoose.model("sharedBook", BookSchema);
ReportedBook = mongoose.model("reportedBook", BookSchema);
module.exports = {
  Book: Book,
  RequestedBook: RequestedBook,
  SharedBook: SharedBook,
  ReportedBook: ReportedBook
};