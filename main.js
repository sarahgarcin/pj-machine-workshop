const fs = require('fs-extra'),
	junk = require('junk'),
	glob = require("glob"),
	moment = require('moment'),
	path = require("path"),
	exec = require('child_process').exec,
	parsedown = require('woods-parsedown'),
	phantom = require('phantom'),
	slugg = require('slugg'), 
  five = require("johnny-five");

  var board = new five.Board();

	const
	  settings  = require('./content/settings.js'),
	  api = require('./bin/api')
	;

	var readPageSettings = fs.readFileSync('./content/page.json', 'utf-8');
	var pageSettings = JSON.parse(readPageSettings);
  var widthPrintPage = pageSettings.page.widthPage.replace("cm", "");
  var heightPrintPage = pageSettings.page.heightPage.replace("cm", "");


	var chapterFolder = settings.folder;
	var contentFolder = "content/";
	var pdfFolderPath = contentFolder+'/pdf';
	console.log(pdfFolderPath);

module.exports = function(app, io){

	console.log("main module initialized");
	
	io.on("connection", function(socket){
   
    board.on("ready", function(socket) { // Call arduino board
      console.log("--- ARDUINO READY ---- ");
      
      // write your arduino functions here
      arduinoJoystick();

    });

    // add client in room
		socket.on('room', function(room) {
        socket.join(room);
    });

    // List all the blocks
		socket.on( 'listFiles', function (data){ onListBlocks(data, socket); });

    // Pj machine function 
    socket.on('changeBlock', function (data){onChangeBlock(data, socket)});
    socket.on('moveBlock', onMoveBlock);
    socket.on('zoomBlock', onZoomBlock);
    socket.on('changeBlockSize', onChangeBlockSize);
    socket.on('changeWordSpacing', onChangeWordSpacing);
    socket.on('changeFont', onChangeFont);
    socket.on('changeColor', onChangeColor);
    socket.on('rotateBlock', onRotateBlock);


		socket.on('generate', generatePDF);

    // PDF
    socket.on('listPDF', function(){listPDF(socket)});

	});

// ------------- A R D U I N O  -------------
  function arduinoJoystick(){
    // Create a new `joystick` hardware instance.
    var joystick = new five.Joystick({
      //   [ x, y ]
      pins: ["A0", "A1"]
    });
    var direction; 

    // Detect when joystick changes
    joystick.on("change", function(socket) {
     
      if(this.x == 1){
        direction = "right";
      }
      else if(this.x == -1){
        direction = "left";
      }
      else if(this.y < -0.97){
        direction = "up";
      }
      else if(this.y == 1){
        direction = "down";
      }
      else{
        direction = undefined;
      }

      // Send data only if there is a direction
      if(data.direction == "up" || data.direction == "down" || data.direction == "left" || data.direction == "right" ){
        // send json data up / down / left / right
        io.sockets.emit("arduinoMove", direction);
      }
    });
  }

// ------------- F U N C T I O N S -------------------

  // P O S T E R   P A G E 
  	function onListBlocks(data, socket){
  		console.log( "EVENT - onListFolders");
      var pathToRead = api.getContentPath(data.currentProject);

      listAllFolders(pathToRead).then(function( allFoldersData) {
      	//console.log(allFoldersData)
        sendEventWithContent( 'displayPageEvents', allFoldersData, socket);
      }, function(error) {
        console.error("Failed to list folders! Error: ", error);
      });
  	}



// ------

// P J   M A C H I N E

  function onChangeBlock(data, socket){
    //console.log('EVENT - Change Block ', data);
    var blockToGo = parseInt(data.currentBlock);
    //console.log(blockToGo);
    if(data.direction == "prev" && data.currentBlock != "1"){
      blockToGo --;
    }  
    if(data.direction == "prev" && data.currentBlock == "1"){
      blockToGo = data.numBlocks - 1;
    } 
    if(data.direction == "next" && data.currentBlock != (data.numBlocks -1)){
      blockToGo ++;
    } 
    if(data.direction == "next" && data.currentBlock == (data.numBlocks-1)){
      blockToGo = 1;
    } 
    //console.log(blockToGo);
    sendEventWithContent( 'blockChanged', blockToGo, 'room', data.currentProject);
  }

  function onMoveBlock(data){
    console.log('EVENT - Move Block ', data);
    var xStep = settings.xStep;
    var yStep = settings.yStep;
    var newX, newY, newData;

    var pathToRead = api.getContentPath(data.currentProject);
    var folderMetaData = getFolderMeta( data.currentBlock, pathToRead);
    var blockPath = path.join(data.currentProject, data.currentBlock);
    
    console.log(folderMetaData);
    
    if(data.direction == "up"){
      newY = parseFloat(folderMetaData.yPos) - yStep;
      newData = {
        'yPos': newY,
      }
    }
    if(data.direction == "down"){
      newY = parseFloat(folderMetaData.yPos) + yStep; 
      newData = {
        'yPos': newY,
      }  
    }
    if(data.direction == "left"){
      newX = parseFloat(folderMetaData.xPos) - xStep;
      newData = {
        'xPos': newX,
      }
    }
    if(data.direction == "right"){
      newX = parseFloat(folderMetaData.xPos) + xStep;
      newData = {
        'xPos': newX,
      }
    }

    updateFolderMeta(newData, blockPath).then(function( currentDataJSON) {
      //console.log(currentDataJSON);
      sendEventWithContent('updateBlock', currentDataJSON, 'room', data.currentProject);
    }, function(error) {
      console.error("Failed to move the block! Error: ", error);
    });

  }

  function onZoomBlock(data){
    console.log('EVENT - Zoom Block ', data);
    var newZoom;

    var pathToRead = api.getContentPath(data.currentProject);
    var folderMetaData = getFolderMeta( data.currentBlock, pathToRead);
    var blockPath = path.join(data.currentProject, data.currentBlock);
    
    console.log(folderMetaData);
    
    if(data.direction == "zoomin"){
      var newZoom = zoomIn(parseFloat(folderMetaData.zoom));
      newData = {
        'zoom': newZoom,
      }
    }
    if(data.direction == "zoomout"){
      var newZoom = zoomOut(parseFloat(folderMetaData.zoom));
      newData = {
        'zoom': newZoom,
      } 
    }

    updateFolderMeta(newData, blockPath).then(function( currentDataJSON) {
      //console.log(currentDataJSON);
      sendEventWithContent('updateBlock', currentDataJSON, 'room', data.currentProject);
    }, function(error) {
      console.error("Failed to zoom the block! Error: ", error);
    });

  }

  function zoomIn(zoom){
    var maxZoom = settings.maxZoom,
        zoomStep = settings.zoomStep;
    
    if(zoom > maxZoom){
      zoom = zoom;
    }
    else{ 
      zoom += zoomStep;
    }
    return zoom;
  }

  function zoomOut(zoom){
    var minZoom = settings.minZoom, 
        zoomStep = settings.zoomStep;

    if(zoom < minZoom) zoom = zoom; 
    else zoom -= zoomStep; 
    return zoom;
  }

  function onChangeBlockSize(data){
    console.log("EVENT - onChangeBlockSize");

    var pathToRead = api.getContentPath(data.currentProject);
    var folderMetaData = getFolderMeta( data.currentBlock, pathToRead);
    var blockPath = path.join(data.currentProject, data.currentBlock);
    
    //console.log(folderMetaData);
    
    if(data.direction == "decreaseSize"){
      var newSize = decreaseSize(parseFloat(folderMetaData.blockSize));
      newData = {
        'blockSize': newSize,
      }
    }
    if(data.direction == "increaseSize"){
      var newSize = increaseSize(parseFloat(folderMetaData.blockSize));
      newData = {
        'blockSize': newSize,
      } 
    }

    updateFolderMeta(newData, blockPath).then(function( currentDataJSON) {
      //console.log(currentDataJSON);
      sendEventWithContent('updateBlock', currentDataJSON, 'room', data.currentProject);
    }, function(error) {
      console.error("Failed to zoom the block! Error: ", error);
    });

  }

  function increaseSize(size){
    var maxBlockSize = 45,
        sizeStep = 0.5;
    
    if(size > maxBlockSize){
      size = size;
    }
    else{ 
      size += sizeStep;
    }
    console.log(size);
    return size;
  }

  function decreaseSize(size){
    var minBlockSize = 1, 
        sizeStep = 0.5;

    if(size < minBlockSize) {
      size = minBlockSize;
    }
    else {
      size -= sizeStep; 
    }
    return size;
  }

  function onChangeWordSpacing(data){
    console.log("EVENT - onChangeWordSpacing");

    var pathToRead = api.getContentPath(data.currentProject);
    var folderMetaData = getFolderMeta( data.currentBlock, pathToRead);
    var blockPath = path.join(data.currentProject, data.currentBlock);
    
    //console.log(folderMetaData);
    
    if(data.direction == "decreaseSpacing"){
      var newSpace = parseFloat(folderMetaData.wordSpace) - settings.space;
      newData = {
        'wordSpace': newSpace,
      }
    }
    if(data.direction == "increaseSpacing"){
      var newSpace = parseFloat(folderMetaData.wordSpace) + settings.space;
      newData = {
        'wordSpace': newSpace,
      } 
    }

    updateFolderMeta(newData, blockPath).then(function( currentDataJSON) {
      //console.log(currentDataJSON);
      sendEventWithContent('updateBlock', currentDataJSON, 'room', data.currentProject);
    }, function(error) {
      console.error("Failed to zoom the block! Error: ", error);
    });

  }

  function onChangeFont(data){
    console.log("EVENT - onChangeFont");

    var pathToRead = api.getContentPath(data.currentProject);
    var folderMetaData = getFolderMeta( data.currentBlock, pathToRead);
    var blockPath = path.join(data.currentProject, data.currentBlock);
    
    var newFont = data.direction;
    newData = {
        'font': newFont,
      }

    updateFolderMeta(newData, blockPath).then(function( currentDataJSON) {
      //console.log(currentDataJSON);
      sendEventWithContent('updateBlock', currentDataJSON, 'room', data.currentProject);
    }, function(error) {
      console.error("Failed to zoom the block! Error: ", error);
    });

  } 

  function onChangeColor(data){
    console.log("EVENT - onChangeColor");

    var pathToRead = api.getContentPath(data.currentProject);
    var folderMetaData = getFolderMeta( data.currentBlock, pathToRead);
    var blockPath = path.join(data.currentProject, data.currentBlock);
    
    var newColor = data.direction;
    newData = {
        'color': newColor,
      }

    updateFolderMeta(newData, blockPath).then(function( currentDataJSON) {
      //console.log(currentDataJSON);
      sendEventWithContent('updateBlock', currentDataJSON, 'room', data.currentProject);
    }, function(error) {
      console.error("Failed to zoom the block! Error: ", error);
    });

  } 

  function onRotateBlock(data){
    console.log("EVENT - onRotateBlock");

    var pathToRead = api.getContentPath(data.currentProject);
    var folderMetaData = getFolderMeta( data.currentBlock, pathToRead);
    var blockPath = path.join(data.currentProject, data.currentBlock);
    
    //console.log(folderMetaData);
    
    if(data.direction == "clockwise"){
      var newRotation = parseFloat(folderMetaData.rotation) + settings.rotationStep;
      console.log(newRotation, parseFloat(folderMetaData.rotation), settings.rotationStep);
      if(newRotation > 360){
        newRotation = 0;
      }
      newData = {
        'rotation': newRotation,
      }
    }
    if(data.direction == "counterclockwise"){
      var newRotation = parseFloat(folderMetaData.rotation) - settings.rotationStep;
      if(newRotation < 0){
        newRotation = 360 - settings.rotationStep;
      }
      newData = {
        'rotation': newRotation,
      } 
    }

    updateFolderMeta(newData, blockPath).then(function( currentDataJSON) {
      //console.log(currentDataJSON);
      sendEventWithContent('updateBlock', currentDataJSON, 'room', data.currentProject);
    }, function(error) {
      console.error("Failed to zoom the block! Error: ", error);
    });
  }


//------------- PDF -------------------

  function generatePDF(data) {
    console.log('EVENT - pdfIsGenerating');

    var date = api.getCurrentDate();
    var filePath = path.join(pdfFolderPath, data.currentProject+'-'+date+'.pdf');
    var url = path.join(data.currentUrl, 'print');
    var widthPx = widthPrintPage * 37.8;
    var heightPx = heightPrintPage * 37.8;
    console.log(widthPx + " - " + heightPx);

    phantom.create([
    '--ignore-ssl-errors=yes',
    '--ssl-protocol=any', 
    '--load-images=yes',
    '--local-to-remote-url-access=yes'
    ]).then(function(ph) {
      ph.createPage().then(function(page) {
        page.open(url)
        .then(function(){
          page.property('paperSize', {width: widthPx, height: heightPx, orientation: 'portrait'})
          .then(function() {
            return page.property('content')
            .then(function() {
              setTimeout(function(){
                page.render(filePath).then(function() {
                  console.log('success');
                  io.sockets.in(data.currentProject).emit('pdfIsGenerated', filePath);
                  page.close();
                  ph.exit();
                });
              }, 2000)
            });
          });
        });
      });
    });
  }
  
//------ E N D        P D F -------------------

 function listPDF(socket){
    console.log( "EVENT - listPDF");
    fs.readdir(path.join("content", "pdf"), (err, files) => {
      files.forEach(file => {
        console.log(file);
        sendEventWithContent( 'listAllPDF', file, socket);
      });
    })

 }

// -------------- Folders method !! ------------
	function listAllFolders(pathToRead, slugCurrentProject) {
    return new Promise(function(resolve, reject) {
  		fs.readdir(pathToRead, function (err, filenames) {
        if (err) return console.log( 'Couldn\'t read content dir : ' + err);

        var folders = filenames.filter( function(slugFolderName){ return new RegExp("^([^.]+)$", 'i').test( slugFolderName); });
  	    console.log( "Number of folders in " + settings.contentDir + " = " + folders.length + ". Folders are " + folders);

  	    var foldersProcessed = 0;
  	    var allFoldersData = [];
  		  folders.forEach( function( slugFolderName) {
  		  	console.log(slugFolderName);
  		    if( new RegExp("^([^.]+)$", 'i').test( slugFolderName) && slugFolderName != 'pdf'){
          	var fmeta = getFolderMeta( slugFolderName, pathToRead);
          	fmeta.slugFolderName = slugFolderName;
            allFoldersData.push( fmeta);
          }

          foldersProcessed++;
          if( foldersProcessed === folders.length && allFoldersData.length > 0) {
            console.log( "- - - - all folders JSON have been processed.");
            resolve( allFoldersData);
          }
  		  });
  		});
    });
	}

  function updateFolderMeta(newData, pathToRead) {
    return new Promise(function(resolve, reject) {
      console.log( "COMMON — updateFolderMeta", pathToRead);

      var newText = newData.content;
      var newIndex = newData.index;
      var newZoom = newData.zoom;
      var newXPos = newData.xPos;
      var newYPos = newData.yPos;
      var newSpace = newData.wordSpace;
      var newBlockSize = newData.blockSize;
      var newCSS = newData.css;
      var newFont = newData.font;
      var newColor = newData.color;
      var newRotation = newData.rotation;

      api.readConfMeta(pathToRead).then(function(fmeta){
        if(newText != undefined)
         fmeta.content = newText;
        if(newIndex != undefined)
         fmeta.index = newIndex;
        if(newZoom != undefined)
         fmeta.zoom = newZoom;
        if(newXPos != undefined)
         fmeta.xPos = newXPos;
        if(newYPos != undefined)
         fmeta.yPos = newYPos;
        if(newSpace != undefined)
         fmeta.wordSpace = newSpace;
        if(newBlockSize != undefined)
         fmeta.blockSize = newBlockSize;
        if(newCSS != undefined)
         fmeta.css = newCSS;
        if(newFont != undefined)
         fmeta.font = newFont;
        if(newColor != undefined)
         fmeta.color = newColor;
        if(newRotation != undefined)
         fmeta.rotation = newRotation;

        //envoyer les changements dans le JSON du folder
        api.storeData( api.getMetaFileOfConf( pathToRead), fmeta, "update").then(function( ufmeta) {
          // ufmeta.slugFolderName = slugFolderName;
          resolve( ufmeta);
        });
      });
      
    });
  }

	function storeMarkdownContent( mpath, d, e) {
    return new Promise(function(resolve, reject) {
      console.log('Will store Markdown data', mpath);
      if( e === "create") {
        fs.appendFile( mpath, d, function(err) {
          if (err) reject( err);
          resolve(d);
        });
      }
		  if( e === "update") {
        fs.writeFile( mpath, d, function(err) {
        if (err) reject( err);
          resolve(d);
        });
      }
    });
	}

  function getFolderMeta( slugFolderName, pathToRead) {
    console.log(`COMMON — getFolderMeta for ${slugFolderName}`);
    console.log(slugFolderName, pathToRead);
    var folderPath = path.join(pathToRead, slugFolderName);
    var folderMetaFile = getMetaFileOfFolder( folderPath);


    var folderData = fs.readFileSync( folderMetaFile,settings.textEncoding);
    var folderMetadata = api.parseData( folderData);

    return folderMetadata;
  }

  function getBaseFolderMeta(slugFolderName){
  	console.log( "COMMON — getBaseFolderMeta", slugFolderName);
    var folderPath = getFullBasePath( slugFolderName);
  	var folderMetaFile = getMetaFileOfFolder( folderPath);

		var folderData = fs.readFileSync( folderMetaFile, settings.textEncoding);
		var folderMetadata = api.parseData( folderData);

    return folderMetadata;

  }

	function getMetaFileOfFolder( folderPath) {
    return folderPath + '/' + settings.confMetafilename + settings.metaFileext;
  }

	// function sendEventWithContent( sendEvent, objectContent, socket) {
 //    io.sockets.emit( sendEvent,objectContent);
 //  }

	 // C O M M O N     F U N C T I O N S
  function eventAndContent( sendEvent, objectJson) {
    var eventContentJSON =
    {
      "socketevent" : sendEvent,
      "content" : objectJson
    };
    return eventContentJSON;
  }

  function sendEventWithContent( sendEvent, objectContent, socket, room) {
    var eventAndContentJson = eventAndContent( sendEvent, objectContent);
    //console.log("eventAndContentJson " + JSON.stringify( eventAndContentJson, null, 4));
    if( socket === undefined)
      io.sockets.emit( eventAndContentJson["socketevent"], eventAndContentJson["content"]);
    else if(socket === 'room'){
      io.sockets.in(room).emit(eventAndContentJson["socketevent"], eventAndContentJson["content"]);
    }
    else
      socket.emit( eventAndContentJson["socketevent"], eventAndContentJson["content"]);
  }


// - - - END FUNCTIONS - - - 
};
