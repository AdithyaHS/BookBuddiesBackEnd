const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");
const axios = require("axios");
const request = require("request");

//Book Model
const models = require("../../model/Book");
const RequestedBook = models.RequestedBook;
const SharedBook = models.SharedBook;
const ReportedBook = models.ReportedBook;
const Profile = require("../../model/Profile");

//Validation
const validatePostInput = require("../../validation/post");
const validateBookInput = require("../../validation/book");

// @route GET api/admin/test
// @desc Tests post route
// @access Public
router.get("/test", (req, res) =>
  res.json({
    msg: "Admin works"
  })
);

// @route POST api/admin/getReportedBooks/
// @desc Tests post route
// @access Public
router.post(
  "/getReportedBooks",
  passport.authenticate("jwt", {
    session: false
  }),
  (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    //   console.log("req.body = ");
    req.body = req.body.data;
    const errors = {};
    var page = req.body == undefined ? 0 : parseInt(req.body.page); //for next page pass 1 here
    var limit = req.body == undefined ? 0 : parseInt(req.body.limit); //for next page pass 1 here

    ReportedBook.find()
      .skip(page * limit) //Notice here
      .limit(limit)
      .exec((err, doc) => {
        if (err) {
          return res.json(err);
        }
        ReportedBook.count().exec((count_error, count) => {
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
  }
);

// @route DELETE api/admin/discardReportedBooks/:bookId
// @desc Discard Reported books (only remove from ReportedBooks DB as it was false alarm)
// @access Public

router.delete(
  "/discardReportedBooks/:bookId",
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
    ReportedBook.findOne({
        _id: req.params.bookId
      })
      .then(book => {
        //check for post owner
        // if (post.user.toString() != req.user.id) {
        //   return res.status(401).json({
        //     notAuthorized: "User not authorized."
        //   });
        // }
        // console.log(book._id);
        // console.log(book.originalID);
        book.remove().then(() => {
          req.body = req.body.data;
          const errors = {};
          var page = req.body == undefined ? 0 : parseInt(req.body.page); //for next page pass 1 here
          var limit = req.body == undefined ? 0 : parseInt(req.body.limit); //for next page pass 1 here

          ReportedBook.find()
            .skip(page * limit) //Notice here
            .limit(limit)
            .exec((err, doc) => {
              if (err) {
                return res.json(err);
              }
              ReportedBook.count().exec((count_error, count) => {
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
      })
      .catch(err =>
        res.status(404).json({
          bookNotFound: "No books found"
        })
      );
  }
);

// @route DELETE api/admin/deleteReportedBooks/:bookId
// @desc Delete Reported books from Reported and SharedDB
// @access Public

router.delete(
  "/deleteReportedBooks/:bookId",
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
    ReportedBook.findOne({
        _id: req.params.bookId
      })
      .then(book => {
        SharedBook.findOne({
            _id: book.originalID
          })
          .then(sharedbook => {
            if (sharedbook) {
              console.log(sharedbook);
              sharedbook
                .remove()
                .then(() => {
                  book
                    .remove()
                    .then(() => {
                      req.body = req.body.data;
                      const errors = {};
                      var page =
                        req.body == undefined ? 0 : parseInt(req.body.page); //for next page pass 1 here
                      var limit =
                        req.body == undefined ? 0 : parseInt(req.body.limit); //for next page pass 1 here

                      ReportedBook.find()
                        .skip(page * limit) //Notice here
                        .limit(limit)
                        .exec((err, doc) => {
                          if (err) {
                            return res.json(err);
                          }
                          ReportedBook.count().exec((count_error, count) => {
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
                    })
                    .catch(err => {
                      res.status(404).json({
                        bookNotFound: "Book Not found in ReportedBooks"
                      });
                    });
                })
                .catch(err => {
                  res.status(404).json({
                    bookNotFound: "Book not found in SharedBooks"
                  });
                });
            }
          })
          .catch(err =>
            res.status(404).json({
              bookNotFound: "Book Not found in SharedBooks"
            })
          );
      })
      .catch(err =>
        res.status(404).json({
          bookNotFound: "No such books found in ReportedBooks"
        })
      );
  }
);

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
      return axios.get(
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

    if (!isValid) {
      //if any errors send 400 with errors object
      return res.status(400).json(errors);
    }

    const newBook = new RequestedBook({
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

    newBook.save().then(post =>
      res.json({
        SubmissionSuccess: ":)"
      })
    );
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
    [{
        $unwind: "$authors"
      },
      {
        $match: {
          $or: [{
            title: Value_match
          }]
        }
      },
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
});

function replaceAll(str, find, replace) {
  str = str.toString();
  return str.replace(new RegExp(find, "g"), replace);
}

module.exports = router;
module.exports.populateFromGoogleBooks = populateFromGoogleBooks;