var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var http = require('http');
var bodyParser = require('body-parser');
var cons = require('consolidate');
var request = require('request');
var flash = require('connect-flash');
var expressSession = require('express-session');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var neo4j = require('neo4j-driver').v1;
var driver = neo4j.driver('bolt://localhost',neo4j.auth.basic('neo4j','azerty159'));
var session = driver.session()
var routes = require('./routes/index');
var users = require('./routes/users');

// Init App
var app = express();

app.set('port', process.env.PORT || 3000);

//app.set('views', __dirname + '/views');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine','ejs');


app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname,'public')));

app.use(expressSession({
    secret: 'D5Y*A0149Qspnkapwdr1sz26z369rodmlvq9pamkfc125493sjdhdks321456987523djdndaaqOKDSLMP',
    saveUninitialized: true,
    resave: true
}));

// Passport init
app.use(passport.initialize());
app.use(passport.session());

// Connect Flash
app.use(flash());

// Global Vars
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

app.use('/', routes);
app.use('/users', users);
//app.use('/account',account);

http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port' + app.get('port'));
	
});    
app.post('/icinga2api', function(req, res){
	var username = "root"; 
	var password = "admin";
	var authenticationHeader = "Basic " + new Buffer(username + ":" + password).toString("base64");
	var port = "5665";
	var host = "172.17.0.2";
	//var dataString = '{ "attrs": { "address": "192.168.56.101", "vars.os" : "Linux" } }';
    /*update Host */
	/*request(   
		{
			url : "https://"+host+":"+port+"/v1/objects/hosts/kali",
			headers : {
						 "Authorization" : authenticationHeader,
						 'Accept': 'application/json',
					  },
			method: 'POST',
			body: dataString,
			rejectUnauthorized: false  
			},
	function (error, response, body) {
 		if (!error && response.statusCode == 200) {
        console.log(body);
			res.send(body);
    	}else{
		console.log(error);
		}
		} 
		 );  */

	/*  Get host attributes From Icinga2 API */
	//console.log(req.body.address);
	var headers = {
					"Authorization" : authenticationHeader,
   					 'Accept': 'application/json',
					'X-HTTP-Method-Override': 'GET'
			};
	// ?joins=host.address&filter=host.address==192.168.56.101&attrs=display_name
	//?attrs=display_name&joins=host.address&filter=host.address==192.168.56.101
	//?filter=match("kali*",host.name)
	//filter=match("example.localdomain*",host.name)
	//"host.name==\"api_dummy_host_1\""
	// ,
	//"filter": "match(\"192.168.56.101*\",host.address)"
	if (req.body.type == "GET"){
		//console.log("***********hhhh");
		//console.log(req.body.name);
		var dataGet = '{ "attrs": ["name", "address"] }';
		var hosts = '{ attrs": ["name", "address","display_name","last_check_result","last_state","state","zone"] }';
		var services = '{ "joins": ["host.name", "host.address","host.display_name","host.last_check_result","host.last_state","host.state","host.zone"],"filter": "host.name == name", "filter_vars": { "name":"'+req.body.name+'" }, "attrs": ["display_name", "check_command","last_check_result","state","zone","name","host_name"]}';
		var options = {
   			 url : "https://"+host+":"+port+"/v1/objects/services/",
   			 method: 'GET',
   			 headers: headers,
  		 	 body: services,
			 rejectUnauthorized: false 
			};

		function callback(error, response, body) {
    		if (!error && response.statusCode == 200) {
				//console.log(body);
				//console.log(body.results.attrs);
				body = JSON.parse(body);
				//console.log(body1.results);
				/*body.results.forEach(function(info){
					console.log(info.attrs);
				})*/
					res.send(body);
        			
    		}else{
				console.log(error);
				}
			}

		request(options, callback);
	}
	
		});