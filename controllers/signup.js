const express = require('express');
const app = express.Router();
var AWS = require('aws-sdk');
var uuidV4 = require('uuid/v4');
const session = require('express-session');
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(session({ resave: true, saveUninitialized: true, secret: 'ssshhhhh' }));

// all the constants are saved on this file ...
var consts = require('../config/consts');
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
const TEAM_TABLE_NAME = "teamNew";

app.all('/',function(req,res) {

	console.log('inside signup')
	let desiredUserName = req.body.username;
	let teamName = req.body.teamName;
	let firstName = req.body.firstName;
	let lastName = req.body.lastName;
  let phonenumber = req.body.phonenumber;
  let desiredPassword = req.body.password;

	  console.log('username: '+ desiredUserName );
	  console.log('team name:'+teamName);
      //Make sure they included both attributes, and they are non-empty
      if(!desiredUserName) {return res.status(400).send('No Username!');}
      //Now would also be the time to verify their password/usernames are appropriate
      //(Example: at least 6 char password.)
      if(!desiredPassword || desiredPassword.length < 6) {return res.status(400).send('Password must be at least 6 charecters long!');}


      //Now we check if a user with that username already exists:
      getUser(desiredUserName, (err, data)=>{
       //console.log('data after get user: '+data.Item);
        //Found a user with that same name!
        if(data) return res.status(400).send('Username already taken!');

        //If the username is unique, create the user
        createNewUser(desiredUserName, desiredPassword,teamName,firstName,lastName,phonenumber, (err, data)=>{
          if(err) return res.status(400).send(err);

		getTeam(teamName, (err, data)=>{

        //Found a team with that same name!
        console.log('data after callback'+data)
		if (data == 'exists'){
			updateTeam(teamName, desiredUserName,(err,data)=>{
		console.log('team name after success'+teamName);
				res.send(data);
			});
		}
		else {

		createNewTeam(teamName,desiredUserName, (err, data)=>{
			if(err) return res.status(400).send(err);
          session['teamName'] = teamName;
		  session['userId'] = desiredUserName;

          res.send(data);
		});
		}
		});
	  });
	  });

	function getSalt(){
		return uuidV4();
	}

	function hashPassword(password, salt){
		hashFunction = crypto.createHash(HASHING_FUNCTION_NAME);

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
		console.log('in get user'+data.Item);
		  callback(err, data.Item);
	  });
	}

	function getTeam(teamName, callback){

		  //Query for users with that username
		  const query = {
			TableName: TEAM_TABLE_NAME,
			Key: {
			  "teamName":teamName
			}

		  }
		  docClient.get(query, (err, data) => {
		  // console.log('data in get team: '+JSON.stringify(data.Item.teamName))
		   console.log('error in get team: '+data+'and item'+data.Item)
		   if(!data.Item) {callback('no team')}
		   else if (data.Item.teamName == teamName) {
			   console.log('matches')
			   callback(err, 'exists');
		   }
		   else {
			   callback(err, data.Item);
		   }

		  });
	}

	function createNewUser(username, password,teamName,firstName,lastName,phonenumber, callback) {
		let salt = getSalt(),
		passwordHash = hashPassword(password,salt),

		item = {
		  "userId": username,
		  "salt": salt,
		  "password":passwordHash,
		  "fname":firstName,
		  "lname":lastName,
		  "teamName":teamName,
		  "points": 0,
      "phonenumber": phonenumber
		},
		params = {
		  Item:item,
		  TableName:USER_TABLE_NAME
		};
		//Insert the user into our DynamoDB table
	  docClient.put(params,(err, data) => {
		  console.log('error in user: '+err)
		callback(err, data);
	  });
	}

	function updateTeam(teamName,username, callback){

	var params = {
		TableName:TEAM_TABLE_NAME,
		Key:{
			"teamName": teamName
		},
		UpdateExpression: "SET teamMembers = list_append(teamMembers, :i)",
		ExpressionAttributeValues:{

			":i":[username],
		},
		ReturnValues:"UPDATED_NEW"
	};
	docClient.update(params, function(err, data) {
		callback(err,data);
	});
	}

	function createNewTeam(teamName,username, callback) {

			item = {
				"teamName":teamName,
				"teamMembers":[username]
			},
			params = {
				Item:item,
				TableName:TEAM_TABLE_NAME
			};
		docClient.put(params, (err,data)=> {
			console.log('error in create team: '+err)
			callback(err,data);
		});

	}

 })

module.exports = app;
