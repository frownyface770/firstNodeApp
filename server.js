var express = require('express');
var app = express();
var port = 8888;
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');


/*Body parser*/
/*When ever we get a post request from the form, it gets the data
through a url encoded format*/
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use('/js', express.static(__dirname + '/js'));
/*Initialize sessions*/
app.use(cookieParser());
app.use(bodyParser());
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));

//Initialize passport, for pressistent login sessions
app.use(passport.initialize());
app.use(passport.session());

/*Database connection -MongoDB*/

//Db admin credentials
var username = 'admin';
var password = 'bardgod';

var dbHost = 'localhost';
var dbPort='27017';
var database = 'chatdb';

//Moduel to encrypt the passwords
var bcrypt = require('bcrypt-nodejs');

//Connection string to mongodb
var url = 'mongodb://' + username + ':' + password + '@' + dbHost + ':' + dbPort + '/'+ database;
console.log('MongoDB connection = ' + url);

//Connect to the mongobd database, chatdb
mongoose.connect(url, function(err) {
  if(err) {
    console.log('Connection error: ' + err);
  } else {
    console.log('Connection successful!');
  }
});
/*Declare all models here*/
var UserSchema = new mongoose.Schema({
     username: String,
     password: String
 });

//user= table name, UserSchema = schema object
var User = mongoose.model('user', UserSchema);
//Routes

app.get('/', function (req, res, next) {
    res.sendFile( __dirname + '/index.html');
});

app.get('/register', function (req, res, next) {
    res.sendFile( __dirname + '/register.html');
});

app.get('/home', function (req, res, next) {
    res.sendFile( __dirname + '/home.html');
});
/*
app.post('/login', function(req, res) {
      passport.authenticate('local', function(err, user){
        if (err) {return next(err);}
        req.logIn(user, function(err){
          if (err) {return next(err);}
              return  res.redirect('/home');
        });
      })(req,res);
});*/

app.post('/login', passport.authenticate('local'),
    function(req, res) {
      req.session.user = user;
        res.redirect('/home');
});

app.get('/user', function(req,res,next) {
  User.findById({ _id: req.user._id }, function(err, user) {
    return res.json(user);
  });
});

  /*
  The login logic where it passes here if it reaches passport.authenticate
  */

  passport.use(new LocalStrategy(
	function(username, password, done) {
		User.findOne({ username: username }, function (err, user) {
	        if(user !== null) {
	            var isPasswordCorrect = bcrypt.compareSync(password, user.password);
	            if(isPasswordCorrect) {
	            	console.log("Username and password correct!");
	            	return done(null, user);
	            } else {
	            	console.log("Password incorrect!");
	            	return done(null, false);
	            }
	        } else {
	        	console.log("Username does not exist!");
	            return done(null, false);
	        }
    	});
	}
));
/*
  Serialize and Deserialize here for passport.authenticate
  */
  passport.serializeUser(function(user, done) {
    console.log("Serialize got called")
      done(null, user);
  });

  passport.deserializeUser(function(user, done) {
      User.findById({_id: user._id}, function(err, user) {
        console.log("Deserialize got called")
      	done(err, user);
    	});
  });

app.post('/register', function (req, res, next) {
	var password = bcrypt.hashSync(req.body.password);
	req.body.password = password;

    User.create(req.body, function(err, saved) {
        if(err) {
            console.log(err);
            res.json({ message : err });
        } else {
            res.json({ message : "User successfully registered!"});
        }
    });
});

app.listen(port, '0.0.0.0', function(){
  console.log('Server running at port '+ port);
});
