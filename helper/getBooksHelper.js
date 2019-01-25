const express = require('express');
const router = express.Router();

// const gmailSend = require('gmail-send');

var getSharedBooks = function (data, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );

    // console.log(data)
    errors = {};
    data.profile.find({
            handle: data.userHandle
        })
        .then(userProfile => {
            // console.log(profile);

            if (!userProfile) {
                "User doesn't have a profile yet";
                return res.status(404).json(errors);
            }
            console.log(userProfile[0].user)
            data.bookdb.find({
                    uploadUser: userProfile[0].user
                })
                .then(books => {
                    if (!books) {
                        errors.noBooks = "No books found";
                        return res.status(404).json(errors);
                    }

                    console.log(books);
                    res.json(books);
                })
                .catch(err => res.status(404).json(
                    err
                ));
        })
        .catch(err =>
            res.status(404).json(
                err
            ));
};

var getRequestedBooks = function (data, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );

    // console.log(data)
    errors = {};
    var userProfile;
    data.profile.find({
            handle: data.userHandle
        })
        .then(userProfile => {
            // console.log(profile);

            if (!userProfile) {
                "User doesn't have a profile yet";
                return res.status(404).json(errors);
            }
            console.log(userProfile[0].user)
            data.bookdb.find({
                    requestUser: userProfile[0].user
                })
                .then(books => {
                    if (!books) {
                        errors.noBooks = "No books found";
                        return res.status(404).json(errors);
                    }

                    res.json(books);
                })
                .catch(err => res.status(404).json(
                    err
                ));
        })
        .catch(err =>
            res.status(404).json(
                err
            ));
};

module.exports.getSharedBooks = getSharedBooks;
module.exports.getRequestedBooks = getRequestedBooks;