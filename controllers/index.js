var express = require('express');
var api = express.Router();
/*
 * GET home page.
 */

api.get('/', function (request, response) {
  response.render('index.ejs', { title: 'Monish Verma' });
});

module.exports = api;
