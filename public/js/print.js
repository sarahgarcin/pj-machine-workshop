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
//socket.on('pdfIsGenerating', onPdfIsGenerating);


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



