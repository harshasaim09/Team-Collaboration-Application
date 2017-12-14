var express = require('express');
var api = express.Router();
var https = require('https');
var AWS = require('aws-sdk');
const session = require('express-session');
const cookieParser = require('cookie-parser');
var async = require('async');
var uuidV4 = require('uuid/v4');
const sgMail = require('@sendgrid/mail');
var TMClient = require('textmagic-rest-client');


api.use(cookieParser());
api.use(session({ resave: true, saveUninitialized: true, secret: 'ssshhhhh' }));
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

var commitsArray = [];

const TABLE_NAME = 'teamNew';
const USER_TABLE_NAME = 'user';
//for sendgrid
var api_key = consts.sendgridApiKey;

//for sms api
var c = new TMClient('monishverma',consts.smsApiKey);

var teamMembersName = [];
var taskRecords = [];
var totalPoints = [];
var taskArray = []
var ratingArray = []
var completedByArray = []

api.get('/', function (req, res) {
	let userId = session['userId'];
	var commitsStr = '';
	var teamName = '';
	var teamMembersID = [];
	var descriptionArray = [];
	var taskIdArray = [];
	var assignedToArray = [];
	var dueDateArray = [];
	commitsArray = [];

	var options = {
		hostname: 'api.bitbucket.org',
		path: '/2.0/repositories/monishvster/rubick/commits',
		method: 'GET'
	}


	var getCommits = function(response) {
		response.on('data', function(chunk) {
			commitsStr += chunk;
		});

		response.on('end', function(){
			commitsStr = JSON.parse(commitsStr);
			var commit = commitsStr.values;
			for (var key in commit){
				 if (commit.hasOwnProperty(key)) {

					var temp = {
					  author:commit[key].author.raw,
					  date:commit[key].date,
					  reponame:commit[key].repository.name,
					  message:commit[key].message
					}
					commitsArray.push(temp);
				  }
				}
				console.log('session here'+session["teamName"]);
				if (session["teamName"] == undefined) {
          return res.render('index', { title: 'Hello - Please Login To Your Account' });
        }
        else {




				teamName = session["teamName"];
			getAllPoints(teamName,(err,totalPoints) => {

				//console.log('total points after processing'+totalPoints)
				getTeamMembersID(teamName,(err,data)=>{

					var teamMembersID = data;
					teamMembersName = [];
					async.eachSeries(teamMembersID, getTeamMembersName, function (err, data) {
						if (err) {
							return err;
						} else {
							getTasks(teamName,(err,taskRecords)=> {
							 getArchivedTasks(teamName,(err,archivedTasks) => {
								res.render('home',{commitsArray:commitsArray,teamName:teamName,teamMembersName:teamMembersName,teamMembersID:teamMembersID,taskRecords:taskRecords,archivedTasks:archivedTasks});
							});
						  });
						}

					});





				});
				});

		}
		});

	}
	var commitsreq = https.request(options, getCommits);
    commitsreq.end();
});


api.post('/addTask', function (req, res) {
	let description = req.body.description;
	let assignedTo = req.body.assignedTo;
	let rating = req.body.rating;
	let dueDate = req.body.dueDate;

	addTask(description,assignedTo,rating,dueDate, (err,data) => {
                    if(err) throw err;
                    var assignee = ''
                    var phonenumber = ''
                    sgMail.setApiKey(api_key);
                    getUserPhoneNumber(assignedTo,(err,data)=>{
                          phonenumber = data;
                        getTeamMembersName(session["userId"],(err,data)=>{
                          if (err) throw err;
                          assignee = data;
                          //sending sms
                          c.Messages.send({text: 'Team: '+session["teamName"]+' Task Assignment'+
                          '\nYou have been assigned a task by: '+assignee+'\nTask Description: '+description
                          +'\nRating: '+rating+'\nDue Date: '+dueDate, phones:phonenumber}, function(err, res){
                              console.log('Message sent');
                              });


                        const emailData = {
                            to: assignedTo,
                            from: 'monish.vster@gmail.com',
                            subject: 'Team: '+session["teamName"]+' Task Assignment',
                            html: '<strong>You have been assigned a task by: '+assignee+'</strong><br>'
                            +'<p>Task Description: '+description+'</p><br><p>Rating: '+rating+
                            '</p><br>Due Date: '+dueDate
                        };
                        sgMail.send(emailData, (err,data) => {
                          if(err){
                            console.log('error occured'+err)
                          }
                          else {
                            console.log('email sent')
                            res.send(data)
                          }
                    })
                  })

	        })
        })
})

