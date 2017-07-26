(function init(){	
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
})();
