// include the express module
var express = require("express");

// create an express application
var app = express();

// helps in extracting the body portion of an incoming request stream
var bodyparser = require('body-parser');

// fs module - provides an API for interacting with the file system
var fs = require("fs");

// helps in managing user sessions
var session = require('express-session');

// native js function for hashing messages with the SHA-256 algorithm
var crypto = require('crypto');

// include the mysql module
var mysql = require("mysql");

// include xml module
var xml2js = require("xml2js");
var parser = new xml2js.Parser();

// serve info
var host;
var user;
var password;
var database;
var port;

// apply the body-parser middleware to all incoming requests
app.use(bodyparser());

// use express-session
// in mremory session is sufficient for this assignment
app.use(session({
  secret: "csci4131secretkey",
  saveUninitialized: true,
  resave: false
}));

// read xml files for server details
fs.readFile(__dirname + '/dbconfig.xml', function(err, data){
	if (err) throw err;
	parser.parseString(data, function(err, result){
		if (err) throw err;
		host = result.dbconfig.host[0];
		user = result.dbconfig.user[0];
		password = result.dbconfig.password[0];
		database = result.dbconfig.database[0];
		port = result.dbconfig.port[0];
	});
});


// server listens on port 9081 for incoming connections
app.listen(process.env.PORT || 9081, () => console.log('Listening on port 9081!'));

app.get('/',function(req, res) {
  res.sendFile(__dirname + '/client/welcome.html');
});

// // GET method route for the events page.
// It serves events.html present in client folder
app.get('/events',function(req, res) {
  if (req.session.value) {
    res.sendFile(__dirname + '/client/events.html');
  } else {
    res.redirect('/login');
  }
});

// GET method route for the addEvent page.
// It serves addEvent.html present in client folder
app.get('/addEvent',function(req, res) {
  if (req.session.value) {
    res.sendFile(__dirname + '/client/addEvent.html');
  } else {
    res.redirect('/login');
  }
});

//GET method for stock page
app.get('/stock', function (req, res) {
  if (req.session.value) {
    res.sendFile(__dirname + '/client/stock.html');
  } else {
    res.redirect('/login');
  }
});

// GET method route for the login page.
// It serves login.html present in client folder
app.get('/login',function(req, res) {
  if (req.session.value) {
    res.sendFile(__dirname + '/client/events.html');
  } else {
    res.sendFile(__dirname + '/client/login.html');
  }
});

// GET method route for the login page.
// It serves login.html present in client folder
app.get('/admin',function(req, res) {
  if (req.session.value) {
    res.sendFile(__dirname + '/client/admin.html');
  } else {
    res.sendFile(__dirname + '/client/login.html');
  }
});

// return current user
app.get('/userLogin', function(req,res){
  if (req.session.value) {
    res.json({login: req.session.user});
  }
});

// GET method to return the list of users
// The function queries the tbl_accounts table
app.get('/getListOfUsers', function(req, res) {
  var con = mysql.createConnection({
    host: host,
    user: user,
    password: password,
    database: database,
    port: port
  });

  con.connect(function(err) {
    if (err) {
      throw err;
    };
    console.log("Connected!");
    con.query('SELECT * FROM tbl_accounts', function(err, result) {
      if (err) throw err;
      console.log("Users Loaded");
      res.json(result);
    });
  });
});

// POST method to add user
app.post('/addUser', function(req, res) {
  if (req.session.value) {
    var con = mysql.createConnection({
      host: host,
      user: user,
      password: password,
      database: database,
      port: port
    });

    var newUser = {
      acc_name: req.body.name,
      acc_login: req.body.login,
      acc_password: crypto.createHash('sha256').update(req.body.password).digest('base64')
    };

    con.connect(function(err) {
      if (err) {
        throw err;
      };
      console.log("Connected!");

      con.query('SELECT * FROM tbl_accounts WHERE acc_login = ?', newUser.acc_login, function(err, result) {
        if (err) throw err;
        if (result.length > 0){
          console.log("Users Find");
          res.json({flag: false});
        } else {
          con.query('INSERT tbl_accounts SET ?', newUser, function(err, result) {
            if (err) throw err;
            console.log("Add User Successful");
            res.json({flag: true, id: result.insertId});
          });
        }
      });
    });
  } else {
    res.redirect('/login');
  }
});