//generate new uuid everytime
	function getUuid(){
		return uuidV4();
	}

function addTask(description,assignedTo,rating,dueDate,callback) {
	let taskId = getUuid();
	let teamName = session["teamName"];
	item = {
		  "taskId": taskId,
		  "assignedTo": assignedTo,
		  "description":description,
		  "dueDate":dueDate,
		  "rating":rating,
		  "teamName":teamName,
		  "isCompleted": false
		},
		params = {
		  Item:item,
		  TableName:'task'
		};
		//Insert the task into our DynamoDB table
	  docClient.put(params,(err, data) => {

		callback(err, data);
	  });
}

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
		//console.log('data in getallpoints: '+JSON.stringify(data.Items));
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

api.post('/submitTask', function (req, res) {
	let taskId = req.body.taskId;
	let rating = req.body.rating;
	let userId = session['userId'];
	console.log('rating in submit task'+rating);
	submitTask(taskId,userId, (err,data) => {
		//getrng points
		getPoints(userId,(err,data) => {
			//console.log("points existing"+data);
			var points = +data + +rating;
			//console.log('total points'+points);
			//updating user points
				updatePoints(points,userId,(err,data) => {
					res.send(data);
				});

		});

	});

});

api.post('/restoreTask', function(req,res) {
	taskArray = req.body.taskArray
  ratingArray = req.body.ratingArray
  completedByArray = req.body.completedByArray


	    async.eachSeries(taskArray, restoreTasks, function (err, data) {
		  if(err){return err;}
		  else{
      console.log('data after restore tasks: '+data)
        }
      })
      async.eachSeries(completedByArray,completedRestore, function(err,data) {
        console.log('data after completedby tasks: '+data)
      })
      restorePoints(ratingArray,(err,data)=>{
        console.log('data in rating'+data)
        res.send(data);
      })
})


function restoreTasks(taskId,callback) {

	var params = {
	TableName:'task',
    Key:{
        "taskId": taskId
    },
	UpdateExpression: "set isCompleted = :r",
	ExpressionAttributeValues:{
        ":r":false
    },
    ReturnValues:"UPDATED_NEW"
	};
	docClient.update(params,(err,data) => {


		callback(err,data);
	});
}

function completedRestore(completedBy,callback) {
  for(var i = 0;i<taskArray.length;i++){
  var params = {
	TableName:'task',
    Key:{
        "taskId": taskArray[i]
    },
	UpdateExpression: "set completedBy = :r",
	ExpressionAttributeValues:{
        ":r":completedBy
        },
    ReturnValues:"UPDATED_NEW"
	};
	docClient.update(params,(err,data) => {

	});
}
callback('err','data');
}

function restorePoints(ratingArray,callback) {
  console.log('rating array: '+ratingArray)

  var finalpoints = 0;
  var count = 0;
  for(var i = 0;i<completedByArray.length;i++){
    var initialpoints = 0;
    var userid = completedByArray[i];
    getPoints(userid,(err,data)=>{
      console.log('points: '+data)
      callback1(data)
    })
    function callback1(param){
      console.log('rating array'+ratingArray)
        finalpoints = param - ratingArray[count]
        count += 1;
    console.log('final points: '+ finalpoints+'user id: '+userid)
      var params = {
      	TableName: USER_TABLE_NAME,
          Key:{
              "userId": userid
          },
      	UpdateExpression: "set points = :r",
      	ExpressionAttributeValues:{
              ":r":finalpoints
          },
          ReturnValues:"UPDATED_NEW"
      	};

      	docClient.update(params,(err,data) => {

      	});
      }

}
callback('err','data');

}

