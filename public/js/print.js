/* VARIABLES */
var socket = io.connect();

var currentFolder = app.currentFolder;
var currentProject = app.currentProject;

var converter = new showdown.Converter({'tables':true});

function onSocketConnect() {
	sessionId = socket.io.engine.id;
	console.log('Connected ' + sessionId);
	socket.emit('listFiles', {
		"currentFolder":currentFolder, 
		"currentProject" : currentProject
	});
	socket.emit('loadCSS',{"currentProject" : currentProject} );
};

function onSocketError(reason) {
	console.log('Unable to connect to server', reason);
};

/* sockets */
socket.on('connect', onSocketConnect);
socket.on('error', onSocketError);
socket.on('displayPageEvents', onDisplayPage);
socket.on('cssLoaded', onCSSLoaded);
socket.on('pdfIsGenerating', onPdfIsGenerating);


(function init(){

})();


function onDisplayPage(foldersData){
	$.each( foldersData, function( index, fdata) {
  	var $folderContent = makeFolderContent( fdata);
    return insertOrReplaceFolder( fdata.slugFolderName, $folderContent);
  });
	//console.log(foldersData);
}

function insertOrReplaceFolder( blockIndex, $folderContent) {
	// return new Promise(function(resolve, reject) {
  	$(".page-wrapper").append($folderContent);
  	return blockIndex;
  	// resolve(blockIndex);
  // });
}


function makeFolderContent( projectData){

	//console.log(projectData)
	
	var index = projectData.index;
	var folder = projectData.index;
	var blockClass = 'block' + index;

	var newFolder = $(".js--templates > .content").clone(false);

	// customisation du projet
	newFolder
	  .attr( 'data-index', index)
	  .attr( 'data-folder', folder)
	  .addClass(blockClass)
	  .css({
	  	'transform': 'scale('+projectData.zoom+')',
	  	'transform-origin': '0 0',
	  	'left': projectData.xPos+'cm',
			'top':projectData.yPos+'cm',
			'letter-spacing': projectData.wordSpace +'px', 
			'width': projectData.blockSize +'cm'
	  })

  ;

  newFolder.html(converter.makeHtml(projectData.content));
	return newFolder;
}

function onCSSLoaded(pdata){
	console.log("CSS loaded", pdata);
	$('style').html(pdata.css);
}