// POST method to update user
app.post('/updateUser', function(req, res) {
  var con = mysql.createConnection({
    host: host,
    user: user,
    password: password,
    database: database,
    port: port
  });

  con.connect(function(err) {
    if (err) {
      throw err;
    };
    console.log("Connected!");
      con.query('SELECT * FROM tbl_accounts WHERE acc_login = ?', req.body.login, function(err, result) {
      if (err) throw err;
      if (result.length > 0){
        console.log("Users Collide");
        res.json({flag: false});
      } else {
	    if (req.body.password == "") { //only update login
		  con.query('UPDATE tbl_accounts SET acc_name = ?, acc_login = ? WHERE acc_id = ?', [req.body.name, req.body.login, req.body.id], function(err, result) {
	        if (err) throw err;
	        console.log("Update (password unchanged)");
	        res.json({flag: true});
	      });
	    } else {
	      con.query('UPDATE tbl_accounts SET acc_name = ?, acc_login = ?, acc_password = ? WHERE acc_id = ?', [req.body.name, req.body.login, crypto.createHash('sha256').update(req.body.password).digest('base64'), req.body.id], function(err, result) {
	        if (err) throw err;
	        console.log("Update (password changed)");
	        res.json({flag: true});
	      });
	    }
	  }
	});
  });
});

// POST method todelete user
app.post('/deleteUser', function(req, res) {
  var con = mysql.createConnection({
    host: host,
    user: user,
    password: password,
    database: database,
    port: port
  });

  con.connect(function(err) {
    if (err) {
      throw err;
    };
    console.log("Connected!");
    con.query('DELETE FROM tbl_accounts WHERE acc_login = ?', req.body.login, function(err, result) {
      if (err) throw err;
      if (req.body.login == req.session.user) {
      	console.log("User current logged in");
      	res.json({flag: false});
      } else {
      	console.log("Delete successful");
      	res.json({flag: true});
      }
    });
  });
});

// GET method to return the list of events
// The function queries the tbl_events table for the list of events and sends the response back to client
app.get('/getListOfEvents', function(req, res) {
  var con = mysql.createConnection({
    host: host,
    user: user,
    password: password,
    database: database,
    port: port
  });

  con.connect(function(err) {
    if (err) {
      throw err;
    };
    console.log("Connected!");
    con.query('SELECT * FROM tbl_events WHERE event_id <> 0', function(err, result) {
      if (err) throw err;
      console.log("Events Loaded");
      res.json(result);
    });
  });
});

// POST method to insert details of a new event to tbl_events table
app.post('/postEvent', function(req, res) {
  if (req.session.value) {
    var con = mysql.createConnection({
      host: host,
      user: user,
      password: password,
      database: database,
      port: port
    });

    var eventToBeInserted = {
      event_day: req.body.day,
      event_event: req.body.event,
      event_start: req.body.start,
      event_end: req.body.end,
      event_location: req.body.location,
      event_phone: req.body.phone,
      event_info: req.body.info,
      event_url: req.body.url
    };

    con.connect(function(err) {
      if (err) {
        throw err;
      };
      console.log("Connected!");

      con.query('INSERT tbl_events SET ?', eventToBeInserted, function(err, result) {
        if (err) throw err;
        console.log("Inserted Successful");
        res.redirect('/events');
      });
    });
  } else {
    res.redirect('/login');
  }
});

// POST method to validate user login
// upon successful login, user session is created
app.post('/sendLoginDetails', function(req, res) {

  var username = req.body.username;
  var login_password = crypto.createHash('sha256').update(req.body.password).digest('base64');

  var con = mysql.createConnection({
    host: host,
    user: user,
    password: password,
    database: database,
    port: port
  });

  con.connect(function(err) {
    if (err) {
      throw err;
    };
    console.log("Connected!");
    con.query('SELECT * FROM tbl_accounts WHERE acc_login = ? AND acc_password = ?', [username, login_password], function(err, result) {
      if (err) throw err;
      if (result.length > 0) {
        req.session.value = 1;
        req.session.user = username;
        res.json({status: 'success'});
        console.log("Login successful");
      } else {
        console.log("Validation failed");
        res.json({status: 'fail'});
      }
    });
  });
});

// log out of the application
// destroy user session
app.get('/logout', function(req, res) {
  if(!req.session.value) {
		res.send('Session not started, can not logout!');
	} else {
    console.log ("Successfully Destroyed Session!");
		req.session.destroy();
    res.redirect('/login');
	}
});

// middle ware to serve static files
app.use('/client', express.static(__dirname + '/client'));


// function to return the 404 message and error to client
app.get('*', function(req, res) {
  if(req.session.value) {
    res.sendStatus(404);
	} else {
		console.log("Session does not exist");
	}
});