//Copyright 2013-2014 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//Licensed under the Apache License, Version 2.0 (the "License"). 
//You may not use this file except in compliance with the License. 
//A copy of the License is located at
//
//    http://aws.amazon.com/apache2.0/
//
//or in the "license" file accompanying this file. This file is distributed 
//on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, 
//either express or implied. See the License for the specific language 
//governing permissions and limitations under the License.

//Get modules.
var express = require('express');
var http = require('http');
var path = require('path');
var fs = require('fs');
var AWS = require('aws-sdk');
var bodyParser = require("body-parser");
const session = require('express-session');
const cookieParser = require('cookie-parser');
var app = express();

//For cross origin requests
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}

app.use(cookieParser());
app.use(session({ resave: true, saveUninitialized: true, secret: 'ssshhhhh' }));
app.use(allowCrossDomain);


app.set('port', process.env.PORT || 3050);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.locals.theme = process.env.THEME; //Make the THEME environment variable available to the app. 

//Read config values from a JSON file.
var config = fs.readFileSync('./app_config.json', 'utf8');
config = JSON.parse(config);

//Create DynamoDB client and pass in region.
var db = new AWS.DynamoDB({region: config.AWS_REGION});
//Create SNS client and pass in region.
var sns = new AWS.SNS({ region: config.AWS_REGION});

// manage our entries
var entries = [];
app.locals.entries = entries;

//GET pages.
app.use('/', require('./controllers/index'));
app.use('/login',require('./controllers/login'));
app.use('/signup',require('./controllers/signup'));
app.use('/home', require('./controllers/home'));
app.use('/leaderboard', require('./controllers/leaderboard'));

app.get('/logout',function (req, res) {
	session["teamName"] = undefined;
	session["userId"] = undefined;
	res.render('index');
	
});


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
