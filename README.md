# DWS_serious_game

## A new better version is now available at : https://github.com/gentr1/water-serious-game
## Please go there instead!

Serious Game for WDS Analysis, Design &amp; Evaluation -multiplayer online serious game -  three.js + sails.js + angular

Needs node.js and a mongodb server to be installed and running.
Then do npm install -g sails
Then go to folder and do npm install .
Then run sails lift to start the server so it start building the sails collections , even if it ends up giving you some data base error because the "gameworld" object is missing for the moment. Stop the server.
Then to add a new object in the database in the collection "gameworld": 
type mongo in the command line. Once in the special mongodb client command line interface, do: 

use sails
show collections
db.gameworld.insert({overallBest:{
 cost:294156055.0}, sessionBests:[]
})
Then type sails lift to run server from now on.
You can play the game if you open Chrome at localhost:1337
