const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");
const axios = require("axios");
const vision = require("@google-cloud/vision");
const request = require("request");

//Post Model
const Post = require("../../model/Post");
//Book Model
const models = require("../../model/Book");
const RequestedBook = models.RequestedBook;
const SharedBook = models.SharedBook;
const ReportedBook = models.ReportedBook;
const Profile = require("../../model/Profile");

//Validation
const validatePostInput = require("../../validation/post");
const validateBookInput = require("../../validation/book");

// import Quagga from "quagga"; // ES6
const Quagga = require("quagga").default; // Common JS (important: default)

// Load emailNotification
const emailNotification = require("../../helper/email");
const ownerOfBookEmail = emailNotification.ownerOfBookEmail;
const requesterOfBookEmail = emailNotification.requesterOfBookEmail;

// Load frontEndUrl
const frontEndUrl = require("../../config/config.js");

// @route GET api/posts/test
// @desc Tests post route
// @access Public
router.get("/test", (req, res) =>
  res.json({
    msg: "Book works"
  })
);

// @route Get api/books
// @desc Get posts
// @access Public
router.get("/", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  Post.find()
    .sort({
      date: -1
    })
    .then(posts => res.json(posts))
    .catch(err =>
      res.status(404).json({
        noPostFound: "No posts found"
      })
    );
});

// @route Get api/books/search/:query
// @desc Get books by name,isbn,title,author from Google Books API
// @access Public
router.get("/search/:query", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  populateFromGoogleBooks(req.params.query, res);
});

var populateFromGoogleBooks = function (bookTitle, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  bookTitle = replaceAll(bookTitle, " ", "+");
  bookTitle = replaceAll(bookTitle, "%20", "+");

  const getBooks = () => {
    try {
      // console.log("https://www.googleapis.com/books/v1/volumes?q=" + bookTitle);
      return axios.get(
        // "https://www.googleapis.com/books/v1/volumes?q=isbn:9780399594496"
        // "https://www.googleapis.com/books/v1/volumes?q=lala"
        // "https://www.googleapis.com/books/v1/volumes?q=Gregory+Rawlins"
        "https://www.googleapis.com/books/v1/volumes?q=" + bookTitle
      );
    } catch (error) {
      console.error(error);
    }
  };
  const countBooks = async index => {
    const breeds = getBooks(index)
      .then(response => {
        var result = [];

        for (
          var i = 0; response.data.items != undefined && i < response.data.items.length; i++
        ) {
          var obj2 = response.data.items[i];
          if (
            obj2.volumeInfo.industryIdentifiers != undefined &&
            obj2.volumeInfo.industryIdentifiers.length > 0
          ) {
            const newBook = new SharedBook({
              ISBN: obj2.volumeInfo.industryIdentifiers[0].identifier,
              title: obj2.volumeInfo.hasOwnProperty("title") ?
                obj2.volumeInfo.title : "",
              subtitle: obj2.volumeInfo.hasOwnProperty("subtitle") ?
                obj2.volumeInfo.subtitle : "",
              authors: obj2.volumeInfo.hasOwnProperty("authors") ?
                obj2.volumeInfo.authors : [],
              genre: obj2.volumeInfo.hasOwnProperty("categories") ?
                obj2.volumeInfo.categories : [],
              rating: obj2.volumeInfo.hasOwnProperty("averageRating") ?
                obj2.volumeInfo.averageRating :
                -1,
              thumbnailURL: obj2.volumeInfo.hasOwnProperty("imageLinks") ?
                obj2.volumeInfo.imageLinks.thumbnail : "",
              smallThumbnailURL: obj2.volumeInfo.hasOwnProperty("imageLinks") ?
                obj2.volumeInfo.imageLinks.smallThumbnail : "",
              language: obj2.volumeInfo.hasOwnProperty("language") ?
                obj2.volumeInfo.language : "",
              publishedDate: obj2.volumeInfo.hasOwnProperty("publishedDate") ?
                obj2.volumeInfo.publishedDate : "",
              description: obj2.volumeInfo.hasOwnProperty("description") ?
                obj2.volumeInfo.description : "",
              id: obj2.id
            });
            const {
              errors,
              isValid,
              validAndFixedInput
            } = validateBookInput(
              newBook
            );
            // console.log(validAndFixedInput);
            // validAndFixedInput.save();
            result.push(validAndFixedInput);
          }
        }
        res.header("Access-Control-Allow-Origin", "*");
        res.header(
          "Access-Control-Allow-Headers",
          "Origin, X-Requested-With, Content-Type, Accept"
        );
        res.json(result);
      })
      .catch(error => {
        console.log(error);
      });
  };
  countBooks();
};

