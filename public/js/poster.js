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

	// KEY PRESS EVENTS
	// $(document).on('keypress', function(e){
	// 	var code = e.keyCode;
	// 	console.log(code);
	// 	var activePJBlock = $('.content.active-pj');
	// 	// CALL FUNCTION YOU NEED HERE 
	// 	// CHANGE THE KEYPRESS CODE IN EACH FUNCTION
	// 	//changeBlock(activePJBlock, code);
	// 	// changeText(data, code);
	// 	// zoomEvents(data, code);
	// 	// moveEvents(data, code);
	// 	// wordSpacing(data, code);
	// 	// // changeFontFamily(data, code);
	// 	// changeBlockSize(data, code);
	// 	// generatePDF(data, code);

	// 	// gridDisplayer(code);
	// 	// zoomVideo(code);
		
	// 	e.preventDefault(); // prevent the default action (scroll / move caret)
	// });

	// INTERFACE ACTIONS
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

	// I N T E R F A C E    F E A T U R E S
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

// PJ EVENTS FUNCTION
	function changeText(data, code){
		// press "p" to go to next block, press "o" to do to previous block
		var nextKey = 112;
		var prevKey = 111; 

		// setTimeout(function(){
		// 	var indexTest = $(".page-wrapper").find("[data-folder='" + data.slugFolderName + "']").attr('data-index');
		// 	console.log(data.slugFolderName);
		// 	console.log(indexTest);
		// 	data.index = indexTest;

		


		// if(code == nextKey){
		// 	socket.emit('changeText', data);
		// }

		// if(code == prevKey){
		// 	socket.emit('changeTextPrev', data);
		// }
		// }, 100);

		// if(code == submitKey){
		// 	if(partCount < foldersdata.length-1){
		// 		partCount ++;
		// 		$('.page-wrapper').attr('data-part', partCount);
		// 	}
		// 	else{ 
		// 		partCount = 0; 
		// 		$('.page-wrapper').attr('data-part', partCount);
		// 	}
		// 	localStorage.setItem('data', JSON.stringify(foldersdata[partCount]));
		// 	var data = JSON.parse(localStorage.getItem('data'))
		// 	var type = data.slugFolderName;
		// 	$('.meta-data .block-select').html(type + ' folder:');
		// 	// $('.meta-data .file-select').html((parseInt(data.index)+1) + '/' + parseInt(data.nbOfFiles));
		// 	var $textEl = $(".page-wrapper").find("[data-folder='" + data.slugFolderName + "']");
		// 	$textEl.css('border', '1px solid red');
		// 	setTimeout(function(){
		// 		$textEl.css('border', 'none');
		// 	}, 1000);
		// }
	}

function onDisplayPage(foldersData){
	$.each( foldersData, function( index, fdata) {
  	var $folderContent = makeFolderContent( fdata);
    return insertOrReplaceFolder( fdata.slugFolderName, $folderContent);
  });
	console.log(foldersData);
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
	$('.content').removeClass('active-block');

	// customisation du projet
	newFolder
	  .attr( 'data-index', index)
	  .attr( 'data-folder', folder)
	  .addClass('active-block')
	  .css({
	  	'transform': 'scale('+projectData.zoom+')',
	  	'left': projectData.xPos+'cm',
			'top':projectData.yPos+'cm',
			'word-spacing': projectData.wordSpace +'px', 
			// 'width': projectData.blockSize +'cm'
	  })

  ;

  newFolder.html(converter.makeHtml(projectData.content));
  loadCurrentBlockMarkdown(projectData.content);

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
	$('.content[data-folder="'+data.index+'"]').html(converter.makeHtml(data.content));
	loadCurrentBlockMarkdown(data.content);
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
