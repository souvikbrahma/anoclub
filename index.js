var express = require('express');
var socket = require('socket.io');
var loginStatus;

var app = express();

var mongo = require('mongodb').MongoClient;
var dburl = "mongodb://127.0.0.1:27017/";
var ObjectId = require('mongodb').ObjectID;

var z = [];
var chatl = [];

var  server = app.listen(4000, function(){
    console.log("Listenning on the port 4000 !!");
});

app.use(express.static('public'));

var io = socket(server);

io.on('connection', function(socket){
    console.log("A new user got COnnceted, with user Id "+socket.id);

    var handshakeData = socket.request;

    var userid = handshakeData._query['userid'];

    if(userid == null){

    }
    else {
        mongo.connect(dburl, function(err, db){
            var userTable = db.db("confessions");
            
            var t = { id : userid }; 
            console.log(userid);
            userTable.collection("user").findOne(t, function(err, result){
                if(err) throw err;
                
                if(result != null){
                    console.log(result.rooms);
                    var e = result.rooms;
                    for(var i = 0; i<e.length; i++){
                        var x = e[i];
                        socket.join(e[i].roomname);
                    }
                }
            });
    
            
        });
    }


    socket.on('disconnect', function(data){
        console.log("One user got disconnected with Socket Id"+socket.id);

    });

    socket.on('loginDetails', function(data){
        loginChecks(data, socket);
    });


    socket.on('NewUsername', function(data) {
        newUsername(data, socket);
    });

    socket.on('Group List', function(data) {
        //getGroupList(data, socket);
    });

    socket.on('NewGroupCreate', function(data) {
        createGroup(data, socket);
    });

    socket.on("GroupFind", function(data) {
        findGroups(data, socket);
    });

    socket.on("GroupJoinRequest", function(data) {
        groupJoinRequest(data, socket);
    });

    socket.on("sGroupList", function(data){
        subscribedGroupList(data, socket);
    });

    socket.on("GroupText", function(data){
        storeGroupConf(data, socket);
    });

    socket.on("GConfs", function(data){
        groupConfs(data, socket);
    });

    socket.on("StoreComment", function(data){
        storeComment(data, socket);
    });

    socket.on('ConfessionComment', function(data) {
        getConfessionComment(data, socket);
    });

    socket.on('InboxConfessionStore', function(data){
        inboxConfessionStore(data, socket);
    });

    socket.on('InboxConfession', function(data){
        inboxConfession(data, socket);
    });

    socket.on('chatLoad', function(data){
        chatLoad(data, socket);
    });

    socket.on('chatMessageStore', function(data){

        //console.log(io);

        chatMessageStore(data, socket, io);
    });

    socket.on('chatList', function(data){
        chatList(data, socket);
    });

});

function chatList(data, socket) {
    mongo.connect(dburl, function(err, db){
        var userTable = db.db("confessions");
        
        var userid = data.userid;
        
        var t = { id : userid }; 
        
        userTable.collection("user").findOne(t, function(err, result){
            if(err) throw err;

            //console.log(result.chats);

            var r = result.chats;
            var e = [];
            for(var i = 0; i<r.length; i++) {
                var s = r[i].chatname.split("////u////");
                if(s[0] == userid) {
                    var y = {
                        chattername : "Nameless",
                        chatid : r[i].chatid
                    };
                }
                else {
                    var y = {
                        chattername : "Nameless",
                        chatid : r[i].chatid
                    };
                }
                e.push(y);
            }

            console.log(e);

            socket.emit("chatListReply", e);
                
        });

        
    });
}

