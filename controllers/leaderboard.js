var express = require('express');
var api = express.Router();
var https = require('https');
var AWS = require('aws-sdk');
const session = require('express-session');

// all the constants are saved on this file ... 
var consts = require('../config/consts');

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

api.use(allowCrossDomain);

var docClient = new AWS.DynamoDB.DocumentClient();
const USER_TABLE_NAME = 'user';
var totalPoints = [];

api.all('/', function (req, res) {
	if (session["teamName"] == undefined) {  
          return res.render('index', { title: 'Hello - Please Login To Your Account' });
        }   
        else {
	
	teamName = session["teamName"];
		getAllPoints(teamName,(err,totalPoints) => {
				res.render('leaderboard',{totalPoints:totalPoints});
		});
		}
    
});

function getAllPoints(teamName,callback) {
	totalPoints = [];
	var params = {
		ExpressionAttributeValues: {
		':is': teamName
		},
		FilterExpression: 'teamName = :is',
		TableName: USER_TABLE_NAME
	};
	docClient.scan(params,(err,data) => {
		var str = data.Items;
		for(var key in str) {
		   if (str.hasOwnProperty(key)) {
				var temp = {
					  userId: str[key].userId,
					  fname: str[key].fname,
					  lname: str[key].lname,
					  points: str[key].points
				  }
		  totalPoints.push(temp);
			}
		}
		  
		  
		
		callback(err,totalPoints);
	});
}

module.exports = api;