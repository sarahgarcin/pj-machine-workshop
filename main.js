const fs = require('fs-extra'),
	junk = require('junk'),
	glob = require("glob"),
	moment = require('moment'),
	path = require("path"),
	exec = require('child_process').exec,
	parsedown = require('woods-parsedown'),
	phantom = require('phantom'),
	slugg = require('slugg');

	const
	  settings  = require('./content/settings.js'),
	  api = require('./bin/api')
	;

	var _ph, _page, _outObj;
	var readPageSettings = fs.readFileSync('./content/page.json', 'utf-8');
	var pageSettings = JSON.parse(readPageSettings)

	var chapterFolder = settings.folder;
	var contentFolder = "content/";
	var pdfFolderPath = contentFolder+'/pdf';
	console.log(pdfFolderPath);

module.exports = function(app, io){

	console.log("main module initialized");
	
	io.on("connection", function(socket){


		//INDEX
		socket.on('newConf', onNewConf);
		socket.on('listConf', function (data){ onListConf(socket); });

		// POSTER
		socket.on('newBlock', onNewBlock);

		//createDataFile(socket);

    // List all the blocks
		socket.on( 'listFiles', function (data){ onListBlocks(data, socket); });

    // functions on blocks
    socket.on('loadBlockData', onLoadBlockData);
    socket.on('newMdContent', onNewMdContent);
		
		socket.on('changeText', onChangeText);
		socket.on('changeTextPrev', onChangeTextPrev);

		socket.on('zoomIn', onZoomIn);
		socket.on('zoomOut', onZoomOut);
		
		socket.on('moveRight', onMoveRight);
		socket.on('moveLeft', onMoveLeft);
		socket.on('moveDown', onMoveDown);
		socket.on('moveUp', onMoveUp);


		socket.on('increaseWordSpacing', onIncreaseWordSpacing);
		socket.on('decreaseWordSpacing', onDecreaseWordSpacing);
		
		socket.on('changeFont', onChangeFont);
		socket.on('removeFont', onRemoveFont);

		socket.on('changeBlockSize', onChangeBlockSize);

		socket.on('reset', function(){onReset(socket)});

		socket.on('generate', generatePdf);

	});


// ------------- F U N C T I O N S -------------------

  // I N D E X    P A G E
    function onListConf( socket){
      console.log( "EVENT - onListConf");
      listAllFolders(api.getContentPath()).then(function( allFoldersData) {
        sendEventWithContent( 'listAllFolders', allFoldersData, socket);
      }, function(error) {
        console.error("Failed to list folders! Error: ", error);
      });
    }

  	function onNewConf( confData) {
      console.log('New Conf: ');
      console.log(confData);
      createNewConf(confData).then(function(newpdata) {
        console.log('newpdata: '+newpdata);
        sendEventWithContent('confCreated', newpdata);
      }, function(errorpdata) {
        console.error("Failed to create a new folder! Error: ", errorpdata);
        sendEventWithContent('confAlreadyExist', errorpdata);
      });
    }

  // P O S T E R   P A G E 
  	function onListBlocks(data, socket){
  		console.log( "EVENT - onListFolders");
      var pathToRead = api.getContentPath(data.currentProject);

      listAllFolders(pathToRead).then(function( allFoldersData) {
      	console.log(allFoldersData)
        sendEventWithContent( 'displayPageEvents', allFoldersData, socket);
      }, function(error) {
        console.error("Failed to list folders! Error: ", error);
      });
  	}

  	function onNewBlock(blockData){
  		createNewBlock(blockData).then(function(newpdata) {
        console.log('newpdata: '+newpdata);
        sendEventWithContent('blockCreated', newpdata);
      }, function(errorpdata) {
        console.error("Failed to create a new folder! Error: ", errorpdata);
      });
  	}

    function onLoadBlockData(data){
      var pathToRead = api.getContentPath(data.currentProject);
      var folderMetaData = getFolderMeta( data.dataFolder, pathToRead);
      sendEventWithContent( 'BlockData', folderMetaData);
    }

    function onNewMdContent(data){
      console.log( "EVENT - onNewMdContent");
      var pathToRead = path.join(data.currentProject, data.currentBlock);
      var newData = {
        'content': data.newMdContent,
      }

      updateFolderMeta(newData, pathToRead).then(function( currentDataJSON) {
        console.log(currentDataJSON);
        sendEventWithContent('updatePoster', currentDataJSON);
      }, function(error) {
        console.error("Failed to update a folder! Error: ", error);
      });

    }

// ------

	// reset 
	function onReset(socket){
		createDataFile(socket, 'reset');
	}
	
	function onChangeText(element){
		var dir = element.path;
		var arrayOfFiles = readTxtDir(dir);

		var elIndex =parseInt(element.index)
    var prevIndex = elIndex + 1;
    console.log("ON CHANGE TEXT EVENTS", prevIndex);

    if(prevIndex > arrayOfFiles.length - 1){
    	prevIndex = 0;
    }

    console.log(prevIndex, element.index, arrayOfFiles.length - 1);

    var newData = {
    	'text': arrayOfFiles[prevIndex],
    	'index': prevIndex,
    	"slugFolderName" : element.slugFolderName
    }

    updateFolderMeta(newData).then(function( currentDataJSON) {
    	console.log(currentDataJSON);
      sendEventWithContent( 'changeTextEvents', currentDataJSON);
    }, function(error) {
      console.error("Failed to update a folder! Error: ", error);
    });
	}

	function onChangeTextPrev(element){
		var dir = element.path;
		var arrayOfFiles = readTxtDir(dir);

		var elIndex =parseInt(element.index)
    var prevIndex = elIndex - 1;
    console.log("ON CHANGE TEXT EVENTS", prevIndex);

    if(prevIndex < 0){
    	prevIndex = arrayOfFiles.length - 1;
    }

    console.log(prevIndex, element.index, arrayOfFiles.length - 1);

    var newData = {
    	'text': arrayOfFiles[prevIndex],
    	'index': prevIndex,
    	"slugFolderName" : element.slugFolderName
    }

    updateFolderMeta(newData).then(function( currentDataJSON) {
    	console.log(currentDataJSON);
      sendEventWithContent( 'changeTextEvents', currentDataJSON);
    }, function(error) {
      console.error("Failed to update a folder! Error: ", error);
    });
	}

// BLOCK   FUNCTIONS
  function createNewBlock( blockData) {
    return new Promise(function(resolve, reject) {
      console.log("COMMON — createNewBlock");

      var blockName = blockData.numBlocks;
      var blockProjectPath = path.join(blockData.currentProject, blockName);
      var blockPath = api.getContentPath(blockProjectPath);
  		var currentDateString = api.getCurrentDate();

      fs.access(blockPath, fs.F_OK, function( err) {
        // if there's nothing at path
        if (err) {
          console.log("New block created with name " + blockName + " and path " + blockPath);
          fs.ensureDirSync(blockPath);//write new folder in folders
          var fmeta = {
            "path": blockPath,
  					"index" : blockName,
  					"zoom" : 1,
  					"xPos" : 0,
  					"yPos" : blockName * blockName,
  					"wordSpace" : 0, 
  					"blockSize": 8,
  					"filesNb": 1,
  					"content": "# Write Markdown"
          };
          api.storeData( api.getMetaFileOfConf(blockProjectPath), fmeta, "create").then(function( meta) {
            console.log('success ', meta);
            storeMarkdownContent( path.join(meta.path, "1.txt"), fmeta.content, "create") 
            resolve( meta);
          }, function(err) {
            console.log( gutil.colors.red('--> Couldn\'t create conf meta.'));
            reject( 'Couldn\'t create conf meta ' + err);
          });

        } else {
          // if there's already something at path
          console.log("WARNING - the following folder name already exists: " + blockName);
          var objectJson = {
            "path": blockPath,
  					"index" : 0,
  					"zoom" : 1,
  					"xPos" : 0,
  					"yPos" : 1,
  					"wordSpace" : 0, 
  					"filesNb":1,
  					"blockSize": 8,
  					"content": "# Write Markdown"
          };
          reject( objectJson);
        }
      });

    });
  }

// C O N F    F U N C T I O N S
  function createNewConf( confData) {
    return new Promise(function(resolve, reject) {
      console.log("COMMON — createNewFolder");

      var confName = confData.titre;
      var slugConfName = slugg(confName);
      var confPath = api.getContentPath(slugConfName);
      var currentDateString = api.getCurrentDate();


      fs.access(confPath, fs.F_OK, function( err) {
        // if there's nothing at path
        if (err) {
          console.log("New conf created with name " + confName + " and path " + confPath);
          fs.ensureDirSync(confPath);//write new folder in folders
          var fmeta =
            {
              "name" : confName,
              "created" : currentDateString,
            };
          api.storeData( api.getMetaFileOfConf(slugConfName), fmeta, "create").then(function( meta) {
              console.log('sucess ' + meta)
            resolve( meta);
          }, function(err) {
            console.log( gutil.colors.red('--> Couldn\'t create conf meta.'));
            reject( 'Couldn\'t create conf meta ' + err);
          });

        } else {
          // if there's already something at path
          console.log("WARNING - the following folder name already exists: " + slugConfName);
          var objectJson = {
            "name": confName,
            "timestamp": currentDateString
          };
          reject( objectJson);
        }
      });

    });
  }

// -------  Z O O M     F U N C T I O N S ----------- 
	
	function onZoomIn(data){
		console.log("ON ZOOM IN");
		var newZoom = zoomIn(parseFloat(data.zoom));
		

    var newData = {
    	'zoom': newZoom, 
    	"slugFolderName" : data.slugFolderName
    }

    updateFolderMeta(newData).then(function( currentDataJSON) {
      sendEventWithContent( 'zoomEvents', currentDataJSON);
    }, function(error) {
      console.error("Failed to update a folder! Error: ", error);
    });

	}

	function onZoomOut(data){
		console.log("ON ZOOM OUT");
		var zoom = zoomOut(parseFloat(data.zoom));

    var newData = {
    	'zoom': zoom,
    	"slugFolderName" : data.slugFolderName
    }

    updateFolderMeta(newData).then(function( currentDataJSON) {
      sendEventWithContent( 'zoomEvents', currentDataJSON);
    }, function(error) {
      console.error("Failed to update a folder! Error: ", error);
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

// -------  E N D       Z O O M     F U N C T I O N S ----------- 

// -------  M O V E     F U N C T I O N S ----------- 

	function onMoveRight(data){
		console.log("ON MOVE RIGHT");
		var xStep = settings.xStep;

		var newXPos = parseFloat(data.xPos) + xStep;

    var newData = {
    	'xPos': newXPos, 
    	"slugFolderName" : data.slugFolderName
    }

    updateFolderMeta(newData).then(function( currentDataJSON) {
      sendEventWithContent( 'moveEvents', currentDataJSON);
    }, function(error) {
      console.error("Failed to update a folder! Error: ", error);
    });

	}

	function onMoveLeft(data){
		console.log("ON MOVE RIGHT");
		var xStep = settings.xStep;

		var newXPos = parseFloat(data.xPos) - xStep;

    var newData = {
    	'xPos': newXPos, 
    	"slugFolderName" : data.slugFolderName
    }

    updateFolderMeta(newData).then(function( currentDataJSON) {
      sendEventWithContent( 'moveEvents', currentDataJSON);
    }, function(error) {
      console.error("Failed to update a folder! Error: ", error);
    });
	}

	function onMoveDown(data){
		console.log("ON MOVE RIGHT");
		var yStep = settings.yStep;

		var newYPos = parseFloat(data.yPos) + yStep;

    var newData = {
    	'yPos': newYPos, 
    	"slugFolderName" : data.slugFolderName
    }

    updateFolderMeta(newData).then(function( currentDataJSON) {
      sendEventWithContent( 'moveEvents', currentDataJSON);
    }, function(error) {
      console.error("Failed to update a folder! Error: ", error);
    });

	}

	function onMoveUp(data){
		console.log("ON MOVE RIGHT");
		var yStep = settings.yStep;

		var newYPos = parseFloat(data.yPos) - yStep;

    var newData = {
    	'yPos': newYPos, 
    	"slugFolderName" : data.slugFolderName
    }

    updateFolderMeta(newData).then(function( currentDataJSON) {
      sendEventWithContent( 'moveEvents', currentDataJSON);
    }, function(error) {
      console.error("Failed to update a folder! Error: ", error);
    });

	}

// -------  E N D       M O V E     F U N C T I O N S ----------- 

// -------  W O R D    S P A C I N G     F U N C T I O N S -----------
	
	function onIncreaseWordSpacing(data){
		console.log("ON INCREASE WORDSPACING");

		var spacePlus = settings.spacePlus;

		var newSpace = parseFloat(data.wordSpace) + spacePlus;

    var newData = {
    	'wordSpace': newSpace, 
    	"slugFolderName" : data.slugFolderName
    }

    updateFolderMeta(newData).then(function( currentDataJSON) {
      sendEventWithContent( 'wordSpacingEvents', currentDataJSON);
    }, function(error) {
      console.error("Failed to update a folder! Error: ", error);
    });

	}

	function onDecreaseWordSpacing(data){
		console.log("ON DECREASE WORDSPACING");
		var spaceMinus = settings.spaceMinus;

		var newSpace = parseFloat(data.wordSpace) - spaceMinus;

    var newData = {
    	'wordSpace': newSpace, 
    	"slugFolderName" : data.slugFolderName
    }

    updateFolderMeta(newData).then(function( currentDataJSON) {
      sendEventWithContent( 'wordSpacingEvents', currentDataJSON);
    }, function(error) {
      console.error("Failed to update a folder! Error: ", error);
    });
	}

// ------- E N D        W O R D    S P A C I N G     F U N C T I O N S -----------

// -------  C H A N G E    F O N T    F U N C T I O N S -----------

	function onChangeFont(data, word){
		console.log("ON CHANGE FONT");
		var newTextWTags = wrapInTag('span', 'change-font', word, data);
		

    var newData = {
    	'text': newTextWTags, 
    	"slugFolderName" : data.slugFolderName
    }

    updateFolderMeta(newData).then(function( currentDataJSON) {
      sendEventWithContent( 'changeFontEvents', currentDataJSON);
    }, function(error) {
      console.error("Failed to update a folder! Error: ", error);
    });
	}

	function wrapInTag(tag, className, word, data){
		var tag = tag, 
	  regex = RegExp(word, 'gi'), // case insensitive
	  classname = className || 'none',
	  replacement = '<'+ tag +' class="'+classname+'">$&</'+ tag +'>';
	  console.log(regex, replacement);

	  return data.text.replace(regex, replacement);

	}

	function onRemoveFont(data){
		console.log("ON REMOVE FONT STYLE");
		
		var tag = 'span', 
		classname = 'change-font',
		regex = RegExp('<'+ tag +' class="'+classname+'">', 'gi'), 
		spanRegex = RegExp('</'+ tag +'>', 'gi'), 
		newText = data.text.replace(regex, '').replace(spanRegex, '');
		
		console.log(newText);

    var newData = {
    	'text': newText, 
    	"slugFolderName" : data.slugFolderName
    }

    updateFolderMeta(newData).then(function( currentDataJSON) {
      sendEventWithContent( 'changeFontEvents', currentDataJSON);
    }, function(error) {
      console.error("Failed to update a folder! Error: ", error);
    });
	}

// -------  E N D      C H A N G E    F O N T    F U N C T I O N S -----------

// -------  C H A N G E    B L O C K   S I Z E   F U N C T I O N S -----------

	function onChangeBlockSize(data){
		console.log("ON CHANGE BLOCK SIZE");
		
		var newBlockSize = changeSizeFunction(parseFloat(data.blockSize));

    var newData = {
    	'blockSize': newBlockSize, 
    	"slugFolderName" : data.slugFolderName
    }

    updateFolderMeta(newData).then(function( currentDataJSON) {
      sendEventWithContent( 'changeBlockSizeEvents', currentDataJSON);
    }, function(error) {
      console.error("Failed to update a folder! Error: ", error);
    });
	}

	function changeSizeFunction(size){
		var maxBlockSize = 29;
		var minBlockSize = 3;
		var sizeStep = 1;
	  
	  if(size > maxBlockSize){
	  	size = minBlockSize;
	  }
	  else{ 
	  	size += sizeStep;
	  }
	  return size;
	}

// -------  E N D      C H A N G E   B L O C K   S I Z E    F U N C T I O N S -----------

//------------- PDF -------------------
	function generatePdf(pdf){	
		console.log('generate pdf');
		var date = api.getCurrentDate();
		var url = 'http://localhost:1337/';
		var filePath = pdfFolderPath+'/'+date+'-'+chapterFolder+'.pdf';

		phantom.create([
	  '--ignore-ssl-errors=yes',
	  '--ssl-protocol=any', 
	  '--load-images=yes',
	  '--local-to-remote-url-access=yes'
		]).then(function(ph) {
		  ph.createPage().then(function(page) {
		  	// 	page.property('clipRect',{
					//     top:    0,
					//     left:   1365,
					//     width:  1365,
					//     height: 1970
					// });
		  	page.open(url)
		  	.then(function(){
		  		// page.property('viewportSize', {width: 600, height: 	});
		  		// page.property('paperSize', {format: 'A4', orientation: 'landscape'})
		  		page.property('paperSize')
		  		// page.property('clipRect', {top: 0, left: 1000, width:3000,height:890})
		  		.then(function() {
			  		return page.property('content')
			    	.then(function() {
				      setTimeout(function(){
					      page.render(filePath).then(function() {
					      	console.log('success', pdf);
					      	// if(pdf == true){
					      		io.sockets.emit('pdfIsGenerated');
					      	// }
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

// -------------- Folders method !! ------------
	
	function readTxtDir(textDir){
    // List text
    console.log('COMMON - Read text files');
    var textArray = [];
    var arrayOfFiles = fs.readdirSync(textDir);
    var arrayOfFiles = arrayOfFiles.filter(junk.not);
    console.log(arrayOfFiles);
    arrayOfFiles.forEach( function (file) {
    	if(file != settings.confMetafilename + settings.metaFileext){
    		console.log(path.extname(file));
    		if(path.extname(file) == '.txt'){
		      var textInFile = fs.readFileSync(textDir+'/'+file, 'utf8');
		      console.log('file: '+file);
		      textArray.push(textInFile);
	      }
	    }
    });
    return textArray;
  }

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

        //envoyer les changements dans le JSON du folder
        api.storeData( api.getMetaFileOfConf( pathToRead), fmeta, "update").then(function( ufmeta) {
          // ufmeta.slugFolderName = slugFolderName;
          resolve( ufmeta);
        });
      });
      
     //  if(newText != undefined)
     //   fmeta.content = newText;
     //  if(newIndex != undefined)
     //   fmeta.index = newIndex;
     //  else
     //    fmeta.index = fmeta.index;
     //  if(newZoom != undefined)
     //   fmeta.zoom = newZoom;
     //  if(newXPos != undefined)
     //   fmeta.xPos = newXPos;
     //  if(newYPos != undefined)
     //   fmeta.yPos = newYPos;
     //  if(newSpace != undefined)
     //   fmeta.wordSpace = newSpace;
     //  if(newBlockSize != undefined)
     //   fmeta.blockSize = newBlockSize;

     // console.log(api.getMetaFileOfConf( pathToRead));

      // envoyer les changements dans le JSON du folder
      // api.storeData( api.getMetaFileOfConf( pathToRead), fmeta, "update").then(function( ufmeta) {
      //   // ufmeta.slugFolderName = slugFolderName;
      //   resolve( ufmeta);
      // });
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

	function sendEventWithContent( sendEvent, objectContent, socket) {
    io.sockets.emit( sendEvent,objectContent);
  }

	 // C O M M O N     F U N C T I O N S
  function eventAndContent( sendEvent, objectJson) {
    var eventContentJSON =
    {
      "socketevent" : sendEvent,
      "content" : objectJson
    };
    return eventContentJSON;
  }

  function sendEventWithContent( sendEvent, objectContent, socket) {
    var eventAndContentJson = eventAndContent( sendEvent, objectContent);
    console.log("eventAndContentJson " + JSON.stringify( eventAndContentJson, null, 4));
    if( socket === undefined)
      io.sockets.emit( eventAndContentJson["socketevent"], eventAndContentJson["content"]);
    else
      socket.emit( eventAndContentJson["socketevent"], eventAndContentJson["content"]);
  }


// - - - END FUNCTIONS - - - 
};
