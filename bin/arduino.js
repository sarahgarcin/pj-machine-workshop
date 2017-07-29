  const path = require('path'),
	moment = require('moment'),
  fs = require('fs-extra'),

  five = require("johnny-five");

  var board = new five.Board();

  var joystick = function(){
			board.on("ready", function() {
				console.log("ARDUINO READY");
				// Create a new `joystick` hardware instance.
			  var joystick = new five.Joystick({
			    //   [ x, y ]
			    pins: ["A0", "A1"]
			  });
			  var direction; 

			  joystick.on("change", function() {
			  	if(this.x > 0){
						direction = "right";
			  	}
			  	if(this.x < 0){
						direction = "left";
			  	}
			  	if(this.y < 0){
						direction = "up";
			  	}
			  	if(this.y > 0){
						direction = "down";
			  	}

			  	var data = {
			  		"direction": direction
			  	}

			  	// socket.emit('joystick', direction);
			  	// onMoveBlock(data);

			    // console.log("Joystick");
			    // console.log("  x : ", this.x);
			    // console.log("  y : ", this.y);
			    // console.log("--------------------------------------");
			    return direction;
			  });
			});

  }

module.exports = joystick;