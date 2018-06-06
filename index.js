//
//
// Initialization
//
//

const bodyParser = require('body-parser');
const request = require('request');
const env = require('dotenv').config();
// Express is used to generate the website
const express = require('express');
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

var firebase; // Global reference to Firebase DB. Set in initFirebase().

/**
 * Dictionary containing ID to food mappings.
 * Foods are correctly capitalized/spaced.
 * This functions as an enum of the available foods.
 */
const FOODS = {
    1: "Pizza",
    2: "Sandwiches"
}

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

/**
 * Starts a reference listening to the inventory DB.
 * Renders the homepage (with inventory information) when first called.
 * Refreshes the homepage when updates to the DB occur.
 */

function watchInventory(res) {
    const ref = firebase.database().ref("inventory");
    ref.on('value', function(snapshot) {
        console.log("Food inventory update");
        let foodStatuses = snapshot.val();
        var inStock = [];
        var outStock = [];

        for (let idx in foodStatuses) {
            console.log("\t", FOODS[idx], ": ", foodStatuses[idx]);
            // Put food in appropriate list according to stock status.
            if (foodStatuses[idx]) {
                inStock.push(FOODS[idx]);
            } else {
                outStock.push(FOODS[idx]);
            }
        }
        res.render('homepage', {inStock: inStock, outStock: outStock});
        
    });
}

//
//
// Setting Express endpoints for the pages
//
//


app.get('/', function (req, res) {
    watchInventory(res);
});

function InsertIntoFBTest() {
    var ref = firebase.database().ref("david");
    ref.set("bar");
}

initFirebase();

app.listen(3000, function () {
	console.log('Listening on port 3000!');
})