// @route POST api/posts
// @desc Create/Edit posts
// @access Private

router.post(
  "/share",
  passport.authenticate("jwt", {
    session: false
  }),

  (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    const {
      errors,
      isValid,
      validAndFixedInput
    } = validateBookInput(req.body);
    if (!isValid) {
      //if any errors send 400 with errors object
      return res.status(400).json(errors);
    }

    const newBook = new SharedBook({
      uploadUser: req.user.id,
      ISBN: validAndFixedInput.ISBN,
      title: validAndFixedInput.title,
      subtitle: validAndFixedInput.subtitle,
      authors: validAndFixedInput.authors,
      genre: validAndFixedInput.genre,
      rating: validAndFixedInput.rating,
      thumbnailURL: validAndFixedInput.thumbnailURL,
      smallThumbnailURL: validAndFixedInput.smallThumbnailURL,
      language: validAndFixedInput.language,
      publishedDate: validAndFixedInput.publishedDate,
      description: validAndFixedInput.description,
      // id: validAndFixedInput.id,
      userContent: validAndFixedInput.userContent
    });

    newBook.save().then(post => {
      res.json({
        SubmissionSuccess: ":)"
      });
    });
  }
);

// @route POST api/posts
// @desc Create/Edit posts
// @access Private

router.post(
  "/request",
  passport.authenticate("jwt", {
    session: false
  }),
  (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    const {
      errors,
      isValid,
      validAndFixedInput
    } = validateBookInput(req.body);
    console.log(validAndFixedInput)
    if (!isValid) {
      //if any errors send 400 with errors object
      return res.status(400).json(errors);
    }

    const newBook = new RequestedBook({
      uploadUser: req.user.id,
      requestUser: req.user.id,
      ISBN: validAndFixedInput.ISBN,
      title: validAndFixedInput.title,
      subtitle: validAndFixedInput.subtitle,
      authors: validAndFixedInput.authors,
      genre: validAndFixedInput.genre,
      rating: validAndFixedInput.rating,
      thumbnailURL: validAndFixedInput.thumbnailURL,
      smallThumbnailURL: validAndFixedInput.smallThumbnailURL,
      language: validAndFixedInput.language,
      publishedDate: validAndFixedInput.publishedDate,
      description: validAndFixedInput.description,
      // id: validAndFixedInput.id,
      userContent: validAndFixedInput.userContent
    });

    newBook.save().then(post =>
      res.json({
        SubmissionSuccess: ":)"
      })
    );
  }
);

// Post.findById(req.params.query)
//   .then(post => res.json(post))
//   .catch(err =>
//     res.status(404).json({ noPostFound: "No posts found with that ID" })
//   );

