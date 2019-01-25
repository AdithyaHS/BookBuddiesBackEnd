const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

//Load validation
const validateProfileInput = require("../../validation/profile");

const models = require("../../model/Book");
const Books = require("../../model/Book");
//load Profile model
const Profile = require("../../model/Profile");
// Load SharedBooks model
const SharedBook = models.SharedBook;
// Load RequestedBooks model
const RequestedBook = models.RequestedBook;

// Load email notification
const emailNotification = require('../../helper/email');

//Load get books
const bookHelper = require('../../helper/getBooksHelper');

// @route GET api/profile/test
// @desc Tests profile route
// @access Public
router.get("/test", (req, res) => res.json({
  msg: "Profile works"

}));

// @route GET api/profile
// @desc Get Current user's profile
// @access Private

router.get(
  "/",
  passport.authenticate("jwt", {
    session: false
  }),
  (req, res) => {
    console.log(req);
    const errors = {};
    Profile.findOne({
        user: req.user.id
      })
      .populate("user", ["name", "avatar"])
      .then(profile => {
        if (!profile) {
          errors.noProfile = "There is no profile for this user.";
          return res.status(404).json(errors);
        }
        res.json(profile);
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route GET api/profile/all
// @desc Get all profiles
// @access Public

router.get("/all", (req, res) => {
  const errors = {};
  Profile.find()
    .populate("user", ["name", "avatar"])
    .then(profiles => {
      if (!profiles) {
        errors.noProfiles = "There are no profiles";
        return res.status(404).json(errors);
      }
      res.json(profiles);
    })
    .catch(err => res.status(404).json({
      profile: "There are no profiles."
    }));
});

// @route GET api/profile/handle/ :handle
// @desc Get the profile by handle
// @access Public
// Backend api hit not used by the user

router.get("/handle/:handle", (req, res) => {
  const errors = {};
  Profile.findOne({
      handle: req.params.handle
    })
    .populate("user", ["name", "avatar"])
    .then(profile => {
      if (!profile) {
        errors.noProfile = "There is no profile for this handle.";
        return res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err => res.status(404).json(err));
});

// @route GET api/profile/user/:user_id
// @desc Get the profile by user id
// @access Public

router.get("/user/:user_id", (req, res) => {
  const errors = {};
  Profile.findOne({
      user: req.params.user_id
    })
    .populate("user", ["name", "avatar"])
    .then(profile => {
      if (!profile) {
        errors.noProfile = "There is no such user profile.";
        return res.status(404).json(errors);
      }

      res.json(profile);
    }) //Handle seperately as mongoose cast error if try catch on its own
    .catch(err =>
      res.status(404).json({
        profile: "There is no such user profile."
      })
    );
});

// @route POST api/profile
// @desc Create or edit user profile
// @access Private

router.post(
  "/",
  passport.authenticate("jwt", {
    session: false
  }),
  (req, res) => {
    const {
      errors,
      isValid
    } = validateProfileInput(req.body);

    //Check validation
    if (!isValid) {
      //Return any error with 400 status
      return res.status(400).json(errors);
    }

    //Get fields
    const profileFields = {};
    profileFields.user = req.user.id;

    if (req.body.handle) profileFields.handle = req.body.handle;
    if (req.body.name) profileFields.name = req.body.name;
    if (req.body.address) profileFields.address = req.body.address;
    if (req.body.city) profileFields.city = req.body.city;
    if (req.body.state) profileFields.state = req.body.state;
    if (req.body.bio) profileFields.bio = req.body.bio;
    if (req.body.email) profileFields.email = req.body.email;
    if (req.body.bookInterest)
      profileFields.bookInterest = req.body.bookInterest;

    //Initialize social
    profileFields.social = {};

    if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
    if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
    if (req.body.instagram) profileFields.social.instagram = req.body.instagram;
    if (req.body.goodreads) profileFields.social.goodreads = req.body.goodreads;

    Profile.findOne({
      user: req.user.id
    }).then(profile => {
      if (profile) {
        //Update
        Profile.findOneAndUpdate({
          user: req.user.id
        }, {
          $set: profileFields
        }, {
          new: true
        }).then(profile => res.json(profile));
      } else {
        //Create

        //Check if handle exists or not
        Profile.findOne({
          handle: profileFields.handle
        }).then(profile => {
          if (profile) {
            errors.handle = "This handle already exists";
            res.status(400).json(errors);
          }

          // Save profile
          new Profile(profileFields).save().then(profile => res.json(profile));
        });
      }
    });
  }
);

// @route GET api/profile/:userHandle/sharedBooks
// @desc Get Current user's shared books
// @access Private

router.get(
  "/:userHandle/sharedBooks",
  (req, res) => {
    var data = {
      profile: Profile,
      bookdb: SharedBook,
      userHandle: req.params.userHandle
    };
    bookHelper.getSharedBooks(data, res);
  }
);

// @route GET api/profile/:userHandle/requestedBooks
// @desc Get Current user's requested books
// @access Private

router.get(
  "/:userHandle/requestedBooks",
  (req, res) => {
    var data = {
      profile: Profile,
      bookdb: RequestedBook,
      userHandle: req.params.userHandle,
    };
    bookHelper.getRequestedBooks(data, res);
  });


// @route DELETE api/profile/:userHandle/sharedBooks/:sharedBookid
// @desc Delete shared book
// @access Private

router.delete(
  "/:userHandle/sharedBooks/:sharedBookid",
  passport.authenticate("jwt", {
    session: false
  }),
  (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    console.log(req.user)

    SharedBook.findOne({
        _id: req.params.sharedBookid
      }).then(book => {
        console.log("Book upload user = " + req.params.userHandle)
        console.log("Auth user = " + req.user.handle)
        if (book.uploadUser.toString() === req.user.id || req.user.email === "admin@bookbuddies.com") {
          //Delete
          var data = {
            profile: Profile,
            bookdb: SharedBook,
            userHandle: req.params.userHandle
          };
          book.remove().then(() =>
            bookHelper.getSharedBooks(data, res)
          );

        } else {
          return res
            .status(401)
            .json({
              notAuthorized: "User not authorized."
            });
        }

      })
      .catch(err => res.status(404).json({
        bookNotFound: "No book found"
      }));
  });

// @route DELETE api/profile/:userHandle/requestedBook/:requestedBookid
// @desc Delete shared book
// @access Private

router.delete(
  "/:userHandle/requestedBooks/:requestedBookid",
  passport.authenticate("jwt", {
    session: false
  }),
  (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    console.log(req.params.requestedBookid)
    RequestedBook.findOne({
        _id: req.params.requestedBookid
      }).then(book => {
        if (book.requestUser.toString() != req.user.id && req.user.email != "admin@bookbuddies.com") {

          return res
            .status(401)
            .json({
              notAuthorized: "User not authorized."
            });
        }
        //Delete
        var data = {
          profile: Profile,
          bookdb: RequestedBook,
          userHandle: req.params.userHandle
        };
        book.remove().then(() => {
          bookHelper.getRequestedBooks(data, res)
        });
      })
      .catch(err => res.status(404).json({
        bookNotFound: err
      }));

  });


// // @route DELETE api/profile/experience/:exp_id
// // @desc Delete Experience from profile
// // @access Private
// router.delete(
//   "/experience/:exp_id",
//   passport.authenticate("jwt", {
//     session: false
//   }),
//   (req, res) => {
//     Profile.findOne({
//         user: req.user.id
//       })
//       .then(profile => {
//         //Get remove index
//         const removeIndex = profile.experience
//           .map(item => item.id)
//           .indexOf(req.params.exp_id);

//         if (removeIndex === -1) {
//           const errors = {};
//           errors.noExperience = "Delete failed as experience not found.";
//           return res.status(404).json(errors);
//         }

//         //Splice out of the array
//         profile.experience.splice(removeIndex, 1);

//         //Save
//         profile.save().then(profile => res.json(profile));
//       })
//       .catch(err => res.status(404).json(err));
//   }
// );

// @route DELETE api/profile/education/:edu_id
// @desc Delete Education from profile
// @access Private
router.delete(
  "/education/:edu_id",
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
      })
      .then(profile => {
        //Get remove index
        const removeIndex = profile.education
          .map(item => item.id)
          .indexOf(req.params.edu_id);

        if (removeIndex === -1) {
          const errors = {};
          errors.noEducation = "Delete failed as education not found.";
          return res.status(404).json(errors);
        }

        //Splice out of the array
        profile.education.splice(removeIndex, 1);

        //Save
        profile.save().then(profile => res.json(profile));
      })
      .catch(err => res.status(404).json(err));
  }
);

// @route DELETE api/profile/
// @desc Delete user and profile
// @access Private
router.delete(
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
    Profile.findOneAndRemove({
        user: req.user.id
      })
      .then(profile => {
        User.findOneAndRemove({
          _id: req.user.id
        }).then(() =>
          res.json({
            success: true
          })
        );
      })
      .catch(err => res.status(404).json(err));
  }
);

module.exports = router;