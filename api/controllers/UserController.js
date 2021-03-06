/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var os = require('os');
var exec = require('child_process').exec;

// function getAllInfo(session_info){
	// var totalCost=0;
	// for (var i=1;i<latest_diameters.length+1;i++){
		// totalCost+= (listVariableLinks[i-1]['Length']*nytCosts[parseInt(session_info[i])]);
	// }
	// var nbNegNodes=0;
	// var totalNegPSI=0;
	// var mcnt=1;
	// for (var i=22;i<session_info.length-1;i++){	
		// if (listNodes[mcnt] && listNodes[mcnt].hasOwnProperty('initialPressure')){		
			// //listNodes[mcnt]['initialPressure']=parseFloat(latest_pressures_raw[i]);
			// var tmp =(parseFloat(session_info[i])-listNodes[mcnt]['minimumPressure']);
			// if (tmp<0){
				// nbNegNodes+=1;
				// totalNegPSI+=tmp;
			// }
		// }
		// mcnt+=1;
	// }
	// return [totalCost, nbNegNodes, totalNegPSI]
// }

module.exports = {

  /**
   * Check the provided email address and password, and if they
   * match a real user in the database, sign in to Activity Overlord.
   */
  login: function (req, res) {

    // Try to look up user using the provided email address
    User.findOne({
      email: req.param('email')
    }, function foundUser(err, user) {
      if (err) return res.negotiate(err);
      if (!user) return res.notFound();

      // Compare password attempt from the form params to the encrypted password
      // from the database (`user.password`)
      require('machinepack-passwords').checkPassword({
        passwordAttempt: req.param('password'),
        encryptedPassword: user.encryptedPassword
      }).exec({

        error: function (err){
          return res.negotiate(err);
        },

        // If the password from the form params doesn't checkout w/ the encrypted
        // password from the database...
        incorrect: function (){
          return res.notFound();
        },

        success: function (){
          // Store user id in the user session
          req.session.me = user.id;
	  //return res.ok();
	  return res.view('homepage', {
	    id: user.id
	  });
        }
	
      });
    });

  },

  update: function (req, res,next) {
    if (!req.isSocket) {return res.badRequest();}
	console.log("update stuff happened!!!")
	sails.sockets.join(req, 'funSockets');
	//sails.sockets.broadcast('funSockets', 'hello', req);
	//console.log(req.body)
	//var sessions = req.body['history']['sessions'];
	//var best_recorded_price=23000000;
	//var best_recorded_pressure=23000000;
	
	
	if (req.body['history']['sessions'].length>0){
		sails.sockets.broadcast("funSockets", "hello", {name:req.body['name'], history: req.body['history']['sessions']});
		
		//if ()
	}
	
  },

  change: function (req, res,next) {
    if (req.session.me) {
		//var userObj = {
		//	//  name: req.param('name'),
		//	//  email: req.param('email'),
		//	history: req.param('history'),
			
		
		var parameters= req.param('history');
		
		var myos = os.type();
		var typos=0;
		if (myos.substring(0,3)=="Win"){
			typos=0;
		}
		else if (myos.substring(0,3)=="Dar"){
			typos=1;
		}
		else if (myos.substring(0,3)=="Lin"){
			typos=2;
		}
		else{
			typos=3;
		}
		//sails.log(typos);
		var fname;  
		if (typos==0){
			fname = 'assets\\game-engine';
		}
		else{
			fname = 'assets/game-engine';
		}
		
		var command;
		if (typos==0){
			command = 'assets\\game-engine\\cwsNYTServer.exe ' + parameters;
		}
		else{
			//command = 'assets/game-engine/cwsNYTServer.exe ' + method + ' -i ' + fname + ' -b ' + fname1 + ' -f ' + fname2 + ' -X ' + xt + ' -comment';
		}
		console.log(command)
		exec(command, function(err, stdout, stderr) {
			console.log('output:', stdout);
			console.log('stderr:', stderr);
		  
		});
    }
  },

  /**
   * Sign up for a user account.
   */
  signup: function(req, res) {

    var Passwords = require('machinepack-passwords');

    // Encrypt a string using the BCrypt algorithm.
    Passwords.encryptPassword({
      password: req.param('password'),
      difficulty: 10,
    }).exec({
      // An unexpected error occurred.
      error: function(err) {
        return res.negotiate(err);
      },
      // OK.
      success: function(encryptedPassword) {
        require('machinepack-gravatar').getImageUrl({
          emailAddress: req.param('email')
        }).exec({
          error: function(err) {
            return res.negotiate(err);
          },
          success: function(gravatarUrl) {
          // Create a User with the params sent from
          // the sign-up form --> signup.ejs
            User.create({
              name: req.param('name'),
              //title: req.param('title'),
			  history:JSON.parse(req.param('history')),
              email: req.param('email'),
              encryptedPassword: encryptedPassword,
              lastLoggedIn: new Date(),
              gravatarUrl: gravatarUrl,
			  admin: false
            }, function userCreated(err, newUser) {
              if (err) {

                console.log("err: ", err);
                console.log("err.invalidAttributes: ", err.invalidAttributes)

                // If this is a uniqueness error about the email attribute,
                // send back an easily parseable status code.
                if (err.invalidAttributes && err.invalidAttributes.email && err.invalidAttributes.email[0]
                  && err.invalidAttributes.email[0].rule === 'unique') {
                  return res.emailAddressInUse();
                }

                // Otherwise, send back something reasonable as our error response.
                return res.negotiate(err);
              }

              // Log user in
              req.session.me = newUser.id;

              // Send back the id of the new user
              return res.json({
                id: newUser.id
              });
            });
          }
        });
      }
    });
  },

  /**
   * Log out of Activity Overlord.
   * (wipes `me` from the sesion)
   */
  logout: function (req, res) {

    // Look up the user record from the database which is
    // referenced by the id in the user session (req.session.me)
    User.findOne(req.session.me, function foundUser(err, user) {
      if (err) return res.negotiate(err);

      // If session refers to a user who no longer exists, still allow logout.
      if (!user) {
        sails.log.verbose('Session refers to a user who no longer exists.');
        return res.backToHomePage();
      }

      // Wipe out the session (log out)
      req.session.me = null;

      // Either send a 200 OK or redirect to the home page
      return res.backToHomePage();

    });
  }
};
