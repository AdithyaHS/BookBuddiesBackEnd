const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const router = express.Router();

// const gmailSend = require('gmail-send');

var ownerOfBookEmail = function (data) {

    console.log("Inside email");
    const content = `<img src="${data.thumbnailURL}">
    <h2>${data.bookTitle}</h2>
    <p>Hi ${data.bookUser},<br><br>
        ${data.loggedInUser} is interested in your book and would like to initiate contact with you. <br><br> Please find the details below:<br>
        <ul>
            <li>Name: ${data.loggedInUser}</li>
            <li>Profile URL: ${data.loggedInUserHandle}</li>
            <li>City: ${data.loggedInUserCity}</li>
            <li>Email: ${data.loggedInUserEmail}</li>        
        </ul>

        Regards,<br>
        BookBuddies.
    </p>
    `;

    // create reusable transporter object using the
    // default SMTP transport
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: "testbookbuddies@gmail.com", // generated ethereal user
            pass: "Q!w2e3r4" // generated ethereal password
        },
        tls: {
            rejectUnauthorized: false
        }
    });


    // setup email data with unicode symbols
    let mailOptions = {
        from: '"Book Buddies" <testbookbuddies@gmail.com>', // sender address
        to: data.userEmail, // list of receivers
        subject: data.subject, // Subject line
        text: 'Hello world?', // plain text body
        html: content // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

        return {
            status: "Email sent"
        };
    });
};


var requesterOfBookEmail = function (data) {
    const content = `<img src="${data.thumbnailURL}">
    <h2>${data.bookTitle}</h2>
    <p>Hi ${data.loggedInUser},<br><br>
        Please find the book owner details below:<br>
        <ul>
            <li>Name: ${data.bookUser}</li>
            <li>City: ${data.bookUserCity}</li>
            <li>Profile URL: ${data.bookUserHandle}</li>
            <li>Email: ${data.userEmail}</li>        
        </ul>

        Regards,<br>
        BookBuddies.
    </p>
    `;

    // create reusable transporter object using the
    // default SMTP transport
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: "testbookbuddies@gmail.com", // generated ethereal user
            pass: "Q!w2e3r4" // generated ethereal password
        },
        tls: {
            rejectUnauthorized: false
        }
    });


    // setup email data with unicode symbols
    let mailOptions = {
        from: '"Book Buddies" <testbookbuddies@gmail.com>', // sender address
        to: data.loggedInUserEmail, // list of receivers
        subject: data.subject, // Subject line
        text: 'Hello world?', // plain text body
        html: content // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

        return {
            status: "Email sent"
        };
    });
};


module.exports.ownerOfBookEmail = ownerOfBookEmail;
module.exports.requesterOfBookEmail = requesterOfBookEmail;