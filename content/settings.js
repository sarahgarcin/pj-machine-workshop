var folder = 'data';

var settings = {
	"title": "PJ Machine",

	"folder": folder,

	"contentDir" : "content",
  "metaFileext" : ".txt",
  "confMetafilename" : "data",

  "metaDateFormat" : "YYYYMMDD_HHmmss",
  "textEncoding" : "UTF-8",
  "textFieldSeparator" : "\n\n----\n\n",

  "regexpMatchFolderNames" : "^([^.]+)$",
  "regexpMatchProjectPreviewNames" : "^(apercu|preview)",
  "regexpGetFileExtension" : "\\.[^.]*$",
  "regexpRemoveFileExtension" : "(.+?)(\\.[^.]*$|$)",

  // ZOOM settings
  "maxZoom" : 3,
  "minZoom" : 0.2,
	"zoomStep" : 0.05, 

	// MOVE ELEMENTS settings
	"maxX" : 15,
	"minX" : -20,
	"xStep" : 0.2,
	"maxY" : 18,
	"minY" : -12,
	"yStep" : 0.2,

	//WORD SPACING SETTINGS
	"spacePlus" : 5,
	"spaceMinus" : 3,
	"space" : 3,

	// ROTATION
	"rotationStep" : 15

}

try {
	if (typeof exports !== 'undefined') {
	  if (typeof module !== 'undefined' && module.exports) {
	    exports = module.exports = settings;
	  }
	}
} catch( err) {
	console.log(err);
}