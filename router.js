var _ = require("underscore");
var url = require('url'),
    path = require('path'),
    fs = require('fs-extra'),
    marked = require('marked');

const
  settings  = require('./content/settings.js'),
  api = require('./bin/api')
;

var projectTitle = settings.title;


module.exports = function(app,io,m){

  app.get("/", getIndex);
  app.get("/:poster", getPoster);

  function getIndex(req, res) {
    
    var dataToSend = {
      "title": projectTitle,
    }
    res.render("index", dataToSend);

  };

  function getPoster(req, res) {
    var slugConfName = req.params;
    api.readConfMeta(slugConfName.poster).then(function(c) {

      var pageTitle = c.name + ' | PJ Machine';
      res.render("poster", {
        "confName" : c.name,
        "title" : pageTitle,
        "slugConfName" : slugConfName,
        "settings" : settings,
      });

    });
  };



};
