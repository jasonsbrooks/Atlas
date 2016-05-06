// import modules
var express = require('express');
var bodyParser = require('body-parser');
var compression = require('compression');
var cors = require('cors');
var fs = require('fs');
var zlib = require('zlib');

var app = express();
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(compression());
app.use(cors());
app.use('/static', express.static(__dirname + '/public', {
    setHeaders: function (res, path, stat) {
        if (path.endsWith("gz")) {
            res.set('Content-Type', 'application/javascript');
            res.set('Content-Encoding','gzip');
        }
    }
}));

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

app.use(function(req, res, next){
  if (req.is('text/*')) {
    req.text = '';
    req.setEncoding('utf8');
    req.on('data', function(chunk){ req.text += chunk });
    req.on('end', next);
  } else {
    next();
  }
});

var jobs = {};
var inProgress = {}
// var i = 0;
var counter = 0;

function replaceHeap(file, heap, program_id) {
    var res = file.replace(/'atlasHeapReplace'/, "[" + heap + "]");
    return res;
}

function replaceCallString(file, microtask) {
    var res = file.replace(/'atlasMicrotask'/, microtask);
    //res = res.replace(/'atlasArgarr'/, "[" + argarr + "]");
    var finalRunCallPos = res.lastIndexOf('run();');
    res = res.substr(0, finalRunCallPos) + res.substr(finalRunCallPos+6);
    res = addInitialization(res);
    return res;
}

function addInitialization(file) {
    var res = file.replace(/EMSCRIPTEN_START_ASM/, 'EMSCRIPTEN_START_ASM\ninitializeMemory();')
    return res;
}

function writeJSRunFile(programID, file, microtask) {
    fs.unlinkSync('./public/' + programID + '.gz');
    var javascriptString = replaceCallString(file, microtask)
    javascriptString += "self.addEventListener('message', function(e) {Module.print('WE GOT IT');argarray = e.data; copyHeap();}, false);"
    var output = fs.createWriteStream('./public/' + programID + '.gz');
    var compress = zlib.createGzip();
    compress.pipe(output);
    compress.write(javascriptString);
    compress.end();
}

function constructPageHTML() {
    return "<!DOCTYPE HTML><html><head><title>The YouTube.com</title><script src='http://code.jquery.com/jquery-2.2.3.min.js' integrity='sha256-a23g1Nt4dtEYOj7bR+vTu7+T8VP13humZFBJNIYoEJo=' crossorigin='anonymous'></script><script src='/static/distribution.js'></script></head><body><h1>Welcome to the YouTube.com</h1></body></html>";
}

app.get('/', function (req, res) {
    // var job = jobs['123'].jobs.pop();
    res.write(constructPageHTML());
    res.end();
});

app.get('/fetch-job/:program_id', function (req, res) {
    console.log("Jobs remaining: "+JSON.stringify(jobs[req.params.program_id].jobs));
    if (jobs[req.params.program_id].jobs.length == 0) return res.json({'success':false});
    var job = jobs[req.params.program_id].jobs.pop();
    var uuid = guid();
    inProgress[uuid] = {'jobs': [job], 'lastSeen': new Date().getTime() / 1000};
    //console.log(job.args);
    //console.log(job.jobID);
    //console.log(job.microtask);
    console.log("inProgress: "+JSON.stringify(inProgress));
    return res.json({'uuid': uuid, 'success': true, 'argarr': job.args});
    // return res.json({'success': false});
});

app.get('/heartbeat/:uuid', function (req, res) {
    console.log(req.params.uuid);
    if (inProgress.hasOwnProperty(req.params.uuid))
      inProgress[req.params.uuid].lastSeen = new Date().getTime() / 1000;
    //console.log(inProgress);
    res.send("hello world!");
});

app.post('/send-result/:program_id/:uuid', function (req, res) {
    console.log("Getting result for job for program with id " + req.params.program_id + ".");
    counter = counter + 1;
    var heapChanges = JSON.parse(req.text);
    for (key in heapChanges) {
        jobs[req.params.program_id].heapChanges[key] = heapChanges[key];
    }
    if (counter == 10) {
        jobs[req.params.program_id].completed = true;
    }
    delete inProgress[req.params.uuid];
    res.send("Hello world!");
});

app.get('/pool-results/:program_id', function (req, res) {
    if (!(req.params.program_id in jobs)) {
        return res.json({'success': false});
    }
    var program = jobs[req.params.program_id];
    if (program.completed == true) {
        return res.json({'success':true, 'heapChanges': program.heapChanges});
    }
    return res.json({'success': false});
});

app.post('/initialize-job/:program_id', function (req, res) {
    var file = req.body.file;
    var heap = req.body.heap;
    var microtask = req.body.microtask;
    if (!(req.params.program_id in jobs)) {
        jobs[req.params.program_id] = {file:replaceHeap(file, heap), jobs:[], completed:false, heapChanges:{}};
    }
    writeJSRunFile(req.params.program_id, jobs[req.params.program_id].file, microtask);
    console.log("Program with id " + req.params.program_id + " initializing.");
    res.send("Hello world!");
});

app.post('/send-job/:program_id', function (req, res) {
    var args = req.body.args;
    var jobID = req.body.jobID;
    jobs[req.params.program_id].jobs.push({args: args, jobID: jobID});
    console.log("New job for id " + req.params.program_id + " added. Args are " + args + ".");
    res.send("Hello world!");
});

app.listen(8080, function() {
    console.log("Application listening on port 8080.");
    setInterval(function(){
        for (var uuid in inProgress) {
            if (((new Date().getTime() / 1000) - inProgress[uuid].lastSeen) > 7) {
                console.log("REAPING UUID " + uuid);
                for (var i = 0; i < inProgress[uuid].jobs.length; i++) {
                  console.log("JOB READD: "+ JSON.stringify(inProgress[uuid].jobs[i]));
                  jobs['123'].jobs.push(inProgress[uuid].jobs[i]);
                }
                delete inProgress[uuid];
                console.log(jobs['123'].jobs.length);
            }
        }
    }, 3000);
});
