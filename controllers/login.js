const express = require('express');
const app = express.Router();
var AWS = require('aws-sdk');
const session = require('express-session');
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(session({ resave: true, saveUninitialized: true, secret: 'ssshhhhh' }));

// all the constants are saved on this file ...
var consts = require('../config/consts');

//Will use the native nodeJS crypto module, and use sha256 as the hashing function
var  crypto = require('crypto');
const HASHING_FUNCTION_NAME = 'sha512';

  AWS.config.accessKeyId = consts.accessKeyId;
  AWS.config.secretAccessKey = consts.secretAccessKey;

  AWS.config.update({
      region: consts.region,
      endpoint: consts.endpoint
  });

  //For cross origin requests
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}

app.use(allowCrossDomain);

var docClient = new AWS.DynamoDB.DocumentClient();

const USER_TABLE_NAME = "user";

app.all('/',function(req,res) {

	let username = req.body.username;
    let password = req.body.password;


	checkCredentials(username,password, function(err,data) {
		res.send(data);
	})


	function hashPassword(password, salt){
	  hashFunction = crypto.createHash(HASHING_FUNCTION_NAME);
	  //Logic specific to the crypto module
	  //(https://nodejs.org/api/crypto.html#crypto_hash_update_data_input_encoding)
	  return hashFunction.update(password+salt).digest('base64');
	}

	function getUser(username, callback){
	  const query = {
		TableName: USER_TABLE_NAME,
		Key: {
		  "userId":username
		}
	  }
	  docClient.get(query, (err, data) => {
		  session['teamName'] = data.Item.teamName;
		  session['userId'] = username;
		  callback(err, data.Item);

	  });
	}




	function checkCredentials(username, password, callback) {
	//First we get the info for the user the client is attempting to check


	getUser(username, (err, user) => {
	if(err) return callback(err);
    if(!user) return callback('Invalid Username');
    const sentPassword_Hashed = hashPassword(password, user.salt);
    //We check if the hash result matches the hash value stored in the database
    if(sentPassword_Hashed === user.password) {
      //Correct password for that username!

      callback(null,user);
    } else {
      callback('Incorrect password!');
    }
  });
	}


})

module.exports = app;
