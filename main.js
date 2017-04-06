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

    // add client in room
		socket.on('room', function(room) {
        socket.join(room);
    });

    // List all the blocks
		socket.on( 'listFiles', function (data){ onListBlocks(data, socket); });

    // Load CSS when start
    socket.on('loadCSS', function (data){ onLoadCSS(data, socket)});

    // functions on blocks
    socket.on('loadBlockData', onLoadBlockData);
    socket.on('newMdContent', onNewMdContent);

    socket.on('newCssContent', onNewCssContent);
		

    // Pj machine function 
    socket.on('changeBlock', function (data){onChangeBlock(data, socket)});
    socket.on('moveBlock', onMoveBlock);
    socket.on('zoomBlock', onZoomBlock);
    socket.on('changeBlockSize', onChangeBlockSize);


		socket.on('increaseWordSpacing', onIncreaseWordSpacing);
		socket.on('decreaseWordSpacing', onDecreaseWordSpacing);
		
		socket.on('changeFont', onChangeFont);
		socket.on('removeFont', onRemoveFont);

		

		socket.on('reset', function(){onReset(socket)});

		socket.on('generate', generatePDF);
    socket.on('generatePDFfromHTML', generatePDFfromHTML);

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

    function onLoadCSS(data, socket){
      api.readConfMeta(data.currentProject).then(function(posterData){
        socket.emit('cssLoaded', posterData);
      });
    }

  	function onNewBlock(blockData){
  		createNewBlock(blockData).then(function(newpdata) {
        console.log('newpdata: '+newpdata);
        sendEventWithContent('blockCreated', newpdata, 'room', blockData.currentProject);
      }, function(errorpdata) {
        console.error("Failed to create a new folder! Error: ", errorpdata);
      });
  	}

    function onLoadBlockData(data){
      var pathToRead = api.getContentPath(data.currentProject);
      var folderMetaData = getFolderMeta( data.dataFolder, pathToRead);
      sendEventWithContent( 'BlockData', folderMetaData, 'room', data.currentProject);
    }

    function onNewMdContent(data){
      console.log( "EVENT - onNewMdContent");
      var pathToRead = path.join(data.currentProject, data.currentBlock);
      var newData = {
        'content': data.newMdContent,
      }

      updateFolderMeta(newData, pathToRead).then(function( currentDataJSON) {
        console.log(currentDataJSON);
        sendEventWithContent('updatePoster', currentDataJSON, 'room', data.currentProject);
      }, function(error) {
        console.error("Failed to update a folder! Error: ", error);
      });

    }

    function onNewCssContent(data){
      console.log( "EVENT - onNewCssContent", data.newCSSContent);

      var newData = {
        'css': data.newCSSContent,
      }

      updateFolderMeta(newData, data.currentProject).then(function( currentDataJSON) {
        console.log(currentDataJSON);
        sendEventWithContent('cssLoaded', newData, 'room', data.currentProject);
      }, function(error) {
        console.error("Failed to update a folder! Error: ", error);
      });

      // io.sockets.emit('cssContent', data.newCSSContent);
    }

