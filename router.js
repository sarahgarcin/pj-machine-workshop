var _ = require("underscore");
var url = require('url'),
    path = require('path'),
    fs = require('fs-extra'),
    marked = require('marked');

var settings  = require('./content/settings.js');
var projectTitle = settings.title;


module.exports = function(app,io,m){

  app.get("/", getIndex);
  app.get("/:project", getProject);

  function getIndex(req, res) {
    
    var dataToSend = {
      title: projectTitle,
    }
    res.render("index", dataToSend);

  };

  function getProject(req, res) {
    var dataToSend = {
      title: projectTitle,
    }
    res.render("poster", dataToSend);
  };



};
