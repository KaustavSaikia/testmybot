'use strict'

const request = require('request');
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const opn = require('opn');
const testmybot = require('testmybot');
const convo = require('testmybot/lib/convo');

var idePort = process.env.PORT || 3000;

var demomode = (process.env.DEMO === 'true');

var appIde = express();

appIde.set('view engine', 'ejs');
appIde.set('views', __dirname + '/views');

appIde.use(bodyParser.json());

appIde.use("/public", express.static(__dirname + '/public'));

appIde.get('/', function (req, res) {
  var packageJson = require('../../package.json');
  
  var data = {
    module: packageJson,
    config: {
    }
  };
  res.render('index', data);
});

var router = express.Router();

router.route('/startdocker')
  .post(function(req, res) {
    
    var testendpoint = '';
    
    var configToSet = {};
    if (demomode) {
      configToSet = { 'docker': { 'container': { 'testmybot-fbmock': { 'env': { 'TESTMYBOT_FACEBOOK_DEMOMODE': true } } } } };
    }
    
    testmybot.beforeAll(configToSet)
    .then((config) => {
      testendpoint = config.testendpoint;
      return testmybot.beforeEach();
    }).then(function() {
      res.json({ success: true, testendpoint: testendpoint });
    }).catch(function (err) {
      console.log(err);
      
      res.json({ success: false, error: err });
    });
  });


router.route('/testcases')
  .post(function(req, res) {
    if (!req.body.name)
      return res.json({ success: false, error: 'Name not specified' });
    if (!req.body.conversation)
      return res.json({ success: false, error: 'Conversation not specified' });
    
    convo.writeConvo(req.body, true).then(
      (filename) => {
        res.json({ success: true, filename: filename });
      }).catch(
      (err) => {
        console.log('writeConvo error: ' + err);
        return res.json({ success: false, error: err });
      });    

  }).get(function(req, res) {
    
    convo.readConvos().then(
      (convos) => {
        res.json(convos);
      }).catch(
      (err) => {
        console.log('readConvos error: ' + err);
        return res.json({ success: false, error: err });
      }); 
  });

router.route('/testcases/:filename')
  .get(function(req, res) {
    convo.readConvo(req.params.filename).then(
      (convo) => {
        res.json(convo);
      }).catch(
      (err) => {
        console.log('readConvo error: ' + err);
        return res.json({ success: false, error: err });
      }); 

  }).put(function(req, res) {
    if (!req.body.name)
      return res.json({ success: false, error: 'Name not specified' });
    if (!req.body.filename)
      return res.json({ success: false, error: 'Filename not specified' });
    if (!req.body.conversation)
      return res.json({ success: false, error: 'Conversation not specified' });
    
    convo.writeConvo(req.body, false).then(
      (filename) => {
        res.json({ success: true, filename: filename });
      }).catch(
      (err) => {
        console.log('writeConvo error: ' + err);
        return res.json({ success: false, error: err });
      });    
  });
    
appIde.use('/api', router);

var server = http.createServer(appIde);
server.listen(idePort, function(err) {
  if (err) {
    console.log('error listening ' + idePort + ': ' + err);
  }
  else {
    console.log('TestMyBot IDE listening on port ' + idePort);
    opn('http://127.0.0.1:' + idePort);
  }
});







