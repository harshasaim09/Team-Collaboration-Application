var expect  = require('chai').expect;
var request = require('request');
var assert = require('assert');
var sinon = require('sinon');
var PassThrough = require('stream').PassThrough;
var https = require('https');

it('Main page response', function() {
    request('http://localhost:3050' , function(error, response, body) {
        expect(response.statusCode).to.equal(200);
    });
});
	
it('About page content', function() {
    request('http://localhost:3050/about' , function(error, response, body) {
        expect(response.statusCode).to.equal(404);
    });
});

it('Home page content', function() {
    request('http://localhost:3050/home' , function(error, response, body) {
        expect(response.statusCode).to.equal(200);
    });
});

it('Leaderboard page content', function() {
    request('http://localhost:3050/leaderboard' , function(error, response, body) {
        expect(response.statusCode).to.equal(200);
    });
});

//testing bitbucket api response 
	
var api  = require('../controllers/home.js');

describe('api', function() {
	//this.timeout(5000);
	beforeEach(function() {
		this.request = sinon.stub(https, 'request');
	});
 
	afterEach(function() {
		https.request.restore();
	});

	it('should convert get result to object', function(done) {
		var expected = { hello: 'world' };
		var response = new PassThrough();
		response.write(JSON.stringify(expected));
		
		response.end();

		this.request.callsArgWith(1, response)
		            .returns(new PassThrough());

		api.get(function(err, result) {
			console.log(JSON.stringify(result));
			assert.deepEqual(result, expected);
			done();
		});
	});
	
});	

