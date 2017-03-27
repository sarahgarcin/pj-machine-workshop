/* VARIABLES */
var socket = io.connect();

function onSocketConnect() {
	sessionId = socket.io.engine.id;
	console.log('Connected ' + sessionId);
	socket.emit('listConf');
};

function onSocketError(reason) {
	console.log('Unable to connect to server', reason);
};

/* sockets */
socket.on('connect', onSocketConnect);
socket.on('error', onSocketError);
socket.on('confCreated', onFolderCreated);
socket.on('listAllFolders', onListAllFolders);

(function init(){
	$('body').on('click', '.js-add-conf', function(){
		var newConfTitre = $('input.title').val();
		console.log(newConfTitre);
		socket.emit( 'newConf', {
  		"titre":newConfTitre,
  	});
  });
})();

function onFolderCreated(data){
	location.reload();
}

function onListAllFolders( foldersData) {
	console.log(foldersData);
  $.each( foldersData, function( index, fdata) {
    fdata.folderIndex = index+1;
  	var $folderContent = makeFolderContent( fdata);
  	console.log($folderContent);
    return insertOrReplaceFolder( fdata.slugFolderName, $folderContent);
  });
}

function insertOrReplaceFolder( slugFolderName, $folderContent) {
  $(".dossier-list").append( $folderContent);
  return "inserted";
}

// Fonction qui affiche les dossiers HTML
function makeFolderContent( projectData){

	console.log(projectData)

	var name = projectData.name;
	var slugFolderName = projectData.slugFolderName;
	var newFolder = $(".js--templates > .dossier").clone(false);

	// customisation du projet
	newFolder
	  .attr( 'data-nom', name)
	  .attr( 'data-slugFolderName', slugFolderName)
	  .find( '.folder-link')
	    .attr('href', '/' + slugFolderName)
	    .attr('title', name)
	  .end()
	  .find( '.title')
	    .text(name)
	   .end()
    ;

		return newFolder;
}