function submitTask(taskId,userId,callback) {

	//console.log('user id in submit task'+userId);
var params = {
	TableName:'task',
    Key:{
        "taskId": taskId
    },
	UpdateExpression: "set isCompleted = :r, completedBy =:p",
	ExpressionAttributeValues:{
        ":r":true,
        ":p":userId
    },
    ReturnValues:"UPDATED_NEW"
	};
	docClient.update(params,(err,data) => {
		//console.log('data after submit'+data)
		//console.log('err after submit'+err)
		callback(err,data);
	});
}

function updatePoints(points,userId,callback) {
	//let userId = session['userId'];

var params = {
	TableName:'user',
    Key:{
        "userId": userId
    },
	UpdateExpression: "set points = :r",
	ExpressionAttributeValues:{
        ":r":points
    },
    ReturnValues:"UPDATED_NEW"
	};
	docClient.update(params,(err,data) => {
		//console.log('data after submit'+data)
		//console.log('err after submit'+err)
		callback(err,data);
	});
}

function getPoints(userId,callback) {
	const query = {
		TableName: USER_TABLE_NAME,
		Key: {
		  "userId":userId
		}

	  }
	  docClient.get(query, (err, data) => {
		//console.log('in get points'+data.Item.points);
		  callback(err, data.Item.points);
	  });

}

function getTasks(teamName,callback){
	taskRecords = [];

	var params = {
		ExpressionAttributeValues: {
		':is': false,
		':tn': teamName
		},
		FilterExpression: 'isCompleted = :is AND teamName = :tn',
		TableName: 'task'
	};
	docClient.scan(params,(err,data) => {
		console.log('all tasks: '+data)
		if(!data){callback('no-tasks')}
		else {
		var str = data.Items;
    console.log('str here: '+str)
		for(var key in str) {
		   if (str.hasOwnProperty(key)) {
           var temp = {
   					  taskId: str[key].taskId,
   					  description: str[key].description,
   					  assignedTo: str[key].assignedTo,
   					  dueDate: str[key].dueDate,
   					  rating: str[key].rating,
   					  isCompleted: str[key].isCompleted,
   					  completedBy: str[key].completedBy
   				  }
            taskRecords.push(temp);
			}
		}
		callback(err,taskRecords);
		}
	});
}

function getArchivedTasks(teamName,callback){
	archivedTasks = [];

	var params = {
		ExpressionAttributeValues: {
		':is': true,
		':tn': teamName
		},
		FilterExpression: 'isCompleted = :is AND teamName = :tn',
		TableName: 'task'
	};
	docClient.scan(params,(err,data) => {
		console.log('all tasks: '+data)
		if(!data){callback('no-tasks')}
		else {
		var str = data.Items;
		for(var key in str) {
		   if (str.hasOwnProperty(key)) {
				var temp = {
					  taskId: str[key].taskId,
					  description: str[key].description,
					  assignedTo: str[key].assignedTo,
					  dueDate: str[key].dueDate,
					  rating: str[key].rating,
					  isCompleted: str[key].isCompleted,
					  completedBy: str[key].completedBy
				  }
		  archivedTasks.push(temp);
			}
		}
		// console.log('temp: '+temp.taskId);



		callback(err,archivedTasks);
		}
	});
}


function getTeamMembersID(teamName, callback){
	const query = {
			TableName: TABLE_NAME,
			Key: {
			  "teamName":teamName
			}
		}
		docClient.get(query, (err, data) => {
			var teamArray = data.Item.teamMembers;
			callback(err, teamArray);
		  });
}

function getTeamMembersName(userName, callback){

	 const query = {
		TableName: 'user',
		Key: {
		  "userId":userName
		}

	  }
	  docClient.get(query, (err, data) => {
		  const fName = data.Item.fname;
		  const lName = data.Item.lname;
		  var fullName = fName +" "+ lName;
		  teamMembersName.push(fullName);
		  callback(err, fullName);

	  });
}

function getUserPhoneNumber(userName, callback){

	 const query = {
		TableName: 'user',
		Key: {
		  "userId":userName
		}

	  }
	  docClient.get(query, (err, data) => {
      var phonenumber = data.Item.phonenumber;
		  callback(err, phonenumber);
	  });
}


module.exports = api;
