/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#/documentation/reference/sails.config/sails.config.bootstrap.html
 */
var hound = require('hound');
var fs = require('fs');
//var os = require('os');
//var sys = require('util');
var socketIOClient = require('socket.io-client');
var sailsIOClient = require('sails.io.js');

// Instantiate the socket client (`io`)
// (for now, you must explicitly pass in the socket.io client when using this library from Node.js)
var io = sailsIOClient(socketIOClient);

// Set some options:
// (you have to specify the host and port of the Sails backend when using this library from Node.js)
io.sails.url = 'http://localhost:1337';

module.exports.bootstrap = function(cb) {

	var watcher = hound.watch('output');

	watcher.on('create', function(file, stats) {
	  var fn = file.split('\\').pop().split('/').pop();
		if (fn.endsWith('.out')){
			var fname= file.split('\\').pop().split('/').pop().split('.out')[0];
			console.log(fname+ ' was created');

			User.findOne({
				name:fname
			}).exec(function (err, myuser){
				if (err) {
					sails.log(err);
				}
				if (!myuser) {
					sails.log('Could not find user, sorry.');
				}
				else{
					//sails.log('Found "%s"', myuser);
					if (myuser.history){
					  //sails.log('Found "%s"', myuser.history);
					  fs.readFile(file, 'utf8', function (err, file_data) {
						  // Print the contents of the file as a string here
						  // and do whatever other string processing you want
						  var lines =file_data.split('\n');
						  var new_session={'sessions':[]}
						  for(var line = 0; line < lines.length; line++){  
						    new_session['sessions'].push(lines[line].split(' '))
						  } 
						  //console.log(new_session['sessions']);
						  //console.log(file_data);
						  User.update({name:myuser.name},{history:new_session}).exec(function afterwards(err, updated){

						    if (err) {
							sails.log(err);
						    }

						    //console.log('Updated user to have history ' + updated[0].history);
						    console.log('Updated user history ');			
						    io.socket.put('/update', {name: myuser.name ,history: new_session},function gotResponse(body, response) {
							console.log('Server sending request ot server ');
						    })
					
						  });
			
					  });
					}
					else{
					  sails.log('"%s" has no history', myuser.name);
					}
				}

			});
		}
	})

	watcher.on('change', function(file, stats) {
	  //console.log(file + ' was changed');
	 
	  var fn = file.split('\\').pop().split('/').pop();
		if (fn.endsWith('.out')){
			var fname= file.split('\\').pop().split('/').pop().split('.out')[0];
			console.log(fname+ ' was updated');

			User.findOne({
				name:fname
			}).exec(function (err, myuser){
				if (err) {
					sails.log(err);
				}
				if (!myuser) {
					sails.log('Could not find user, sorry.');
				}
				else{
					//sails.log('Found "%s"', myuser);
					if (myuser.history){
					  //sails.log('Found "%s"', myuser.history);
					  fs.readFile(file, 'utf8', function (err, file_data) {
						  // Print the contents of the file as a string here
						  // and do whatever other string processing you want
						  var lines =file_data.split('\n');
						  var new_session={'sessions':[]}
						  for(var line = 0; line < lines.length; line++){  
						    new_session['sessions'].push(lines[line].split(' '))
						  } 
						  //console.log(new_session['sessions']);
						  //console.log(file_data);
						  User.update({name:myuser.name},{history:new_session}).exec(function afterwards(err, updated){

						    if (err) {
							sails.log(err);
						    }

						    //console.log('Updated user to have history ' + updated[0].history);
						    console.log('Updated user history ');			
						    io.socket.put('/update', {name: myuser.name , history: new_session},function gotResponse(body, response) {
							console.log('Server sending request ot server ');
						    })
					
						  });
			
					  });
					}
					else{
					  sails.log('"%s" has no history', myuser.name);
					}
				}

			});
		}
	})
  // It's very important to trigger this callback method when you are finished
  // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
  cb();
};