// @route POST api/books/initiateCommunication/
// @desc Post initiate communication
// @access Private
router.post(
  "/initiateCommunication",
  passport.authenticate("jwt", {
    session: false
  }),
  (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    console.log("bookId: " + req.body.bookId);
    const errors = {};
    SharedBook.findOne({
        _id: req.body.bookId
      })
      .then(book => {
        if (!book) {
          errors.noBook = "There is no book.";
          return res.status(404).json(errors);
        }
        Profile.findOne({
            user: book.uploadUser
          })
          .then(profile => {
            if (!profile) {
              errors.noprofile = "Could not find profile for user";
              return res.status(404).json(errors);
            }
            Profile.findOne({
                user: req.user.id
              })
              .then(loggedInUserProfile => {
                if (!loggedInUserProfile) {
                  errors.nologgedinuserprofile =
                    "Could not find profile for user";
                  return res.status(404).json(errors);
                }
                loggedInUserHandle =
                  frontEndUrl + "/profile/" +
                  loggedInUserProfile.handle;
                bookUserHandle =
                  frontEndUrl + "/profile/" + profile.handle;

                emailData = {
                  bookTitle: book.title,
                  thumbnailURL: book.thumbnailURL,
                  bookUser: profile.name,
                  bookUserCity: profile.city,
                  bookUserHandle,
                  loggedInUser: loggedInUserProfile.name,
                  loggedInUserCity: loggedInUserProfile.city,
                  loggedInUserEmail: loggedInUserProfile.email,
                  loggedInUserHandle,
                  userEmail: profile.email,
                  subject: "Book Request - Book Buddies"
                };
                console.log("in initiate");
                const status = ownerOfBookEmail(emailData);
                const status2 = emailNotification.requesterOfBookEmail(
                  emailData
                );
                const errors = {};

                const newBook = new RequestedBook({
                  uploadUser: book.uploadUser,
                  requestUser: req.user.id,
                  ISBN: book.ISBN,
                  title: book.title,
                  subtitle: book.subtitle,
                  authors: book.authors,
                  genre: book.genre,
                  rating: book.rating,
                  thumbnailURL: book.thumbnailURL,
                  smallThumbnailURL: book.smallThumbnailURL,
                  language: book.language,
                  publishedDate: book.publishedDate,
                  description: book.description,
                  originalID: book._id,
                  userContent: book.userContent
                });
                console.log(newBook.originalID);
                newBook.save()

                res.json({
                  success: "Email sent"
                });
              })
              .catch(err => res.status(404).json(err));
          })
          .catch(err => res.status(404).json(err));
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route POST api/posts
// @desc Create/Edit posts
// @access Private

router.post(
  "/",
  // passport.authenticate("jwt", {
  //   session: false
  // }),
  (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    const {
      errors,
      isValid
    } = validatePostInput(req.body);

    if (!isValid) {
      //if any errors send 400 with errors object
      return res.status(400).json(errors);
    }

    const newPost = new Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    });
    newPost.save().then(post => res.json(post));
  }
);

// @route POST api/posts
// @desc Create/Edit posts
// @access Private

router.post(
  "/",
  passport.authenticate("jwt", {
    session: false
  }),
  (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    const {
      errors,
      isValid
    } = validatePostInput(req.body);

    if (!isValid) {
      //if any errors send 400 with errors object
      return res.status(400).json(errors);
    }

    const newPost = new Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    });
    newPost.save().then(post => res.json(post));
  }
);
// @route DELETE api/posts
// @desc Delete posts
// @access Private

router.delete(
  "/:id",
  passport.authenticate("jwt", {
    session: false
  }),
  (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    Profile.findOne({
      user: req.user.id
    }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          //check for post owner
          if (post.user.toString() != req.user.id) {
            return res.status(401).json({
              notAuthorized: "User not authorized."
            });
          }
          //Delete
          post.remove().then(() =>
            res.json({
              success: true
            })
          );
        })
        .catch(err =>
          res.status(404).json({
            postNotFound: "No posts found"
          })
        );
    });
  }
);

// @route POST api/posts/like/:id
// @desc Like post
// @access Private

router.post(
  "/like/:id",
  passport.authenticate("jwt", {
    session: false
  }),
  (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    Profile.findOne({
      user: req.user.id
    }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
            .length > 0
          ) {
            return res.status(400).json({
              alreadyLiked: "user already liked this post"
            });
          }

          //Add user id to the likes array
          post.likes.unshift({
            user: req.user.id
          });
          post.save().then(post => res.json(post));
        })
        .catch(err =>
          res.status(404).json({
            postNotFound: "No posts found"
          })
        );
    });
  }
);

// @route POST api/posts/unlike/:id
// @desc unlike post
// @access Private

router.post(
  "/unlike/:id",
  passport.authenticate("jwt", {
    session: false
  }),
  (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    Profile.findOne({
      user: req.user.id
    }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
            .length == 0
          ) {
            return res.status(400).json({
              alreadyLiked: "You have not yet liked this post"
            });
          }
          //Get remove index
          const removeIndex = post.likes
            .map(item => item.user.toString())
            .indexOf(req.user.id);

          //Splice it from the array
          post.likes.splice(removeIndex, 1);

          //Save
          post.save().then(post => res.json(post));
        })
        .catch(err =>
          res.status(404).json({
            postNotFound: "No posts found"
          })
        );
    });
  }
);

// @route POST api/comment/:id
// @desc Add comments
// @access Private

