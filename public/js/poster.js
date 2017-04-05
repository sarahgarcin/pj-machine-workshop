/* VARIABLES */
var socket = io.connect();

var currentFolder = app.currentFolder;
var currentProject = app.currentProject;

var converter = new showdown.Converter({'tables':true});

var scale = 0.3;


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

// pj machine sockets
socket.on('blockChanged', onBlockChanged);
socket.on('updateBlock', onUpdateBlock);

(function init(){

	// KEY PRESS EVENTS
	$(document).on('keypress', function(e){
		if($('.page').hasClass('pj-machine-mode')){
			var code = e.keyCode;
			console.log(code);
			var activePJBlock = $(".active-pj").attr('data-folder');
			// CALL FUNCTION YOU NEED HERE 
			// CHANGE THE KEYPRESS CODE IN EACH FUNCTION
			changeBlock(activePJBlock, code);
			moveBlock(activePJBlock, code);
			zoomBlock(activePJBlock, code);
			// wordSpacing(data, code);
			// // changeFontFamily(data, code);
			// changeBlockSize(data, code);
			generatePDF(code);

			// gridDisplayer(code);
			
			e.preventDefault(); // prevent the default action (scroll / move caret)
		}
	});

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
		// Zoom 
		$('.plusButton').on('click', function(){
			scale = scale + 0.01;
			$(".page").zoom(scale, '0 0');
			$('.zoom-value').html(parseInt(scale*100) + '%');
		});

		$('.minusButton').on('click', function(){
			scale = scale - 0.01;
			$(".page").zoom(scale, '0 0');
			$('.zoom-value').html(parseInt(scale*100) + '%');
		});

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

		// Preview
		$('.previewButton').on('click',function(){
			if($(this).hasClass('active')){
				$(this).removeClass('active');
				$("body").removeClass('preview');
			}
			else{
				$(this).addClass('active');
				$("body").addClass('preview');
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


		// pj machine mode
		$(".pjMachineButton").on('click', function(){
			if($(this).hasClass('active')){
				$(this).removeClass('active');
				$(".module--sidebar").removeClass('pj-machine-mode');
				$(".page").removeClass('pj-machine-mode');
			}
			else{
				$(this).addClass('active');
				$(".module--sidebar").addClass('pj-machine-mode');
				$(".page").addClass('pj-machine-mode');
			}
		});

})();

// PJ EVENTS FUNCTION
	function changeBlock(blockActive, code){
		// press "p" to go to next block, press "o" to do to previous block
		var nextKey = 112;
		var prevKey = 111; 

		var numBlocks = $('.content').length;
		var direction ; 
		if(code == nextKey){
			direction = "next";
		}

		if(code == prevKey){
			direction = "prev";
		}
		
		socket.emit('changeBlock', {
			"currentProject" : currentProject,
			"currentBlock" : blockActive,
			"direction": direction, 
			"numBlocks":numBlocks
		});
	}

	function moveBlock(blockActive, code){

		//press "q" to move image on the right
		var right = 113;
		//press "a" to move image on the left
		var left = 97; 
		//press "w" to move image down
		var down = 119;
		//press "s" to move image up
		var up = 115;

		var blockActive = $(".active-pj").attr('data-folder');
		var numBlocks = $('.content').length;
		var direction; 
		if(code == right){
			direction = "right";
		}
		if(code == left){
			direction = "left";
		}
		if(code == up){
			direction = "up";
		}
		if(code == down){
			direction = "down";
		}
		
		if(code == right || code == left ||code == up ||code == down ){
			socket.emit('moveBlock', {
				"currentProject" : currentProject,
				"currentBlock" : blockActive,
				"direction": direction, 
				"numBlocks":numBlocks
			});
		}
	}

	function zoomBlock(blockActive, code){
		//zoomIn press "u"
		var zoomInKey = 117; 
		//zoomOut press "space"
		var zoomOutKey = 32; 
		var zoom; 

		if(code == zoomInKey){
			zoom = "zoomin";
		}
		
		if(code == zoomOutKey){
			zoom = "zoomout";
		}
		if(code == zoomInKey || code == zoomOutKey){
			socket.emit("zoomBlock", {
				"currentProject" : currentProject,
				"currentBlock" : blockActive,
				"zoom": zoom
			});
		}
	}

	function generatePDF(code){

		// press "t" to generate pdf
		var pdf = 116;
		var currentUrl = window.location.href ; 

		if(code == pdf){
			socket.emit('generate', currentUrl);							
		}
		
	}


function onBlockChanged(blockToGo){
	// console.log(blockToGo);
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

function onBlockCreated(fdata){
	//console.log(fdata);
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

	//console.log(projectData)
	
	var index = projectData.index;
	var folder = projectData.index;
	var blockClass = 'block' + index;

	var newFolder = $(".js--templates > .content").clone(false);
	$('.content').removeClass('active-block').removeClass('active-pj');

	// customisation du projet
	newFolder
	  .attr( 'data-index', index)
	  .attr( 'data-folder', folder)
	  .addClass('active-block')
	  .addClass('active-pj')
	  .addClass(blockClass)
	  .css({
	  	'transform': 'scale('+projectData.zoom+')',
	  	'transform-origin': '0 0',
	  	'left': projectData.xPos+'cm',
			'top':projectData.yPos+'cm',
			'word-spacing': projectData.wordSpace +'px', 
			// 'width': projectData.blockSize +'cm'
	  })
  ;

  newFolder
  	.html(converter.makeHtml(projectData.content))
  	.append('<div class="infos-css"><span>.'+blockClass+'</span></div>')
  	;
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
	//console.log(fdata);
	loadCurrentBlockMarkdown(fdata.content);
}

function onUpdatePoster(data){
	//update content in block
	$('.content[data-folder="'+data.index+'"]')
	.html(converter.makeHtml(data.content))
	.append('<div class="infos-css"><span>.block'+data.index+'</span></div>')
	;
	
	loadCurrentBlockMarkdown(data.content);
	//console.log(data);
}

function onUpdateCSS(css){
	$('style').html(css);

}

function onCSSLoaded(pdata){
	console.log("CSS loaded", pdata);
	$('style').html(pdata.css);
	var cssFormatted = pdata.css.replace(/{/g, '{\n').replace(/}/g, '\n}\n');
	$('.module--css-editor textarea').val(cssFormatted);
}

function onUpdateBlock(blockdata){
	console.log(blockdata);
	var $element = $('.content[data-folder="'+blockdata.index+'"]');
	$element.move(blockdata.xPos, blockdata.yPos);
	$element.zoom(blockdata.zoom, '0 0');
}




