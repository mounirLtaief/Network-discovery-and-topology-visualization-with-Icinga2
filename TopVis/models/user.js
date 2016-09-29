var neo4j = require('neo4j-driver').v1;
var driver = neo4j.driver('bolt://localhost',neo4j.auth.basic('neo4j','azerty159'));
var session = driver.session()
var bcrypt = require('bcryptjs');

// User Schema

function createUser (username, password ){
	bcrypt.genSalt(10, function(err, salt) {
	    bcrypt.hash(password, salt, function(err, hash) {
        query= 'MERGE(u:user { username:'+JSON.stringify(username)+',password:'+JSON.stringify(hash)+'})';
	      session.run(query);	        
	    });
	});
}


module.exports.comparePassword = function(candidatePassword, hash, callback){
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    	if(err) throw err;
    	callback(null, isMatch);
	});
}

module.exports.findById = function(id, cb) {
  process.nextTick(function() {
     session.run('MATCH (u:user) RETURN u').then(function(result){
        result.records.forEach(function (record) {
           if(record._fields[0].identity.low==id){
                 cb(null,{
                           id:  record._fields[0].identity.low,
                           username:  record._fields[0].properties.username,
                           password:  record._fields[0].properties.password
                         });
        }else {
          cb(new Error('User ' + id + ' does not exist'));
        }
      });
      });
  });
}
module.exports.findByUsername = function(username, cb) {
  process.nextTick(function() {
    session.run('MATCH (u:user) RETURN u').then(function(result){
      if (result.records==''){
       createUser('admin','topvis');
        query = 'MATCH (u:user) WHERE u.username =='+username+' RETURN u';
	      session.run(query).then(function(result0){
           if (result0.records==''){
             return cb(null, null);
           }else{
            return cb(null,{
              id:  result0.records[0]._fields[0].identity.low,
              username:  result0.records[0]._fields[0].properties.username,
              password:  result0.records[0]._fields[0].properties.password
            }
           );
           }
      });    
	    //});
	    //});
    }else {
    result.records.forEach(function(record) {
    if(record._fields[0].properties.username==username){
        return cb(null,{
              id:  record._fields[0].identity.low,
              username:  record._fields[0].properties.username,
              password:  record._fields[0].properties.password
            });
        }
        else{
          return cb(null, null);
        }
      });
   
    }
    });  
 });
}