const http = require('http');
const path = require('path');
const helmet = require('helmet'); // for security consideration
const paypal = require('paypal-rest-sdk');

const express = require('express');
let app = express();
const port = process.env.PORT || 8080;

app.use(helmet());
app.set('views', path.join(__dirname, "views"));
app.set('view engine', 'ejs');
app.use(express.static('public')); //Express serves images, CSS files, and JavaScript files in a directory named public
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//testing
var mysql = require('mysql');
var connection = mysql.createConnection(process.env.JAWSDB_URL);

connection.connect();

connection.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
    if (err) throw err;

    console.log('The solution is: ', rows[0].solution);
});

connection.end();

//setting paypal information
paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AYscelyFVeqO7lxrqpBaVv-7y9nZPWyN98a-wv-8bUObZAlipfk7QCwmV54JsJDxo26Bxsh4FirUzTof',
    'client_secret': 'EL9UFVbvXyKFowaUPrO7ZPVYbBXk7NBC3XFZvsgZIXQ_B5taISxH4bj2KLDd5Loy5f6xsSmQyqHD7KAx'
});

// Root GET URL takes the configuration file and render the index.ejs file
app.get('/', function (req, res) {
    res.render('index', parseJson());
});

app.post("/", function (req, res) {
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
            console.log("Get Payment Response");
            console.log(JSON.stringify(payment));
            res.render('payment-success', parseJson());
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
        res.render('dashboard', parseJson());
    } else {
        let newJSON = parseJson();
        newJSON.correctPassword = false;
        res.render('admin', newJSON);
    }
});

function parseJson() {
    const fs = require("fs");
    const contents = fs.readFileSync("configurations.json");
    return JSON.parse(contents);
}

http.createServer(app).listen(port, function () {

});

