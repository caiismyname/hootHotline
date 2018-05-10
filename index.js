// Express is used to generate the website
const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const request = require('request');
// const firebase = require('firebase/app');
// require('firebase/database');
const env = require('dotenv').config();
var firebase; // Global reference to Firebase DB. Set in initFirebase().

function initFirebase() {
    // Verifying admin credentials for authenticated access to Firebase
    firebase = require("firebase-admin");
    let serviceAccount = {
        "type": process.env.FIREBASE_ADMIN_TYPE,
        "private_key": process.env.FIREBASE_ADMIN_PRIVATE_KEY,
        "client_email": process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        "token_uri": process.env.FIREBASE_ADMIN_TOKEN_URI,
    }

    firebase.initializeApp({
        credential: firebase.credential.cert(serviceAccount),
        databaseURL: "https://hoothotline.firebaseio.com"
    });
}

function test() {
    var ref = firebase.database().ref("david");
    ref.set("bar");
}

initFirebase();
test();