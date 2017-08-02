function makeFolderContent( projectData){

	var index = projectData.index;
	var folder = projectData.index;
	var blockClass = 'block' + index;

	var newFolder = $(".js--templates > .content").clone(false);
	$('.content').removeClass('active-block').removeClass('active-pj');

	// Load content 
	newFolder
	  .attr( 'data-index', index)
	  .attr( 'data-folder', folder)
	  .addClass('active-block')
	  .addClass('active-pj')
	  .addClass(blockClass)
	  .css({
	  	'transform': 'scale('+projectData.zoom+') rotate('+projectData.rotation+'deg)',
	  	'transform-origin': '0 0',
	  	'left': projectData.xPos+'cm',
			'top':projectData.yPos+'cm',
			'letter-spacing': projectData.wordSpace +'px', 
			'width': projectData.blockSize + 'cm', 
	  })
  ;

  newFolder
  	.html(converter.makeHtml(projectData.content))
  	.children().css({
  		'font-family': projectData.font + ", sans-serif",
  		'color': projectData.color
  	})
  	;

	return newFolder;
}