function chatMessageStore(data, socket, io) {
    mongo.connect(dburl, function(err, db){
        var userTable = db.db("confessions");

        var chatid = data.chatid;
        var userid = data.userid;
        var message = data.chatmessage;
        //var t = { _id : new ObjectId(data) };
        
        //console.log(chatid);
        //console.log(userid);
        //console.log(message);

        var timestamp = new Date().getTime();
        var d = { id : chatid};
        var f = {$push : { conversation : { teller : userid, message : message, time : timestamp }}};
        
        userTable.collection("chat").findOneAndUpdate(d, f, function(err, result){
            if(err) throw err;

            console.log(io.sockets);
            console.log(socket);

            console.log(result.value.chatname);
            
            var o = {
                teller : "unknown",
                chatText : message,
                time : "time"
            };

            socket.broadcast.to(result.value.chatname).emit("chatMessageRecieved", o);
            
            
        });

    });
}

function chatLoad(data, socket){
    mongo.connect(dburl, function(err, db){
        var userTable = db.db("confessions");

        var chatid = data.chatid;
        var userid = data.userid;
        //var t = { _id : new ObjectId(data) }; 
        userTable.collection("chat").findOne({ id : chatid }, function(err, result){
            if(err) throw err;

            //console.log(result);
            if(result == null){
                //console.log(chatid);
                var t = { id : userid };
                var chatname;
                userTable.collection("user").findOne(t, function(err, result){
                    console.log(result.otherconfessions);
                    var w = result.otherconfessions;
                    var confessor;
                    for(var i=0;i<w.length;i++){
                        if(w[i].confid == chatid){
                            chatname = userid+"////u////"+w[i].confessor;
                            confessor = w[i].confessor;
                            break;
                        }
                    }
                    var n = {
                        id : chatid,
                        chatname : chatname,
                        conversation : []
                    };
                    
                    userTable.collection("chat").insertOne(n, function(err, result){
                        //console.log(result);
                    });
                    var d = { id : userid};
                    var f = {$push : { chats : { chatid : chatid, chatname : chatname }}}
                    userTable.collection("user").findOneAndUpdate(d, f, function(err, result){
                        //console.log(result);
                    });
                    var d = { id : userid};
                    var f = {$push : { rooms : { roomname : chatname }}}
                    userTable.collection("user").findOneAndUpdate(d, f, function(err, result){
                        //console.log(result);
                    });
                    var d = { id : confessor};
                    var f = {$push : { chats : { chatid : chatid, chatname : chatname }}}
                    userTable.collection("user").findOneAndUpdate(d, f, function(err, result){
                        //console.log(result);
                    });
                    var d = { id : confessor};
                    var f = {$push : { rooms : { roomname : chatname }}}
                    userTable.collection("user").findOneAndUpdate(d, f, function(err, result){
                        //console.log(result);
                    });



                });

                var f = {
                    id : chatid
                    
                };
            }
            else {
                userTable.collection("chat").findOne({ id : chatid }, function(err, result){
                    if(err) throw err;

                    var chats = result.conversation;
                    var g = [];
                    for(var i = 0; i < chats.length; i++){
                        var y = new Date(chats[i].time);
                        var u = y.toUTCString().split(" ");
                        var e = u[0]+" "+u[1]+" "+u[2]+" "+u[3];
                        var teller;
                        if(chats[i].teller == userid) {
                            teller = "self"
                        }
                        else {
                            teller = "unknown"
                        }
                        var x = {
                            teller : teller,
                            chatText : chats[i].message,
                            time : e
                        };
                        g.push(x);
                    }
                    //console.log(chatid);
                    
                    socket.emit("chatLoad", g);

                });
        
            }
            
        });

    });
}

function inboxConfession(data, socket){
    mongo.connect(dburl, function(err, db){
        var userTable = db.db("confessions");

        //var userid = data.userid;
        //var t = { _id : new ObjectId(data) }; 
        userTable.collection("user").findOne({ id : data }, function(err, result){
            if(err) throw err;

            //console.log(result.otherconfessions);
            var d = result.otherconfessions;
            var g = [];
            for(var i = 0; i < d.length; i++){
                var y = new Date(d[i].time);
                var u = y.toUTCString().split(" ");
                var e = u[0]+" "+u[1]+" "+u[2]+" "+u[3];
                
                var x = {
                    confid : d[i].confid,
                    conf : d[i].conf,
                    time : e
                };
                g.push(x);
            }
            //console.log(g);
            socket.emit("inboxConfessions", g);    

        });

    });
    
}

