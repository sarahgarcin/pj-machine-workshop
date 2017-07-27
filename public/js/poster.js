/* VARIABLES */
var socket = io.connect();

var currentFolder = app.currentFolder;
var currentProject = app.currentProject;

var converter = new showdown.Converter({'tables':true});

var scale = 0.5;


function onSocketConnect() {
	sessionId = socket.io.engine.id;
	console.log('Connected ' + sessionId);
	socket.emit('listFiles', {"currentFolder":currentFolder, "currentProject" : currentProject});
	socket.emit('room', currentProject);
};

function onSocketError(reason) {
	console.log('Unable to connect to server', reason);
};

/* sockets */
socket.on('connect', onSocketConnect);
socket.on('error', onSocketError);
socket.on('displayPageEvents', onDisplayPage);

// pj machine sockets
socket.on('blockChanged', onBlockChanged);
socket.on('updateBlock', onUpdateBlock);
socket.on('pdfIsGenerated', function(filepath){
	alert('The poster has been generated in PDF \n PDF path: ' + filepath);
});

(function init(){

	// KEY PRESS EVENTS
	$(document).on('keypress', function(e){
		var code = e.keyCode;
		console.log(code);
		var activePJBlock = $(".active-pj").attr('data-folder');
		// CALL FUNCTION YOU NEED HERE 
		// CHANGE THE KEYPRESS CODE IN EACH FUNCTION
		changeBlock(activePJBlock, code);
		moveBlock(activePJBlock, code);
		zoomBlock(activePJBlock, code);
		wordSpacing(activePJBlock, code);
		changeBlockSize(activePJBlock, code);
		changeFont(activePJBlock, code);
		changeColor(activePJBlock, code);
		rotateBlock(activePJBlock, code);
		
		generatePDF(code);

		
		e.preventDefault(); // prevent the default action (scroll / move caret)
	});


})();

function onBlockChanged(blockToGo){
	$('.content').removeClass('active-pj');
	$('.content[data-folder="'+blockToGo+'"]').addClass('active-pj');
}

function onDisplayPage(foldersData){
	$.each( foldersData, function( index, fdata) {
  	var $folderContent = makeFolderContent( fdata);
    return insertOrReplaceFolder( fdata.slugFolderName, $folderContent);
  });
	//console.log(foldersData);
}

function insertOrReplaceFolder( blockIndex, $folderContent) {
	return new Promise(function(resolve, reject) {
  	$(".page-wrapper").append($folderContent);
  	resolve(blockIndex);
  });
}