// ------

  // P J   M A C H I N E

  function onChangeBlock(data, socket){
    console.log('EVENT - Change Block ', data);
    var blockToGo = parseInt(data.currentBlock);
    console.log(blockToGo);
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
    console.log(blockToGo);
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
      console.log(currentDataJSON);
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
    
    if(data.zoom == "zoomin"){
      var newZoom = zoomIn(parseFloat(folderMetaData.zoom));
      newData = {
        'zoom': newZoom,
      }
    }
    if(data.zoom == "zoomout"){
      var newZoom = zoomOut(parseFloat(folderMetaData.zoom));
      newData = {
        'zoom': newZoom,
      } 
    }

    updateFolderMeta(newData, blockPath).then(function( currentDataJSON) {
      console.log(currentDataJSON);
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
  					"blockSize": 20,
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

	// function onChangeBlockSize(data){
	// 	console.log("ON CHANGE BLOCK SIZE");
		
	// 	var newBlockSize = changeSizeFunction(parseFloat(data.blockSize));

 //    var newData = {
 //    	'blockSize': newBlockSize, 
 //    	"slugFolderName" : data.slugFolderName
 //    }

 //    updateFolderMeta(newData).then(function( currentDataJSON) {
 //      sendEventWithContent( 'changeBlockSizeEvents', currentDataJSON);
 //    }, function(error) {
 //      console.error("Failed to update a folder! Error: ", error);
 //    });
	// }

	// function changeSizeFunction(size){
	// 	var maxBlockSize = 29;
	// 	var minBlockSize = 3;
	// 	var sizeStep = 1;
	  
	//   if(size > maxBlockSize){
	//   	size = minBlockSize;
	//   }
	//   else{ 
	//   	size += sizeStep;
	//   }
	//   return size;
	// }

// -------  E N D      C H A N G E   B L O C K   S I Z E    F U N C T I O N S -----------

//------------- PDF -------------------

  function generatePDF() {
    console.log('EVENT - pdfIsGenerating');
    io.sockets.emit('pdfIsGenerating');
    // var htmlPath = pdfFolderPath+'/'+date+'.html';

    // fs.writeFile('htmlPath', data.html, function(err) {
    //   if (err) return( err);
    //   else{console.log('html print file has been writen')}
    // });
    //exportPubliToPDF.exportPubliToPDF( socket, data, io);
  }

  function generatePDFfromHTML(data){
    console.log('EVENT - generate pdf');
    var date = api.getCurrentDate();
    var htmlPath = pdfFolderPath+'/'+date+'.html';
    var filePath = pdfFolderPath+'/'+date+'.pdf';

    fs.writeFile(htmlPath, data.html, function(err) {
      if (err) return( err);
      else{
        console.log('html print file has been writen');
        phantom.create([
          '--ignore-ssl-errors=yes',
          '--ssl-protocol=any', 
          '--load-images=yes',
          '--local-to-remote-url-access=yes'
          ]).then(function(ph) {
            ph.createPage().then(function(page) {
              page.open(htmlPath).then(function(status) {
                console.log(status);
                page.property('content').then(function(content) {
                  setTimeout(function(){
                    page.render(filePath).then(function() {
                      console.log('success');
                      //io.sockets.emit('pdfIsGenerated');
                      page.close();
                      ph.exit();
                    });
                  }, 2000);
                });
              });
            });
          });
      }
    });
  }

  // function generatePdf(currentUrl){  
  //   console.log('EVENT - generate pdf');
  //   var date = api.getCurrentDate();
  //   var url = path.join(currentUrl, "print");
  //   var filePath = pdfFolderPath+'/'+date+'.pdf';

  //   phantom.create([
  //   '--ignore-ssl-errors=yes',
  //   '--ssl-protocol=any', 
  //   '--load-images=yes',
  //   '--local-to-remote-url-access=yes'
  //   ]).then(function(ph) {
  //     ph.createPage().then(function(page) {
  //       page.open(url).then(function(status) {
  //         console.log(status);
  //         page.property('content').then(function(content) {
  //           setTimeout(function(){
  //             page.render(filePath).then(function() {
  //               console.log('success');
  //               //io.sockets.emit('pdfIsGenerated');
  //               page.close();
  //               ph.exit();
  //             });
  //           }, 2000);
  //         });
  //       });
  //     });
  //   });

    

  //   // phantom.create([
  //   // '--ignore-ssl-errors=yes',
  //   // '--ssl-protocol=any', 
  //   // '--load-images=yes',
  //   // '--local-to-remote-url-access=yes'
  //   // ]).then(function(ph) {
  //   //   ph.createPage().then(function(page) {
  //   //     page.open(url)
  //   //     .then(function(){
  //   //       page.property('paperSize', {width: '40cm', height:'60cm', orientation: 'portrait'})
  //   //       .then(function() {
  //   //           return page.property('content')
  //   //           .then(function() {
  //   //             setTimeout(function(){
  //   //               page.render(filePath).then(function() {
  //   //                 console.log('success');
  //   //                 //io.sockets.emit('pdfIsGenerated');
  //   //                 page.close();
  //   //                 ph.exit();
  //   //               });
  //   //             }, 2000)
  //   //           });
  //   //       });
  //   //     });
  //   //   });
  //   // });

  // }
  
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
      var newCSS = newData.css;

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
    console.log("eventAndContentJson " + JSON.stringify( eventAndContentJson, null, 4));
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
