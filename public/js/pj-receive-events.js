function onUpdateBlock(blockdata){
	console.log(blockdata);
	var $element = $('.content[data-folder="'+blockdata.index+'"]');
	$element.move(blockdata.xPos, blockdata.yPos);
	$element.zoom(blockdata.zoom, '0 0');
	$element.blockSize(blockdata.blockSize);
	$element.wordSpacing(blockdata.wordSpace);
	$element.changeFont(blockdata.font);

}
