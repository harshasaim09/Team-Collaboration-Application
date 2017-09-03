var express = require('express');
var api = express.Router();
var request = require('request');

 

var commitsArray = [];

api.get('/home', function (req, res) {
    request('https://api.bitbucket.org/2.0/repositories/monishvster/wordpuzzleapp-ios/commits', function (error, response, body) {
  if (!error && response.statusCode == 200) {
    commitsArray = [];
    var json = JSON.parse(body);
    var commit = json.values;
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
res.render('home',{commitsArray:commitsArray});
  }
});
  
});

module.exports = api;
