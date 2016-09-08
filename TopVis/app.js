var express = require('express');
var routes = require('./routes');
//var linkurious = require('./linkurious');
//var home = require('./routes/home')
//var user = require('./routes/user');
var path = require('path');
var logger = require('morgan');
var http = require('http');
var bodyParser = require('body-parser');
//var neo4j = require('neo4j-driver').v1;
//var graph = require('./routes/graph');
var cons = require('consolidate');
//var util = require('util')
//var $ = require('jquery');
//var Client = require('node-rest-client').Client;
var request = require('request');
//var querystring = require('querystring');
//var https = require('https')
var app = express();
//var curlToNode = require('curl-to-node');
//var got = require('got');

app.set('port', process.env.PORT || 3000);
// View Engin
// assign the swig engine to .html files
//app.engine('html', cons.ejs);
// set .html as the default extension
//app.set('view engine', 'html');
app.set('views', __dirname + '/views');

//app.set('views',path.join(__dirname,'views'));
//app.set('view engine','jade');
app.set('view engine','ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false }));
app.use(express.static(path.join(__dirname,'public')));


//development only
//if ('development' == app.get('env')) {
  //  app.use(bodyParser.errorHandler());
//}
app.get('/', routes.index);
//app.get('/users', user.list);
//app.get('/home',home.graph);
//app.get('/graph',graph.draw);

//app.get('/about',function(req,res){
 // res.sendFile(path.join(__dirname+'/views/basic.html'));
//});
//app.get('/index.html',function(req,res){
 // res.sendFile(path.join(__dirname+'/views/index.html'));
//});
//app.get('/graph',routes.home,{
//	links: linkurious
//});

//var driver = neo4j.driver('bolt://localhost',neo4j.auth.basic('neo4j','azerty159'));
//var session = driver.session()
	
app.get('/da5la',routes.index,function(req,res){
	var username = "root";
	var password = "admin";
	var authenticationHeader = "Basic " + new Buffer(username + ":" + password).toString("base64");
	var port = "5665";
	var host = "172.17.0.2";
	var headers = {
				"Authorization": authenticationHeader,
				'Accept': 'application/json',
				'X-HTTP-Method-Override': 'GET'
		};

	request(   
		{
		url: "https://" + host + ":" + port + "/v1/objects/hosts/?attrs=name&attrs=address",
		method: 'GET',
		headers: headers,
		//body: hosts,
		rejectUnauthorized: false
			},
	function (error, response, body) {
 		if (!error && response.statusCode == 200) {
			 //choft icinga2api lahne ya5ou data mte3 body w ki to5rej men fonction hedhi m3adech defini  
			 icinga2api = JSON.parse(body);
        	console.log(body);
			
    	}else{
		console.log(error);
		}
		} 
		 );
});
//app.get('/start', function(req,res){
	//session
			//.run('MATCH(d:device) RETURN d')
			//.then(function(result){
				//var deviceArr = [];
				//result.records.forEach(function(record){
					//console.log(record._fields[0].properties.Services);
					//deviceArr.push({
						//id: record._fields[0].identity.low,
						//prop: record._fields[0].properties.Services, 
						//});
					//});
					//res.render('index',{
						//devices : deviceArr
						//});
			//})
			//.catch(function(err){
				//console.log(err)
	
//	res.render('render');	
//	});

//app.listen(3000);
//console.log('server Started on Port 3000');

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
//module.exports = app;
