// PJ EVENTS FUNCTION
	function changeBlock(blockActive, code){
		// press "p" to go to next block, press "o" to do to previous block
		var nextKey = 112;
		var prevKey = 111; 

		var numBlocks = $('.content').length;
		var direction ; 
		if(code == nextKey){
			direction = "next";
		}

		if(code == prevKey){
			direction = "prev";
		}
		
		socket.emit('changeBlock', {
			"currentProject" : currentProject,
			"currentBlock" : blockActive,
			"direction": direction, 
			"numBlocks":numBlocks
		});
	}

	function moveBlock(blockActive, code){

		//press "q" to move image on the right
		var right = 113;
		//press "a" to move image on the left
		var left = 97; 
		//press "w" to move image down
		var down = 119;
		//press "s" to move image up
		var up = 115;

		var blockActive = $(".active-pj").attr('data-folder');
		var numBlocks = $('.content').length;
		var direction; 
		if(code == right){
			direction = "right";
		}
		if(code == left){
			direction = "left";
		}
		if(code == up){
			direction = "up";
		}
		if(code == down){
			direction = "down";
		}
		
		if(code == right || code == left ||code == up ||code == down ){
			socket.emit('moveBlock', {
				"currentProject" : currentProject,
				"currentBlock" : blockActive,
				"direction": direction, 
				"numBlocks":numBlocks
			});
		}
	}

	function zoomBlock(blockActive, code){
		//zoomIn press "u"
		var zoomInKey = 117; 
		//zoomOut press "space"
		var zoomOutKey = 32; 
		var zoom; 

		if(code == zoomInKey){
			zoom = "zoomin";
		}
		
		if(code == zoomOutKey){
			zoom = "zoomout";
		}
		if(code == zoomInKey || code == zoomOutKey){
			socket.emit("zoomBlock", {
				"currentProject" : currentProject,
				"currentBlock" : blockActive,
				"zoom": zoom
			});
		}
	}

	function changeBlockSize(blockActive, code){
		// press 'i' to make Block Size smaller
		var decreaseSize = 105;
		// press 'e' to make Block Size larger
		var increaseSize = 101;
		var direction;

		if(code == decreaseSize){
			direction = "decreaseSize";
		}
		
		if(code == increaseSize){
			direction = "increaseSize";
		}

		if(code == decreaseSize || code == increaseSize){
			socket.emit("changeBlockSize", {
				"currentProject" : currentProject,
				"currentBlock" : blockActive,
				"direction": direction
			});
		}
	}

	function wordSpacing(blockActive, code){

		//press "y" to add space between each words
		var increaseKey = 121;
		//press "r" to decrease space between each words
		var decreaseKey = 114;
		var direction;

		if(code == decreaseKey){
			direction = "decreaseSpacing";
		}
		
		if(code == increaseKey){
			direction = "increaseSpacing";
		}

		if(code == decreaseKey || code == increaseKey){
			socket.emit("changeWordSpacing", {
				"currentProject" : currentProject,
				"currentBlock" : blockActive,
				"direction": direction
			});
		}
	}

	function generatePDF(code){

		// press "t" to generate pdf
		var pdf = 116;
		var currentUrl = window.location.href ; 

		if(code == pdf){
			socket.emit('generate', {
				"currentUrl": currentUrl,
				"currentProject" : currentProject
			});							
		}
		
	}

// Additional functions you could use
	function changeFont(blockActive, code){
		var fonts = ["aileron", "fira", "inknut", "nanook", "reglo", "roboto", "terminal", "vollkorn"];
		
		// press "n" to shuffle fonts
		var shuffle = 110;
		var randomFont;

		if(code == shuffle){
			randomFont = fonts[Math.floor(Math.random() * fonts.length)];
			console.log(randomFont);
		}

		socket.emit('changeFont', {
			"currentProject" : currentProject,
			"currentBlock" : blockActive,
			"font": randomFont, 
		});
	}
