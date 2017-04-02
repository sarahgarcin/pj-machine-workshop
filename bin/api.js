const path = require('path'),
	moment = require('moment'),
  parsedown = require('woods-parsedown'),
  fs = require('fs-extra')
;

  const settings  = require('../content/settings.js');
  const pathToUserContent = path.join(settings.contentDir, settings.folder);

var api = (function() {

  const API = {
    getContentPath              : (path = '')  => { return getContentPath(path) },
    findFirstFilenameNotTaken   : (confPath, fileName) => { return findFirstFilenameNotTaken(confPath, fileName) },
    getMetaFileOfConf           : (slugConfName) => { return getMetaFileOfConf(slugConfName); },
    readConfMeta                : (slugConfName) => { return readConfMeta(slugConfName); },
    getCurrentDate              : (format = settings.metaDateFormat) => { return getCurrentDate(format); },
    textifyObj                  : (obj) => { return textifyObj(obj); },
    storeData                   : (mpath, d, e) => { return storeData( mpath, d, e); },
    parseData                   : (d) => { return parseData(d); },
  }

  function getContentPath(toPath) {
    return path.join(pathToUserContent, toPath);
  }

  // check whether fileName (such as "hello-world.mp4") already exists in the conf folder
  function findFirstFilenameNotTaken(confPath, fileName) {
    return new Promise(function(resolve, reject) {
      // let's find the extension if it exists
      var fileExtension = new RegExp( settings.regexpGetFileExtension, 'i').exec( fileName)[0];
      var fileNameWithoutExtension = new RegExp( settings.regexpRemoveFileExtension, 'i').exec( fileName)[1];
      fileNameWithoutExtension = slugg(fileNameWithoutExtension);
      try {
        var newFileName = fileNameWithoutExtension + fileExtension;
        var newMetaFileName = fileNameWithoutExtension + settings.metaFileext;
        var index = 0;
        var newPathToFile = path.join(confPath, newFileName);
        var newPathToMeta = path.join(confPath, newMetaFileName);
        console.log( "2. about to look for existing files.");
        // check si le nom du fichier et le nom du fichier méta sont déjà pris
        while( (!fs.accessSync( newPathToFile, fs.F_OK) && !fs.accessSync( newPathToMeta, fs.F_OK))){
          console.log("- - following path is already taken : newPathToFile = " + newPathToFile + " or newPathToMeta = " + newPathToMeta);
          index++;

          newFileName = fileNameWithoutExtension + "-" + index + fileExtension;
          newMetaFileName = fileNameWithoutExtension + "-" + index + settings.metaFileext;
          newPathToFile = path.join(confPath, newFileName);
          newPathToMeta = path.join(confPath, newMetaFileName);
        }
      } catch(err) {

      }
      console.log( "3. this filename is not taken : " + newFileName);
      resolve(newFileName);
    });
  }

  function getMetaFileOfConf(slugConfName) {
    let confPath = api.getContentPath(slugConfName);
    let metaPath = path.join(confPath, settings.confMetafilename+settings.metaFileext);
    return metaPath;
  }

  function readConfMeta(slugConfName) {
    return new Promise(function(resolve, reject) {
      console.log( "COMMON — readConfMeta: " + slugConfName);
      var metaConfPath = api.getMetaFileOfConf(slugConfName);
      var folderData = fs.readFileSync(metaConfPath, settings.textEncoding);
      var folderMetadata = api.parseData(folderData);
      console.log("conf meta : " + JSON.stringify(folderMetadata));
      resolve(folderMetadata);
    });
  }





  function storeData( mpath, d, e) {
    return new Promise(function(resolve, reject) {
      console.log('Will store data');
      var textd = textifyObj(d);
      if( e === "create") {
        fs.appendFile( mpath, textd, function(err) {
          if (err) reject( err);
          resolve(api.parseData(textd));
        });
      }
  	    if( e === "update") {
        fs.writeFile( mpath, textd, function(err) {
          if (err) reject( err);
          resolve(api.parseData(textd));
        });
      }
    });
  }

  function textifyObj( obj) {
    var str = '';
    console.log( '1. will prepare string for storage');
    for (var prop in obj) {
      var value = obj[prop];
      console.log('2. prop ? ' + prop + ' and value ? ' + value);
      // if value is a string, it's all good
      // but if it's an array (like it is for medias in publications) we'll need to make it into a string
      if( typeof value === 'array' || typeof value === 'object') {
        console.log('this is an array');
        value = value.join('\n');
      // check if value contains a delimiter
      } else if( typeof value === 'string' && value.indexOf('\n----\n') >= 0) {
        console.log( '2. WARNING : found a delimiter in string, replacing it with a backslash');
        // prepend with a space to neutralize it
        value = value.replace('\n----\n', '\n ----\n');
      }
      str += prop + ': ' + value + settings.textFieldSeparator;
  //       console.log('Current string output : ' + str);
    }
  //     console.log( '3. textified object : ' + str);
    return str;
  }

  function getCurrentDate(f) {
    return moment().format(f);
  }


  function parseData(d) {
    	console.log("Will parse data");
    	var parsed = parsedown(d);
    	return parsed;
  }




  return API;
})();

module.exports = api;