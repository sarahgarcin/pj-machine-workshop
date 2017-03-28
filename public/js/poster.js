/* VARIABLES */
var socket = io.connect();

var currentFolder = app.currentFolder;
var currentProject = app.currentProject;

var converter = new showdown.Converter({'tables':true});


function onSocketConnect() {
	sessionId = socket.io.engine.id;
	console.log('Connected ' + sessionId);
};

function onSocketError(reason) {
	console.log('Unable to connect to server', reason);
};

/* sockets */
socket.on('connect', onSocketConnect);
socket.on('error', onSocketError);
socket.on('blockCreated', onBlockCreated);

(function init(){
	$('.js--add-block').on('click',function(){
		var numBlocks = $('.content').length;
		console.log(numBlocks);
		socket.emit('newBlock', {
			"currentFolder":currentFolder, 
			"currentProject" : currentProject,
			"numBlocks":numBlocks.toString()
		});
	});

})();

function onBlockCreated(fdata){
	console.log(fdata);
	var $folderContent = makeFolderContent( fdata);
	insertOrReplaceFolder( fdata.index, $folderContent).then(function(blockIndex){
		var currentMd = loadCurrentBlockMarkdown(fdata.content);
		$('.module--md-editor textarea').val(currentMd);
	});
	
}

function insertOrReplaceFolder( blockIndex, $folderContent) {
	return new Promise(function(resolve, reject) {
  	$(".page-wrapper").append($folderContent);
  	resolve(blockIndex);
  });
  // return "inserted";
}

function makeFolderContent( projectData){

	console.log(projectData)
	
	var index = projectData.index;
	var folder = projectData.index;

	var newFolder = $(".js--templates > .content").clone(false);

	// customisation du projet
	newFolder
	  .attr( 'data-index', index)
	  .attr( 'data-folder', folder)
	  .css({
	  	'transform': 'scale('+projectData.zoom+')',
	  	'left': projectData.xPos+'cm',
			'top':projectData.yPos+'cm',
			'word-spacing': projectData.wordSpace +'px', 
			'width': projectData.blockSize +'cm'
	  })

  ;

  newFolder.html(converter.makeHtml(projectData.content));

	return newFolder;
}

function loadCurrentBlockMarkdown(mdContent){
	// var currentMarkdown = $('.content[data-index="'+blockIndex+'"').html();
	console.log(mdContent);
	return mdContent;
}