function inboxConfessionStore(data, socket){

    //console.log(socket);
    
    mongo.connect(dburl, function(err, db){
        var userTable = db.db("confessions");
        var confuid = new ObjectId();
        var toid = data.toid;
        var message = data.message;
        var myid = data.myid;
        var timestamp = new Date().getTime();
        var t = { id : myid }; 
        var o =  { $push : { ownconfessions : { confid : confuid, toid : data.toid, conf : message, time : timestamp}}};
        userTable.collection("user").findOneAndUpdate(t, o, function(err, result){
            if(err) throw err;

            var t = { username : toid }; 
            var o =  { $push : { otherconfessions : { confid : confuid, confessor : myid, conf : message, time : timestamp}}};
            userTable.collection("user").findOneAndUpdate(t, o, function(err, result){
                if(err) throw err;

            });
            var cps = {
                status : "Confession posted successfully"
            };
            socket.emit("ConfPostStatus", cps);
                
        });

        
    });

}

function getConfessionComment(data, socket) {
    mongo.connect(dburl, function(err, db){
        var userTable = db.db("confessions");
        var cid = data.cid;
        var gid = data.gid;
        var t = { _id : new ObjectId(gid), confessions : {$elemMatch: { _id : new ObjectId(cid)}}}; 
        var o = { "confessions.$.com" : '1' , _id : '0' };
        userTable.collection("groups").find(t, o).toArray(function(err, result){
            if(err) throw err;
            
            console.log(result[0].confessions);
            var s = result[0].confessions;
            var i;
            for(var i = 0; i < s.length; i++){
                if(s[i]._id == cid){
                    break;
                }
            }
            var comList = s[i].com;
            //
            var s = comList;
            var i;
            var g = [];
            for(var i = 0; i < s.length; i++){
                var y = new Date(s[i].time);
                var u = y.toUTCString().split(" ");
                var e = u[0]+" "+u[1]+" "+u[2]+" "+u[3];
                
                var x = {
                    comment : s[i].comment,
                    time : e
                };
                g.push(x);
            }
            console.log(g);
            
            socket.emit("CommentList", g);

        });
    });
}

function storeComment(data, socket) {
    mongo.connect(dburl, function(err, db){
        var userTable = db.db("confessions");
        //console.log(data);
        var cid = data.cid;
        var gid = data.gid;
        var g = data.comment;
        var u = data.commentorid;
        var f = new Date().getTime();
        var t = { confessions : {$elemMatch: { _id : new ObjectId(cid)}}}; 
        var o = { $push : { "confessions.$.com" : { comment : g, commentor : u, time : f}}};
        userTable.collection("groups").findOneAndUpdate(t, o, function(err, result){
            if(err) throw err;
            
            console.log(result);

        });
    });
}

function groupConfs(data, socket) {
    mongo.connect(dburl, function(err, db){
        var userTable = db.db("confessions");
        //console.log(data);
        userTable.collection("groups").findOne({ _id : new ObjectId(data) }, function(err, result){
            if(err) throw err;
            var t = [];
            var k = result.confessions;
            //console.log(result);
            for(var i=0; i < k.length; i++){
                var y = new Date(k[i].time);
                var u = y.toUTCString().split(" ");
                var e = u[0]+" "+u[1]+" "+u[2]+" "+u[3];
                var c = {
                    confid : k[i]._id,
                    conf : k[i].conf,
                    time : e
                };
                t.push(c);

            }
            console.log(t);
            socket.emit("groupConfs", t);

        });
    });
}

