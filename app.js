const http = require('http');
const path = require('path');
const helmet = require('helmet'); // for security consideration
const paypal = require('paypal-rest-sdk');
const mysql = require('mysql');
const express = require('express');
let app = express();
const port = process.env.PORT || 8080;

app.use(helmet());
app.set('views', path.join(__dirname, "views"));
app.set('view engine', 'ejs');
app.use(express.static('public')); //Express serves images, CSS files, and JavaScript files in a directory named public
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//setting PayPal information
paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AYscelyFVeqO7lxrqpBaVv-7y9nZPWyN98a-wv-8bUObZAlipfk7QCwmV54JsJDxo26Bxsh4FirUzTof',
    'client_secret': 'EL9UFVbvXyKFowaUPrO7ZPVYbBXk7NBC3XFZvsgZIXQ_B5taISxH4bj2KLDd5Loy5f6xsSmQyqHD7KAx'
});

// Root GET URL takes the configuration file and render the index.ejs file
app.get('/', function (req, res) {
    let newJSON = parseJson();
    const queryCommand = "CALL GET_SPACES_FOR_DATE" +
        "('" + dateInput  + "');";
    queryDB((row) => {
        let newJSON = parseJson();
        newJSON.customerInfo = row;
        queryDB((row) => {
            newJSON.comingEvent = row;
            res.render('dashboard', newJSON);
        }, "SELECT EVENT_DT, EVENT_TYPE FROM TBL_EVENT WHERE EVENT_DT > NOW();");
    }, queryCommand);
    res.render('index', parseJson());
});

app.post("/", function (req, res) {
    console.log("request body: " + JSON.stringify(req.body));
    firstName = req.body.firstName;
    lastName = req.body.lastName;
    phoneNumber = req.body.phone;
    emailAddress = req.body.email;
    spaceID = req.body.spot;
    eventDate = req.body.eventDate;
    itemIntentToSell = req.body.selling;
    registrationDate = getCurrentDate();

    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    let create_payment_json;
    create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": fullUrl + "success",
            "cancel_url": fullUrl + "cancel"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "weekly market",  //Here goes the event name
                    "sku": "event id", //Here goes the event ID
                    "price": "10.00", //Here goes the price
                    "currency": "USD", //Usually not to be changed
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": "10.00"
            },
            "description": "This is the payment description."
        }]
    };


    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            for (let i = 0; i < payment.links.length; i++) {
                if (payment.links[i].rel === "approval_url") {
                    res.redirect(payment.links[i].href);
                }
            }
        }
    });

});

let firstName;
let lastName;
let phoneNumber;
let emailAddress;
let itemIntentToSell;
let eventDate;
let registrationDate;
let amount;
let confirmationNumber;
let paymentMethod;
let spaceID;

function queryToDatabase(req,res) {
    let queryCommand = "CALL ADD_TO_EVENT('";
    queryCommand += firstName + "', '";
    queryCommand += lastName + "', '";
    queryCommand += phoneNumber + "', '";
    queryCommand += emailAddress + "', '";
    queryCommand += itemIntentToSell + "', '";
    queryCommand += eventDate + "', '";
    queryCommand += registrationDate + "', '";
    queryCommand += amount + "', '";
    queryCommand += confirmationNumber + "', '";
    queryCommand += paymentMethod + "', '";
    queryCommand += spaceID + "'); ";

    queryDB(() => {
        res.render('payment-success', parseJson());
    }, queryCommand);
}

app.get('/success', function (req, res) {
    const payerID = req.query.PayerID;
    const paymentID = req.query.paymentId;

    const execute_payment_json = {
        "payer_id": payerID,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": "10.00"
            }
        }]
    };
    paypal.payment.execute(paymentID, execute_payment_json, function (err, payment) {
        if (err) {
            console.log(err.response);
            throw err;
        } else {
            amount = payment.transactions[0].amount.total;
            confirmationNumber = payment.id;
            paymentMethod = payment.payer.payment_method;
            //SUCCESSFUL PAYMENT, QUERY TO DATABASE
            queryToDatabase(req,res);
        }
    });
});

app.get('/cancel', (req, res) => res.render('payment-failed', parseJson()));

app.get('/admin', (req, res) => {
    let newJSON = parseJson();
    newJSON.correctPassword = true;
    res.render('admin', newJSON);
});

app.post('/admin', (req, res) => {
    const password = req.body.password;
    if (password === 'P@ssw0rd') {
        getAllEvents(req,res);
    } else {
        let newJSON = parseJson();
        newJSON.correctPassword = false;
        res.render('admin', newJSON);
    }
});

app.post('/add-a-new-event', (req,res) => {
    const dateInput = formatDate(req.body.dateInput);
    const eventType = req.body.eventType;
    const queryCommand = "CALL ADD_EVENT_DATE" +
        "('" + dateInput + "', '" + eventType + "');";
    queryDB(() => {
        getAllEvents(req,res);
    }, queryCommand);
});

app.post('/view-all-customer', (req,res) => {
    const dateInput = formatDate(req.body.dateInput2);
    const queryCommand = "CALL VIEW_ALL_CUSTOMER_FOR_DATE" +
        "('" + dateInput  + "');";
    queryDB((row) => {
        let newJSON = parseJson();
        newJSON.customerInfo = row;
        queryDB((row) => {
            newJSON.comingEvent = row;
            res.render('dashboard', newJSON);
        }, "SELECT EVENT_DT, EVENT_TYPE FROM TBL_EVENT WHERE EVENT_DT > NOW();");
    }, queryCommand);

});

function getAllEvents(req, res) {
    queryDB((row) => {
        let newJSON = parseJson();
        newJSON.comingEvent = row;
        newJSON.customerInfo = [[]];
        res.render('dashboard', newJSON);
    }, "SELECT EVENT_DT, EVENT_TYPE FROM TBL_EVENT WHERE EVENT_DT > NOW();");
}

function formatDate(dateInput) {
    let tempString;
    tempString = dateInput.substring(5,10) + '-' + dateInput.substring(0,4);
    return tempString;
}

function parseJson() {
    const fs = require("fs");
    const contents = fs.readFileSync("configurations.json");
    return JSON.parse(contents);
}

function queryDB(_callback, ...queryCommands) {
    let connection = mysql.createConnection(process.env.JAWSDB_URL);
    connection.connect();
    for (let queryCommand of queryCommands) {
        connection.query(queryCommand, function (err, rows, fields) {
            if (err) {
                throw err
            } else {
                console.log('Successful Query! Result: ', rows);
                _callback(rows);
            }
        });
    }
    connection.end();
}

function getCurrentDate() {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();

    today = mm + '-' + dd + '-' + yyyy;
    return today;
}

http.createServer(app).listen(port, function () {

});

