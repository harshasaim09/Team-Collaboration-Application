var express = require('express');
var api = express.Router();
/*
 * GET home page.
 */

api.all('/', function (request, response) {
  response.render('index', { title: 'Monish Verma' });
});

module.exports = api;