function storeGroupConf(data, socket){
    mongo.connect(dburl, function(err, db){
        var userTable = db.db("confessions");
        var d = new ObjectId();
        var timestamp = new Date().getTime();
        userTable.collection("groups").findOneAndUpdate({ _id : new ObjectId(data.gid) }, { $push : { confessions : { _id : d, cid : data.cid, conf : data.msg, com : [], like : [], time : timestamp}}}, function(err, result){
            if(err) throw err;
            var y = new Date(timestamp);
            var u = y.toUTCString().split(" ");
            var e = u[0]+" "+u[1]+" "+u[2]+" "+u[3];
            console.log(result.value._id);
            var gh = {
                status : "Confession posted successfully",
                con : {
                    confid : d,
                    conf : data.msg,
                    time : e
                }
            };
            socket.emit("ConfStoreStatus", gh);

        });
    });
}

function subscribedGroupList(data, socket) {
    mongo.connect(dburl, function(err, db){
        var userTable = db.db("confessions");
        userTable.collection("user").findOne({ id : data }, function(err, result){
            var gs = { _id : { $all :  result.groups.toString()} };
            var q = result.groups;
            var r = [];
            for(var i = 0; i < q.length; i++){

                userTable.collection("groups").findOne({"_id": q[i]}, function(err, result){
                    var h = {
                        gname : result.gName,
                        gid : result._id
                    };
                    rqw(h, q.length, socket);
                    //r.push(h);
                    //console.log(r);
                });   
            }
            //console.log(r);  
        });
    });
}

function rqw(h, j, socket){
    z.push(h);  
    if(z.length == j) {
        console.log(z);
        socket.emit("sgList", z);
        z = [];
    }
}

function groupJoinRequest(data, socket) {
    mongo.connect(dburl, function(err, db) {
        var userTable = db.db("confessions");

        userTable.collection("groups").findOne({"_id": new ObjectId(data.groupid)}, function(err, result) {
            if(err) throw err;
            
            //console.log(result);
            if(result.gPass == data.passcode) {
                console.log("Password matched");
                addToGroup(data, socket);
            }
            else {
                var jgStatus = {
                    "status" : "Password didn't match"
                };
                console.log("Password not matched");
                console.log(data);
                socket.emit("jgStatus", jgStatus);
            }
        });
    });
}

function addToGroup(data, socket){
    mongo.connect(dburl, function(err, db) {
        var userTable = db.db("confessions");

        userTable.collection("groups").update({"_id": new ObjectId(data.groupid)}, { $push : { usersPresent : data.userid}}, function(err, result){
            if(err) throw err;

            socket.join(data.groupid);

            userTable.collection("user").update({"id" : data.userid}, { $push : { groups : new ObjectId(data.groupid)}}, function(err, result){
                if(err) throw err;

                var jgStatus = {
                    "status" : "Welcome to the group"
                };

                socket.emit("jgStatus", jgStatus);

            });

        });

    });

}

function findGroups(data, socket) {
    //console.log(new RegExp(data.gName));
    mongo.connect(dburl, function(err, db) {
        var userTable = db.db("confessions");

        if(data.trim() == ""){

        }
        else {
            userTable.collection("groups").find({ gName : new RegExp(data) } ).toArray(function(err, result) {
                if(err) throw err;
                var FindGroupObject = [];
                var json_data, id, groupId, groupName;
                for(var i=0; i < result.length ; i++) {
                    groupId = JSON.parse(JSON.stringify(result[i]._id));
                    groupName = JSON.parse(JSON.stringify(result[i].gName));
                    FindGroupObject.push({ groupid : groupId, groupName: groupName});
                }
                //console.log(FindGroupObject);
                socket.emit("FindGroupList", FindGroupObject);
                
            });
        }
        
    });
}

