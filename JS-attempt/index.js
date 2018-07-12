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
var multer  = require('multer');

var firebase; // Global reference to Firebase DB. Set in initFirebase().

/**
 * Dictionary containing ID to food mappings.
 * Foods are correctly capitalized/spaced.
 * This functions as an enum of the available foods.
 */

const FOODS = [
    "Cheese Pizza",
    "Pepperoni Pizza",
    "Pineapple Pizza",
    "Chicken Pizza",
    "Sausage Pizza",
    "Mushroom Pizza",
    "HBCB",
    "Tofu Banh Mi",
    "Pork Banh Mi",
    "Chicken Banh Mi",
    "Beef Banh Mi",
    "Tofu Spring Rolls",
    "CFA Nuggets",
    "CFA Regular Sandwich",
    "CFA Spicy Sandwich",
    "Cane's Fingers",
]
// const FOODS = {
//     1: "Cheese Pizza",
//     2: "Pepperoni Pizza",
//     3: "Pineapple Pizza",
//     4: "Cheese Pizza",
//     5: "Sausage Pizza",
//     6: "Mushroom Pizza",
//     7: "HBCB",
//     8: "Tofu Banh Mi",
//     9: "Pork Banh Mi",
//     10: "Chicken Banh Mi",
//     11: "Beef Banh Mi",
//     12: "Tofu Spring Rolls",
//     13: "CFA Nuggets",
//     14: "CFA Regular Sandwich",
//     15: "CFA Spicy Sandwich",
//     16: "Cane's Fingers",
// }

/**
 * Enumerating the different sub-categories of the DB.
 * Values evaluate to valid Firebase ref URLs.
 */
const CATEGORY = {
    INVENTORY: "/inventory/",
    HOURS: "/hours/",
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
 * Update an entry in firebase.
 * Example: InsertIntoFB(CATEGORY.HOURS, "isOpen", true);
 */
function insertIntoFB(category, key, value) {
    const url = category + key;
    var ref = firebase.database().ref(url);
    ref.set(value);
}

/**
 * Toggles boolean db entires. 
 */
function toggleFBValue(category, key) {
    const url = category + key;
    const ref = firebase.database().ref(url);
    
    ref.once('value', function(snapshot) {
        const value  = snapshot.val();
        // Safety check in case trying to toggle non-boolean.
        if (typeof(value) === "boolean") {
            insertIntoFB(category, key, !value);
        } else {
            console.log(`Tried to toggle non-boolean entry: ${url}`);
        }
    });
}

/**
 * Hits firebase for inventory.
 * Renders the homepage (with inventory information) when first called.
 */
function watchInventory(res) {
    const ref = firebase.database().ref("inventory");
    ref.on('value', function(snapshot) {
        console.log("Food inventory update");
        let foodStatuses = snapshot.val();
        var inStock = [];
        var outStock = [];

        // Iterate through local FOODS list to keep grouping of foods by type.
        for (let food of FOODS) {
            // Put food in appropriate list according to stock status.
            if (foodStatuses[food]) {
                inStock.push(food);
            } else {
                outStock.push(food);
            }
        }
        res.render('homepage', {inStock: inStock, outStock: outStock});
    });
}

function renderUpdateForm(res) {
    const ref = firebase.database().ref("inventory");
    ref.on('value', function(snapshot) {
        let values = snapshot.val();
        // Remake the inventory mapping in-order by iterating through the FOODS list.
        // Technically, JS objects are not ordered but in practice, everything 
        // seems to be consistent.
        let inventory = {};
        for (let food of FOODS) {
            inventory[food] = values[food];
        }
        res.render("updateform", {inventory: inventory});
    });
}

function updateInventory(outStockItems) {
    console.log("Updating Inventory");
    // Create dictionary of foods, where value = "is in stock?"
    let allFoods = {};
    for (let food of FOODS) { allFoods[food] = true };
    // Mark given foods as outStock
    for (let item of outStockItems) {
        insertIntoFB(CATEGORY.INVENTORY, item, false);
        allFoods[item] = false;
    }
    // Mark remaining foods as inStock
    for (let item of FOODS) {
        if (allFoods[item]) { insertIntoFB(CATEGORY.INVENTORY, item, true) };
    }
}

//
//
// Setting Express endpoints for the pages
//
//

// Homepage
app.get("/", function(req, res) {
    watchInventory(res);
});

// Update form
app.get("/updateform", function(req, res) {
    renderUpdateForm(res);
});

// Update form submit
// app.use(bodyParser.json());
app.post("/submitupdate", function(req, res){ 
    console.log("hello");
    console.log(req.body.items);
    // The form sends back all the items NOT in stock.
    updateInventory(req.body.items);
    foo = {};
    for (let food of FOODS) {
        foo[food] = true;
    }
    // res.send(foo);
    // res.status(200).send({"success" : "Updated Successfully", "status" : 200});
    res.redirect('back');
});

initFirebase();

app.listen(3000, function () {
	console.log('Listening on port 3000!');
});