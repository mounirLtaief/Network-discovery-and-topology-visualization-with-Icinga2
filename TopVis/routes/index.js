/*
 * Get home page
 */
var express = require('express');
var router = express.Router();

// Get Homepage
router.get('/', ensureAuthenticated, function(req, res){
	//router.get('/', function(req, res){
	var neo4j = require('neo4j-driver').v1;
	//var ipaddr = require('ip-address').Address4;
	var request = require('request');
	//var Address6 = require('ip-address').Address6;
    var driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', 'azerty159'));
    var session = driver.session();
	var linkArr = [];
	var deviceArr = [];
	var devices1 = [];
	var devices2 = [];
	var devices3 = [];
	var devices4 = [];
	var found = false;
	// icinga2 API 
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
	
	function is_monitored_by_icinga2(devices,ip) {
		var is_monitored = [false, null];
		devices.results.forEach(function (info) {
			if (info.attrs.address == ip) {
				is_monitored =  [true,info.attrs.name];
			}
		})
		return is_monitored;
		}
	
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
			 icinga2api = JSON.parse(body);
	session.run('MATCH (d)<-[r:CONNECTED]->() RETURN DISTINCT(r)')
		.then(function (result) {
			var comp= 0 ;
			result.records.forEach(function (record) {
				linkArr.push({
					id: record._fields[0].identity.low,
					source: record._fields[0].start.low,
					target: record._fields[0].end.low,
					interface0: record._fields[0].properties.interface_0,
					interface1: record._fields[0].properties.interface_1,
				}
				
				);

			});

			})

	session.run('MATCH(d:device) WHERE (d.Hostinfo IS NOT NULL AND d.SystemInfo IS NOT NULL ) RETURN DISTINCT(d)')
		.then(function (result) {
			var icinga2 = false;
			result.records.forEach(function (record) {

				str1 = (((record._fields[0].properties.SystemInfo[0]).replace('{', '')).replace('}', '')).split(',');
				str2 = (record._fields[0].properties.InterfacesSnmp[0].replace('{', '')).replace('[', '').replace(']', '').split('},');
				str3 = record._fields[0].properties.Hostinfo[0].split(',');
				str4 = record._fields[0].properties.Services[0];
				str5 = record._fields[0].properties.Vuls[0];
				ifArr = [];
				servArr = [];
				vulsArry = [];
				found = false;
				desc = (str1[1].split(':'))[1].replace("u'", "").replace("'", "").replace("'", "");
				systeminfo = {
					name: (str1[2].split(':'))[1].replace("u'", "").replace("'", ""),
					description: desc,
					//description: (desc.split('.').join('-')).split('~').join('-').replace(' ','').replace('#','').split(' ').join('-'),
					type: (str1[0].split(':'))[1].replace("u'", "").replace("'", "").replace("'", "").split(' ').join(''),
				};

				nam = str3[2].split(':')[1].replace("u'", "").replace("'", "").replace("}", "");
				//address = new ipaddr(nam);
				//console. log(nam);
				host = {
					name: nam,
					os: str3[0].split(':')[1].replace("u'", "").replace("'", "").replace("'", ""),
					description: str3[0].split(':')[1].replace("u'", "").replace("'", "").replace("'", ""),
				}
			//	console.log(systeminfo.type);
				for (i = 0; i < str2.length; i++) {
					mac = ((str2[i].split(','))[6].split(':'))[1].replace("u'", "").replace("'", "").replace("'", "");
					add = ((str2[i].split(','))[2].split(':'))[1].replace("u'", "").replace("'", "").replace("'", "").replace(' ', '');
					mas = ((str2[i].split(','))[3].split(':'))[1].replace("u'", "").replace("'", "").replace("'", "").replace(' ', '');
					//console. log(mac);
					//console.log(new ipaddr(mas));
					if (mac == ' ') {
						mac = "Indefined";
					}
					ifArr.push(
						{
							name: ((str2[i].split(','))[1].split(':'))[1].replace("u'", "").replace("'", "").replace("'", ""),
							ipaddress: add,
							mask: mas,
							adminstate: ((str2[i].split(','))[4].split(':'))[1].replace("u'", "").replace("'", "").replace("'", ""),
							operationstate: ((str2[i].split(','))[5].split(':'))[1].replace("u'", "").replace("'", "").replace("'", ""),
							mac: mac,
							type: ((str2[i].split(','))[7].split(':'))[1].replace("u'", "").replace("'", "").replace("'", "").replace("}", ""),
						}
					);
					if (found == false && ifArr[i].ipaddress != '127.0.0.1') {
						var verifyIcinga2 = is_monitored_by_icinga2(icinga2api, ifArr[i].ipaddress);
						if (verifyIcinga2[0]) {
											query = 'MATCH (d:device) WHERE ID(d) = ' + record._fields[0].identity.low + ' SET d.icinga2 = true';
											session.run(query);
											found = true;
											icinga2 = true;
										}
										}
				}
				if (found == false){
					query = 'MATCH (d:device) WHERE ID(d) = ' + record._fields[0].identity.low + ' SET d.icinga2 = false';
					session.run(query);
				}
				if (str4 != "[]") {
					str4 = (str4.replace('{', '')).replace('[', '').replace(']', '').split('},');
					for (var i = 0; i < str4.length; i++) {
						servArr.push(
							{
								status: ((str4[i].split(','))[0].split(':'))[1].replace("u'", "").replace("'", "").replace("'", ""),
								description: ((str4[i].split(','))[1].split(':'))[1].replace("u'", "").replace("'", "").replace("'", ""),
								protocol: ((str4[i].split(','))[2].split(':'))[1].replace("u'", "").replace("'", "").replace("'", ""),
								ports: ((str4[i].split(','))[3].split(':'))[1].replace("u'", "").replace("'", "").replace("'", ""),
								name: ((str4[i].split(','))[4].split(':'))[1].replace("u'", "").replace("'", "").replace("'", "").replace("}", "").replace("]", ""),
							}
						);

					}
				}

				if (str5 != "[]") {
					str5 = (str5.replace('{', '')).replace('[', '').replace(']', '').split('}, {');
					for (var i = 0; i < str5.length; i++) {
						vul = ((str5[i].split(','))[0].split(':'))[0];
						if (vul == "'website'") {
							impact = {
								integrity: ((str5[i].split(','))[1].split(':'))[2].replace("u'", "").replace("'", "").replace("'", ""),
								confidentiality: ((str5[i].split(','))[2].split(':'))[1].replace("u'", "").replace("'", "").replace("'", ""),
								availability: ((str5[i].split(','))[3].split(':'))[1].replace("u'", "").replace("'", "").replace("'", ""),
							}
							desc = (str5[i].split(','))[12].split(':');
							description = "";
							for (k = 1; k < desc.length; k++) {
								//console.log(desc[k])
								description += desc[k];
							}
							description.replace("\n", "-");
							vulsArry.push(
								{
									name: ((str5[i].split(','))[16].split(':'))[1].replace("u'", "").replace("'", "").replace("'", "").replace("}", ""),
									type: ((str5[i].split(','))[6].split(':'))[1].replace("u'", "").replace("'", "").replace("'", ""),
									//description: ((str5[i].split(','))[12].split(':'))[1],
									description: description,
									resolution: ((str5[i].split(','))[14].split(':'))[1].replace("u'", "").replace("'", "").replace("'", ""),
									impact: impact,
								}
							);
						}
						if (vul == "'impact'") {
							impact = {
								integrity: ((str5[i].split(','))[0].split(':'))[2].replace("u'", "").replace("'", "").replace("'", ""),
								confidentiality: ((str5[i].split(','))[1].split(':'))[1].replace("u'", "").replace("'", "").replace("'", ""),
								availability: ((str5[i].split(','))[2].split(':'))[1].replace("u'", "").replace("'", "").replace("'", ""),
							}
							desc = (str5[i].split(','))[8].split(':');
							description = "";
							for (k = 1; k < desc.length; k++) {
								//console.log(desc[k])
								description += desc[k].replace("u'", "").replace("'", "").replace("'", "");
							}
							description.replace("\n", " ").replace("u'", "").replace("'", "").replace("'", "");
							vulsArry.push(
								{
									name: ((str5[i].split(','))[5].split(':'))[1].replace("u'", "").replace("'", "").replace("'", "").replace("}", ""),
									type: ((str5[i].split(','))[7].split(':'))[1].replace("u'", "").replace("'", "").replace("'", ""),
									//description: ((str5[i].split(','))[8].split(':'))[1],
									description: description,
									resolution: ((str5[i].split(','))[6].split(':'))[1].replace("u'", "").replace("'", "").replace("'", ""),
									impact: impact,
								}
							);
						}
					}
				}
				devices1.push({
					id: record._fields[0].identity.low,
					sysinfo: systeminfo,
					hostinfo: host,
					interfaces: ifArr,
					services: servArr,
					vuls: vulsArry,
					icinga2 : icinga2,
					icinga2name : verifyIcinga2[1],
				}
				);
				console.log(devices1[0].icinga2);
			});
		})
		.catch(function (err) {
			console.log(err)

		});

	session.run('MATCH(d:device) WHERE (d.Hostinfo IS NOT NULL AND d.SystemInfo IS NULL ) RETURN DISTINCT(d) ')
		.then(function (result) {
			var icinga2 = false;
			result.records.forEach(function (record) {
				str3 = record._fields[0].properties.Hostinfo[0].split(',');
				str4 = record._fields[0].properties.Services[0];
				str5 = record._fields[0].properties.Vuls[0];
				str6 = record._fields[0].properties.InterfacesScan[0].split(',');
				servArr = [];
				vulsArry = [];
				//nam = str3[2].split(':')[1].replace("u'","").replace("'","").replace("}","").replace(' ','').replace('.','-').replace('.','-').replace('.','-');
				nam = str3[2].split(':')[1].replace("u'", "").replace("'", "").replace("}", "").replace(' ', '');
				if (str4 != "[]") {
					str4 = (str4.replace('{', '')).replace('[', '').replace(']', '').split('},');
					for (var i = 0; i < str4.length; i++) {
						servArr.push(
							{
								status: ((str4[i].split(','))[0].split(':'))[1].replace("u'", "").replace("'", ""),
								description: ((str4[i].split(','))[1].split(':'))[1].replace("u'", "").replace("'", ""),
								protocol: ((str4[i].split(','))[2].split(':'))[1].replace("u'", "").replace("'", ""),
								ports: ((str4[i].split(','))[3].split(':'))[1].replace("u'", "").replace("'", "").replace("[", "").replace("]", ""),
								name: ((str4[i].split(','))[4].split(':'))[1].replace("u'", "").replace("'", "").replace("}", "").replace("]", ""),
							}
						);

					}
				}

				if (str5 != "[]") {
					str5 = (str5.replace('{', '')).replace('[', '').replace(']', '').split('}, {');
					for (var i = 0; i < str5.length; i++) {
						vul = ((str5[i].split(','))[0].split(':'))[0];
						if (vul == "'website'") {
							impact = {
								integrity: ((str5[i].split(','))[1].split(':'))[2].replace("u'", "").replace("'", ""),
								confidentiality: ((str5[i].split(','))[2].split(':'))[1].replace("u'", "").replace("'", ""),
								availability: ((str5[i].split(','))[3].split(':'))[1].replace("u'", "").replace("'", ""),
							}
							desc = (str5[i].split(','))[12].split(':');
							description = "";
							for (k = 1; k < desc.length; k++) {
								//console.log(desc[k])
								description += desc[k];
							}
							description.replace("\n", " ").replace("u'", "").replace("'", "");
							vulsArry.push(
								{
									name: ((str5[i].split(','))[16].split(':'))[1].replace("u'", "").replace("'", "").replace("}", ""),
									type: ((str5[i].split(','))[6].split(':'))[1].replace("u'", "").replace("'", ""),
									//description: ((str5[i].split(','))[12].split(':'))[1],
									description: description,
									resolution: ((str5[i].split(','))[14].split(':'))[1].replace("u'", "").replace("'", ""),
									impact: impact,
								}
							);
						}
						if (vul == "'impact'") {
							impact = {
								integrity: ((str5[i].split(','))[0].split(':'))[2].replace("u'", "").replace("'", ""),
								confidentiality: ((str5[i].split(','))[1].split(':'))[1].replace("u'", "").replace("'", ""),
								availability: ((str5[i].split(','))[2].split(':'))[1].replace("u'", "").replace("'", ""),
							}
							desc = (str5[i].split(','))[8].split(':');
							description = "";
							for (k = 1; k < desc.length; k++) {
								//console.log(desc[k])
								description += desc[k];
							}
							description.replace("\n", " ").replace("u'", "").replace("'", "");
							vulsArry.push(
								{
									name: ((str5[i].split(','))[5].split(':'))[1].replace("u'", "").replace("'", "").replace("}", ""),
									type: ((str5[i].split(','))[7].split(':'))[1].replace("u'", "").replace("'", ""),
									//description: ((str5[i].split(','))[8].split(':'))[1],
									description: description,
									resolution: ((str5[i].split(','))[6].split(':'))[1].replace("u'", "").replace("'", ""),
									impact: impact,
								}
							);
						}
					}
				}
				Interfaces = {
					network_segment: str6[0].split(':')[1].replace("u'", "").replace("'", ""),
					description: str6[1].split(':')[1].replace("u'", "").replace("'", ""),
					//mask: str6[2].split(':')[1].replace("u'","").replace("'","").replace('.','-').replace('.','-').replace('.','-'),
					mask: str6[2].split(':')[1].replace("u'", "").replace("'", ""),
					mac: str6[3].split(':')[1].replace("u'", "").replace("'", "").replace("'", ""),
					hostnames: str6[4].split(':')[1].replace("u'", "").replace("'", ""),
					//address: str6[5].split(':')[1].replace("u'","").replace("'","").replace('.','-').replace('.','-').replace('.','-'),
					address: str6[5].split(':')[1].replace("u'", "").replace("'", "").split(' ').join(''),
					type: str6[6].split(':')[1].replace("u'", "").replace("'", ""),
					//gateway: str6[7].split(':')[1].replace('}','').replace("u'","").replace("'","").replace('.','-').replace('.','-').replace('.','-'),
					gateway: str6[7].split(':')[1].replace('}', '').replace("u'", "").replace("'", ""),
				};
				if (Interfaces.address != '127.0.0.1') {
					var verifyIcinga2 = is_monitored_by_icinga2(icinga2api, Interfaces.address);
						if (verifyIcinga2[0]){
						query = 'MATCH (d:device) WHERE ID(d) = ' + record._fields[0].identity.low + ' SET d.icinga2 = true';
						session.run(query);
						icinga2= true;
					}else{
					query = 'MATCH (d:device) WHERE ID(d) = ' + record._fields[0].identity.low + ' SET d.icinga2 = false';
					session.run(query);
				}
				}
				
				devices2.push({
					id: record._fields[0].identity.low,
					hostinfo: {
						name: nam,
						os: str3[0].split(':')[1].replace("u'", "").replace("'", "").replace("'", ""),
						description: str3[0].split(':')[1].replace("u'", "").replace("'", "").replace("'", ""),
						//os : str3[0].split(':')[1].replace("u'","").replace("'","").replace("'","").replace(' ','').split(' ').join('-').split('.').join('-'),
						//description: str3[0].split(':')[1].replace("u'","").replace("'","").replace("'","").replace(' ','').split(' ').join('-').split('.').join('-'),
						//os : str3[0].split(':')[1].replace("u'","").replace("'",""),
						//description: str3[0].split(':')[1].replace("u'","").replace("'",""),
					},
					interfaces: Interfaces,
					services: servArr,
					vuls: vulsArry,
					icinga2 : icinga2,
					icinga2name: verifyIcinga2[1]
				}
				);

			});
		})
		.catch(function (err) {
			console.log(err)

		});


	session.run('MATCH(d:device) WHERE (d.Hostinfo IS NULL AND d.SystemInfo IS NOT NULL ) RETURN DISTINCT(d) ')
		.then(function (result) {
			var icinga2 = false;
			result.records.forEach(function (record) {
				str1 = (((record._fields[0].properties.SystemInfo[0]).replace('{', '')).replace('}', '')).split(',');
				str2 = (record._fields[0].properties.InterfacesSnmp[0].replace('{', '')).replace('[', '').replace(']', '').split('},');
				ifArr = [];
				found = false;
				for (i = 0; i < str2.length; i++) {
					ifArr.push(
						{
							name: ((str2[i].split(','))[1].split(':'))[1].replace("u'", "").replace("'", ""),
							//ipaddress: ((str2[i].split(','))[2].split(':'))[1].replace("u'","").replace("'","").replace('.','-').replace('.','-').replace('.','-'),
							ipaddress: ((str2[i].split(','))[2].split(':'))[1].replace("u'", "").replace("'", ""),
							//mask : ((str2[i].split(','))[3].split(':'))[1].replace("u'","").replace("'","").replace('.','-').replace('.','-').replace('.','-'),
							mask: ((str2[i].split(','))[3].split(':'))[1].replace("u'", "").replace("'", ""),
							adminstate: ((str2[i].split(','))[4].split(':'))[1].replace("u'", "").replace("'", ""),
							operationstate: ((str2[i].split(','))[5].split(':'))[1].replace("u'", "").replace("'", ""),
							mac: ((str2[i].split(','))[6].split(':'))[1].replace("u'", "").replace("'", ""),
							type: ((str2[i].split(','))[7].split(':'))[1].replace("u'", "").replace("'", ""),
						}
					);
					if (found == false && ifArr[i].ipaddress !== '127.0.0.1') {
						//console.log("verfi2****");
						var verifyIcinga2 = is_monitored_by_icinga2(icinga2api, ifArr[i].ipaddress);
						if (verifyIcinga2[0]){
							console.log("It is found 2 hhhh ");
							query = 'MATCH (d:device) WHERE ID(d) = ' + record._fields[0].identity.low + ' SET d.icinga2 = true';
							session.run(query);
							found = true;
							icinga2=true;
						}
					}
				}
				if (found == false){
					query = 'MATCH (d:device) WHERE ID(d) = ' + record._fields[0].identity.low + ' SET d.icinga2 = false';
					session.run(query);
				}			
				devices3.push({
					id: record._fields[0].identity.low,
					systeminfo: {
						name: (str1[2].split(':'))[1].replace("u'", "").replace("'", ""),
						description: (str1[1].split(':'))[1].replace("u'", "").replace("'", ""),
						type: (str1[0].split(':'))[1].replace("u'", "").replace("'", ""),
					},
					interfaces: ifArr,
					icinga2 : icinga2,
					icinga2name: verifyIcinga2[1]
				}
				);
			});
		})
		.catch(function (err) {
			console.log(err)

		});

	session.run('MATCH(d:device) WHERE (d.address IS NOT NULL AND d.mac IS NOT NULL ) RETURN DISTINCT(d)')
		.then(function (result) {
			var icinga2 = false;
			result.records.forEach(function (record) {
				address = String(record._fields[0].properties.address);
				//console.log(address.split('.').join('-'));
				//console.log(String(address));
				if (address !== '127.0.0.1') {
					var verifyIcinga2 = is_monitored_by_icinga2(icinga2api, address);
					if (verifyIcinga2[0]){
						query = 'MATCH (d:device) WHERE ID(d) = ' + record._fields[0].identity.low + ' SET d.icinga2 = true';
						session.run(query);
						icinga2 = true;
					}else{
					query = 'MATCH (d:device) WHERE ID(d) = ' + record._fields[0].identity.low + ' SET d.icinga2 = false';
					session.run(query);
				}
				}
				//console.log("/********"+ verifyIcinga2[1]);
				devices4.push({
					id: record._fields[0].identity.low,
					address: address,
					mac: String(record._fields[0].properties.mac),
					icinga2: icinga2,
					icinga2name: verifyIcinga2[1]
					//address: address.split('.').join('-'),
					//mac: String(record._fields[0].properties.mac),
				}
				);

			});
			res.render('index', {
				links: linkArr,
				//devices : deviceArr
				snmp_scan_dev: devices1,
				scan_dev: devices2,
				snmp_dev: devices3,
				rest_dev: devices4,
			});
		})
		.catch(function (err) {
			console.log(err)

		});

			 //return(icinga2api);
    	}else{
		console.log(error);
		}
		} 
	
		 )
	
});

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		//req.flash('error_msg','You are not logged in');
		res.redirect('/users/login');
		//res.render('login');
		}
}

module.exports = router;