function createGroup(data, socket) {
    console.log(data);
    mongo.connect(dburl, function(err, db) {
        var userTable = db.db("confessions");

        var groupCreateJson = {
            "creatorId" : data.id,
            "gName" : data.gname,
            "gDescp" : data.gdescp,
            "gPass" : data.gpass,
            "confessions" : [],
            "usersPresent" : [data.id]
        };
        console.log("2");
        
        userTable.collection("groups").insertOne(groupCreateJson, function(err, result) {
            if(err) throw err;

            var cgStatus = {
                "status" : "Group created Successfully"
            };

            //console.log(result.insertedId);
            //console.log("////////////////////////////");
            //console.log(result);
            var f = result.insertedId;

            socket.join(result.insertedId);

            userTable.collection("user").update({ id : data.id }, {$push : { groups :  f}}, function(err, result) {
                if(err) throw err;
            });

            socket.emit("NewGroupCreateStatus", cgStatus);

            console.log("4");
        });
        
    });
}

function loginChecks(data, socket) {

    console.log("3r");
    mongo.connect(dburl, function(err, db) {
        var userTable = db.db("confessions");

        userTable.collection("user").findOne({ id : data.id}, function(err, result){
            if(err) throw err;

            console.log();

            var gid = result;

            console.log("4r");

            if(result == null) {
                console.log("1r");
                storeDetails(data, socket); 
                console.log(result);
                console.log("1");
            }
            else {
                //storeDetails
                console.log("5r");
                checkDetails(data, socket);
                console.log(result);
                console.log("6r");
            }
        });
    });
}

function storeDetails(data, socket) {
    mongo.connect(dburl, function(err, db) {
        var userTable = db.db("confessions");
        var timestamp = new Date().getTime();
        var userData = { 
            "id" : data.id , 
            "name" : data.name, 
            "username" : 'm' , 
            "rooms" : [],
            "chats" : [], 
            "groups" : [] , 
            "ownconfessions" : [],
            "otherconfessions" : [],
            "time" : timestamp 
        };

        userTable.collection("user").insert(userData, function(err, result){
            if(err) throw err;

            console.log(result);

            var dataStoreStatus = {
                status : "Welcome to Confessions",
                statusCode : "Username not updated",
                userName : "m",
                id : data.id
            };
            console.log("3");
            socket.emit("dataStoreStatus", dataStoreStatus);

        });
    });
}

function newUsername(data, socket) {
    mongo.connect(dburl, function(err, db) {
        var userTable = db.db("confessions");
        userTable.collection("user").findOne({ username : data.userName }, function(err, result){
            if(err) throw err;
            var gid = result;
            if(result != null) {
                
                var userNameStatus = {
                    status : 'taken',
                    statusCode : "TAKEN",
                    userName : data.userName
                };
                console.log("4");
                socket.emit("Username availability", userNameStatus);
            }
            else {

                mongo.connect(dburl, function(err, db) {
                    var userTable = db.db("confessions");
                    var timestamp = new Date().getTime();
                    
                    userTable.collection("user").update({ id : data.id }, {$set : {username : data.userName, phoneNumber : data.phonenumber, contactList : data.contactList }}, function(err, result){
                        if(err) throw err;
            
                        console.log(result);
            
                        var dataStoreStatus = {
                            status : "Welcome to Confessions",
                            statusCode : "Name updated successfully",
                            userName : data.userName,
                            id : data.id
                        };
                        console.log("5");
                        socket.emit("Username availability", dataStoreStatus);
            
                    });
                });
            }
        });
    });
}

function checkDetails(data, socket) {

    console.log("7r");

    mongo.connect(dburl, function(err, db) {
        var userTable = db.db("confessions");
        userTable.collection("user").findOne({ id : data.id}, function(err, result){
            if(err) throw err;

            console.log("8r");

            if(result.username == 'm') {
                var dataStoreStatus = {
                    status : "Welcome back to Confessions",
                    statusCode : "Username not updated",
                    userName : "m",
                    id : data.id
                };
                console.log("6");
                socket.emit("dataStoreStatus", dataStoreStatus);
            }

            else {
                var dataStoreStatus = {
                    status : "Welcome back to Confessions",
                    statusCode : "TOTAL SET",
                    userName : result.username,
                    id : data.id
                };
                console.log("9r");
                socket.emit("dataStoreStatus", dataStoreStatus);
            }
        });
    });
}