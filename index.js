var express = require('express');
var socket = require('socket.io');
var loginStatus;

var app = express();

/*var mongo = require('mongodb').MongoClient;
var dburl = "mongodb://127.0.0.1:27017/";
var ObjectId = require('mongodb').ObjectID;
*/
var z = [];
var chatl = [];

var  server = app.listen(4000, function(){
    console.log("Listenning on the port 4000 !!");
});

app.use(express.static('public'));

var io = socket(server);

console.log("Success");