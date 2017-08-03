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

// Prepared function for receiving data from arduino
socket.on('arduinoMove', function(data){
	sendEvent('moveBlock', data);
});
socket.on('arduinoChangeBlock', function(data){
	sendEvent('changeBlock', data);
});
socket.on('arduinoZoomBlock', function(data){
	sendEvent('zoomBlock', data);
});
socket.on('arduinoChangeBlockSize', function(data){
	sendEvent('changeBlockSize', data);
});
socket.on('arduinoChangeWordSpacing', function(data){
	sendEvent('changeWordSpacing', data);
});
socket.on('arduinoChangeFont', function(data){
	sendEvent('changeFont', data);
});
socket.on('arduinoChangeColor', function(data){
	sendEvent('changeColor', data);
});
socket.on('arduinoRotateBlock', function(data){
	sendEvent('rotateBlock', data);
});

socket.on('pdfIsGenerated', function(filepath){
	alert('The poster has been generated in PDF \n PDF path: ' + filepath);
});

(function init(){


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


function sendEvent(eventName, data){
	var blockActive = $(".active-pj").attr('data-folder');
	var numBlocks = $('.content').length;
	console.log(eventName, data);
	socket.emit(eventName, {
		"currentProject" : currentProject,
		"currentBlock" : blockActive,
		"direction": data, 
		"numBlocks":numBlocks
	});

}




