const http = require('http');
const path = require('path');
const helmet = require('helmet'); // for security consideration

const express = require('express');
let app = express();
const port = process.env.PORT || 8080;

app.use(helmet());
app.set('views', path.join(__dirname, "views"));
app.set('view engine', 'ejs');
app.use(express.static('public')); //Express serves images, CSS files, and JavaScript files in a directory named public
app.use(express.json());
app.use(express.urlencoded({extended: true}));


// Root GET URL takes the configuration file and render the index.ejs file
app.get('/', function (req, res) {
    res.render('index', parseJson());
});

app.post("/", function (req, res) {
    console.log(req.body);
    res.render('payment-success', parseJson());
});

function parseJson() {
    const fs = require("fs");
    const contents = fs.readFileSync("configurations.json");
    return JSON.parse(contents);
}

http.createServer(app).listen(port, function () {

});