router.post(
  "/comment/:id",
  passport.authenticate("jwt", {
    session: false
  }),
  (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    Profile.findOne({
      user: req.user.id
    }).then(profile => {
      const {
        errors,
        isValid
      } = validatePostInput(req.body);

      if (!isValid) {
        //if any errors send 400 with errors object
        return res.status(400).json(errors);
      }

      Post.findById(req.params.id)
        .then(post => {
          const newComment = {
            text: req.body.text,
            name: req.body.name,
            avatar: req.body.avatar,
            user: req.user.id
          };
          //Add to comments array
          post.comments.unshift(newComment);

          //Save
          post.save().then(post => res.json(post));
        })
        .catch(err =>
          res.status(404).json({
            postNotFound: "No post found"
          })
        );
    });
  }
);

// @route GET api/books/fetchAllSharedFilters
// @desc Get all shared books
// @access Public
router.get("/booksquery", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  var page = parseInt(req.query.page) || 0; //for next page pass 1 here
  var limit = parseInt(req.query.limit) || 3;
  var query = {};
  SharedBook.find(query)
    .sort({
      update_at: -1
    })
    .skip(page * limit) //Notice here
    .limit(limit)
    .exec((err, doc) => {
      if (err) {
        return res.json(err);
      }
      Book.count(query).exec((count_error, count) => {
        if (err) {
          return res.json(count_error);
        }
        return res.json({
          total: count,
          page: page,
          pageSize: doc.length,
          books: doc
        });
      });
    });
});

router.get("/fetchAllShared", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  const errors = {};
  const filters = {};
  var Value_match = new RegExp("Anita", "i");

  SharedBook.aggregate(
    [
      // { $match: { title: Value_match } },
      {
        $unwind: "$authors"
      },
      {
        $match: {
          $or: [{
              title: Value_match
            }
            // { authors: Value_match }
            // { genre: Value_match },
            // { rating: Value_match },
            // { location: Value_match }
          ]
        }
      },

      // { $project: { authors: 1, _id: 0 } },

      {
        $unwind: "$genre"
      },
      {
        $group: {
          _id: null,
          title: {
            $addToSet: "$title"
          },
          language: {
            $addToSet: "$language"
          },
          authors: {
            $addToSet: "$authors"
          },
          genre: {
            $addToSet: "$genre"
          },
          rating: {
            $addToSet: "$rating"
          },
          location: {
            $addToSet: "$location"
          }
        }
      }
    ],
    function (err, result) {
      if (err) {
        console.log(err);
      } else {
        // console.log(result);
        res.json(result);
      }
    }
  );

  // SharedBook.aggregate(
  //   [
  //     {
  //       $project: {
  //         title: 1,
  //         language: 1,
  //         authors: 1,
  //         genre: 1,
  //         rating: 1,
  //         location: 1
  //       }
  //     },
  //     { $match: { title: { $regex: Value_match } } }
  //     // ,
  // {
  //   $unwind: "$authors"
  // },
  // {
  //   $unwind: "$genre"
  // },
  // {
  //   $group: {
  //     _id: null,
  //     language: { $addToSet: "$language" },
  //     authors: { $addToSet: "$authors" },
  //     genre: { $addToSet: "$genre" },
  //     rating: { $addToSet: "$rating" },
  //     location: { $addToSet: "$location" }
  //   }
  // }
  //   ],
  //   function(err, result) {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       console.log(result);
  //       res.json(result);
  //     }
  //   }
  // );
});

// isd.aggregate(
//   [
//     {
//       $group: {
//         _id: "$region", //$region is the column name in collection
//         count: { $sum: 1 }
//       }
//     }
//   ],
//   function(err, result) {
//     if (err) {
//       next(err);
//     } else {
//       res.json(result);
//     }
//   }
// );

// SharedBook.collection
//   .distinct("authors", function(error, results) {
//     // console.log("Results" + results);
//     filters["authors"] = results;
//     // console.log("filters" + filters["authors"]);
//   })
//   .then(function(){
//     SharedBook.collection.distinct("language", function(error, results) {
//       // console.log(results);
//       filters["language"] = results;
//       // console.log(filters["language"]);
//     })

//   .then(
//     SharedBook.collection.distinct("rating", function(error, results) {
//       // console.log(results);
//       filters["rating"] = results;
//     })
//   )
//   .then(
//     SharedBook.collection.distinct("location", function(error, results) {
//       console.log(results);
//       filters["location"] = results;
//       console.log(filters);
//       res.json(filters);
//     })
//   );

