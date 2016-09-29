var express = require('express');
var router = express.Router();
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var User = require('../models/user');
var neo4j = require('neo4j-driver').v1;
var driver = neo4j.driver('bolt://localhost',neo4j.auth.basic('neo4j','azerty159'));
var session = driver.session()
// Login
router.get('/login', function(req, res){
	//req.flash('success_msg', 'You are logged out');
	res.render('login');
});

/*router.get('/topvis',function(req,res){
	res.render('index');
})*/


passport.use(new Strategy(
  function(username,password,cb) {


   User.findByUsername(username, function(err, user) {
      if (err) { 
		
				return cb(err);
			 }
      if (!user) {
		
				 return cb(null, false, {message: 'Unknown User'}); 
				}
		 
		 User.comparePassword(password, user.password, function(err, isMatch){
   			if(err) throw err;
   				if(isMatch){
   						return cb(null, user);
   				} else {
   				return cb(null, false, {message: 'Invalid password'});
   				}
   	});
    });
  }));

	passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  User.findById(id, function (err, user) {
    if (err) { return cb(err); }
    cb(null, user);
  });
});

router.post('/login', passport.authenticate('local', {successRedirect:'/', failureRedirect:'/users/login',failureFlash: true}),

  function(req, res) {
    res.redirect('/');
  });

router.post('/logout', function(req, res){
	req.logout();

	req.flash('success_msg', 'You are logged out');

	res.redirect('users/login');
});

module.exports = router;