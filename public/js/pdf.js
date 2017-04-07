/* VARIABLES */
var socket = io.connect();


function onSocketConnect() {
	sessionId = socket.io.engine.id;
	console.log('Connected ' + sessionId);
	socket.emit('listPDF');
};

function onSocketError(reason) {
	console.log('Unable to connect to server', reason);
};

/* sockets */
socket.on('connect', onSocketConnect);
socket.on('error', onSocketError);

socket.on('listAllPDF', onListAllPDF);


(function init(){

})();

function onListAllPDF(file){
	if(file != ".DS_Store"){
		$('ul.pdf-list').append('<li><a href="/content/pdf/'+file+'" target="_blank">'+file+'</a></li>')
	}
}



