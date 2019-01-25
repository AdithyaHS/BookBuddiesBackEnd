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
  title: {
    type: String,
    required: true
  },
  id: {
    type: String
  },
  subtitle: {
    type: String
  },
  location: {
    type: String
  },
  genre: [
    {
      type: String
    }
  ],
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
  authors: [
    {
      type: String
    }
  ],
  publishedDate: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String
    // required: true
  },
  userContent: {
    type: String
  }
});

module.exports = Book = mongoose.model("book", BookSchema);