// Profile.find()
//   .populate("user", ["name", "avatar"])
//   .then(profiles => {
//     if (!profiles) {
//       errors.noProfiles = "There are no profiles";
//       return res.status(404).json(errors);
//     }
//     res.json(profiles);
//   })
//   .catch(err => res.status(404).json({ profile: "There are no profiles." }));

//   // "http://www.barcode1.in/wp-content/uploads/ISSN.jpg",
//   "https://internationalbarcodes.net/wp-content/uploads/2017/04/ISBN%20barcode%20style%201%20example.jpg",
// // "https://www.edlin.org/images/holt/books/odds-and-gods-backside-tom-holt-cover-big.jpg",

router.post("/imageSearch", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  req.body = req.body.data;
  // const client = new vision.ImageAnnotatorClient();
  var imageURL = req.body.imageURL;
  console.log(imageURL);
  // Creates a client
  const client = new vision.ImageAnnotatorClient();

  const url = imageURL;
  // "https://images-na.ssl-images-amazon.com/images/I/61ZG-hATOeL._SX430_BO1,204,203,200_.jpg";
  // "https://i.imgur.com/QRxXKUu.jpg";
  // ("https://i.imgur.com/ieFACLy.jpg");
  // "https://i.imgur.com/2RAfh6R.jpg";
  client
    .webDetection(url)
    // .webDetection(`gs://${bucketName}/${fileName}`)
    .then(results => {
      const webDetection = results[0].webDetection;

      if (webDetection.bestGuessLabels.length) {
        // console.log(`Best guess labels found: ${webDetection.bestGuessLabels}`);
        const finalResult = [];
        webDetection.bestGuessLabels.forEach(label => {
          // const labelVal;
          const bookTitle = label.label;
          // const reqUrl = "http://localhost:5000/api/books/search/" + val;
          // console.log("Calling: " + bookTitle);
          populateFromGoogleBooks(bookTitle, res);
          // request(reqUrl, (error, response, body) => {
          //   if (error) {
          //     // If there is an error, tell the user
          //     res.send("An erorr occured" + error);
          //   }
          //   // Otherwise do something with the API data and send a response
          //   else {
          //     // res.send(body)
          //     finalResult.push(body);
          //     console.log("bb: " + body);
          //     res.json(finalResult);
          //   }
          // });
          // router.get("/search/:query", (req, res) => {
        });
        // console.log("finalResult: " + finalResult);
        // console.log("finalResult: " + finalResult);
      }
    })
    .catch(err => {
      console.error("ERROR:", err);
    });
});

function replaceAll(str, find, replace) {
  str = str.toString();
  return str.replace(new RegExp(find, "g"), replace);
}

// @route POST api/books/report
// @desc Report posts
// @access Private

router.post(
  "/report/:bookId",
  passport.authenticate("jwt", {
    session: false
  }),

  (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    const errors = {};
    SharedBook.findOne({
      _id: req.params.bookId
    }).then(book => {
      if (!book) {
        errors.noBook = "There is no book.";
        return res.status(404).json(errors);
      }
      console.log(book._id);
      // const reportedBook = book;
      // const newBook = new ReportedBook(book);
      SharedBook.findOne({
        _id: req.params.bookId
      }).then(book => {
        if (!book) {
          errors.noBook = "There is no book in the shared books DB.";
          return res.status(404).json(errors);
        }
        ReportedBook.findOne({
          originalID: req.params.bookId
        }).then(reportedBook => {
          if (reportedBook) {
            errors.noBook = "Book already reported.";
            return res.status(404).json(errors);
          }
          const newBook = new ReportedBook({
            uploadUser: book.uploadUser,
            ISBN: book.ISBN,
            title: book.title,
            subtitle: book.subtitle,
            authors: book.authors,
            genre: book.genre,
            rating: book.rating,
            thumbnailURL: book.thumbnailURL,
            smallThumbnailURL: book.smallThumbnailURL,
            language: book.language,
            publishedDate: book.publishedDate,
            description: book.description,
            originalID: book._id,
            userContent: book.userContent
          });
          console.log(newBook.originalID);
          newBook.save().then(post => {
            res.json({
              post
            });
          });
          res.header("Access-Control-Allow-Origin", "*");
          res.header(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept"
          );
        });
      });
    });
  }
);

module.exports = router;
module.exports.populateFromGoogleBooks = populateFromGoogleBooks;