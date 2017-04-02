/* VARIABLES */
var socket = io.connect();

var currentFolder = app.currentFolder;
var currentProject = app.currentProject;

var converter = new showdown.Converter({'tables':true});


function onSocketConnect() {
	sessionId = socket.io.engine.id;
	console.log('Connected ' + sessionId);
	socket.emit('listFiles', {"currentFolder":currentFolder, "currentProject" : currentProject});
	socket.emit('loadCSS',{"currentProject" : currentProject} );
};

function onSocketError(reason) {
	console.log('Unable to connect to server', reason);
};

/* sockets */
socket.on('connect', onSocketConnect);
socket.on('error', onSocketError);
socket.on('blockCreated', onBlockCreated);
socket.on('displayPageEvents', onDisplayPage);
socket.on('BlockData', onBlockData);
socket.on('updatePoster', onUpdatePoster);
socket.on('cssContent', onUpdateCSS);
socket.on('cssLoaded', onCSSLoaded);

(function init(){
	
	// Create a new block on click plus button
	$('.js--add-block').on('click',function(){
		var numBlocks = $('.content').length;
		console.log(numBlocks);
		socket.emit('newBlock', {
			"currentFolder":currentFolder, 
			"currentProject" : currentProject,
			"numBlocks":numBlocks.toString()
		});
	});

	// Select block on click 
	$('body').on('click', '.content', function(){
		var $this = $(this);
		var dataFolder = $this.attr('data-folder');
		if($this.hasClass('active-block')){
			$(this).removeClass('active-block');
			$('.module--md-editor textarea').val('');
			$('.module--md-editor textarea').attr("disabled","disabled"); 
			$('.js--submit-md-editor').attr("disabled","disabled");
		}
		else{
			$('.content').removeClass('active-block');
			$this.addClass('active-block');
			$('.module--md-editor textarea').attr("disabled",false); 
			$('.js--submit-md-editor').attr("disabled",false);
			loadBlockData(dataFolder);
		}
	});

	// Run markdown on click "Run button"
	$('.js--submit-md-editor').on('click', function(){
		var newMdContent = $('.module--md-editor textarea').val();
		var blockActive = $(".active-block").attr('data-folder');
		socket.emit('newMdContent', {
			"currentProject" : currentProject,
			"currentBlock" : blockActive,
			"newMdContent": newMdContent, 
		});
	});

	// Run CSS on click "Run button"
	$('.js--submit-css-editor').on('click', function(){
		var newCSSContent = 
		$('.module--css-editor textarea')
		.val()
		.replace(/\n/g, "")
		;
		
		socket.emit('newCssContent', {
			"newCSSContent": newCSSContent, 
			"currentProject": currentProject
		});
	});

	// I N T E R F A C E
		// Grid
		$('.gridButton').on('click',function(){
			if($(this).hasClass('active')){
				$(this).removeClass('active');
				$(".grid").removeClass('active');
			}
			else{
				$(this).addClass('active');
				$(".grid").addClass('active');
			}
		});

		// Debug mode
		$('.debugButton').on('click',function(){
			if($(this).hasClass('active')){
				$(this).removeClass('active');
				$(".content").removeClass('debug');
			}
			else{
				$(this).addClass('active');
				$(".content").addClass('debug');
			}
		});

})();

function onDisplayPage(foldersData){
	$.each( foldersData, function( index, fdata) {
  	var $folderContent = makeFolderContent( fdata);
    return insertOrReplaceFolder( fdata.slugFolderName, $folderContent);
  });
	console.log(foldersData);

	var partCount = parseInt($('.page-wrapper').attr('data-part'));
	data = foldersData[partCount];
	loadCurrentBlockMarkdown(data.content);

	$('.content[data-folder="1"]').addClass('active-block');

	// Put the object into storage
	localStorage.setItem('foldersdata', JSON.stringify(foldersData));
	localStorage.setItem('data', JSON.stringify(data));
}

function onBlockCreated(fdata){
	console.log(fdata);
	var $folderContent = makeFolderContent( fdata);
	insertOrReplaceFolder( fdata.index, $folderContent).then(function(blockIndex){
		loadCurrentBlockMarkdown(fdata.content);
	});	
}

function insertOrReplaceFolder( blockIndex, $folderContent) {
	return new Promise(function(resolve, reject) {
  	$(".page-wrapper").append($folderContent);
  	resolve(blockIndex);
  });
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
			// 'width': projectData.blockSize +'cm'
	  })

  ;

  newFolder.html(converter.makeHtml(projectData.content));

	return newFolder;
}

function loadCurrentBlockMarkdown(mdContent){
	$('.module--md-editor textarea').val(mdContent);
	return mdContent;
}

// Functions de blocks
function loadBlockData(dataFolder){
	socket.emit('loadBlockData', {"currentProject" : currentProject, "dataFolder": dataFolder});
}

function onBlockData(fdata){
	console.log(fdata);
	loadCurrentBlockMarkdown(fdata.content);
}

function onUpdatePoster(data){

	//update content in block
	$('.active-block').html(converter.makeHtml(data.content));
	console.log(data);
}

function onUpdateCSS(css){
	$('style').html(css);

}

function onCSSLoaded(pdata){
	console.log("CSS loaded", pdata);
	$('style').html(pdata.css);
	$('.module--css-editor textarea').val(pdata.css);
}
