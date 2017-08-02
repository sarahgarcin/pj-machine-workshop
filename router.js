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
var contentFolder = settings.folder;


module.exports = function(app,io,m){

  app.get("/", getIndex);
  app.get("/print", getPrint);
  app.get("/pdf", getPdf);

  function getIndex(req, res) {
    var slugConfName = settings.blockFolder;
    api.readConfMeta(slugConfName).then(function(c) {
      var pageTitle = c.name + ' | ' + projectTitle;
      res.render("index", {
        "confName" : c.name,
        "title" : pageTitle,
        "appName" : projectTitle,
        "slugConfName" : slugConfName,
        "contentFolder":contentFolder,
        "settings" : settings,
      });

    });

  };

  function getPrint(req, res) {
    var slugConfName = settings.blockFolder;
    api.readConfMeta(slugConfName).then(function(c) {

      var pageTitle = c.name + ' | ' + projectTitle;
      res.render("print", {
        "confName" : c.name,
        "title" : pageTitle,
        "appName" : projectTitle,
        "slugConfName" : slugConfName,
        "contentFolder":contentFolder,
        "settings" : settings,
      });

    });
  };

  function getPdf(req, res) {
    var slugConfName = req.params;
      var pageTitle = 'PDF';
      res.render("pdf", {
        "title" : pageTitle,
      });
  };



};
