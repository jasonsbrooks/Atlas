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
app.use('/static', express.static(__dirname + '/public', {setHeaders: function (res, path, stat) {res.set('Content-Type', 'application/javascript'); res.set('Content-Encoding','gzip');} }));

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
// var i = 0;
var counter = 0;

function replaceHeap(file, heap, program_id) {
    var res = file.replace(/'atlasHeapReplace'/, "[" + heap + "]");
    return res;
}

function replaceCallString(file, microtask, argarr) {
    var res = file.replace(/'atlasMicrotask'/, microtask);
    // res = res.replace(/'atlasArgarr'/, "[" + argarr + "]")
    res = addInitialization(res)
    return res;
}

function addInitialization(file) {
    var res = file.replace(/EMSCRIPTEN_START_ASM/, 'EMSCRIPTEN_START_ASM\ninitializeMemory();')
    return res;
}

function writeJSRunFile(programID, file, microtask, argarr) {
    var javascriptString = replaceCallString(file, microtask, argarr)
    var output = fs.createWriteStream('./public/' + programID + '.gz');
    var compress = zlib.createGzip();
    compress.pipe(output);
    compress.write(javascriptString);
    compress.end();
}

function constructPageHTML(programID) {
    return "<!DOCTYPE HTML><html><head><title>The YouTube.com</title><script src='/static/" + programID + ".gz'></script></head><body><h1>Welcome to the YouTube.com</h1></body></html>";
}

app.get('/', function (req, res) {
    var job = jobs['123'].jobs.pop();
    console.log(job.args);
    console.log(job.jobID);
    console.log(job.microtask);
    res.write(constructPageHTML(newJS));
    res.end();
});

app.get('/fetch-job', function (req, res) {
    res.send("Hello world!");
});

app.post('/send-result/:program_id', function (req, res) {
    console.log("Getting result for job for program with id " + req.params.program_id + ".");
    counter = counter + 1;
    var heapChanges = JSON.parse(req.text);
    for (key in heapChanges) {
        jobs[req.params.program_id].heapChanges[key] = heapChanges[key];
    }
    if (counter == 10) {
        jobs[req.params.program_id].completed = true;
    }
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
    if (!(req.params.program_id in jobs)) {
        jobs[req.params.program_id] = {file:replaceHeap(file, heap), jobs:[], completed:false, heapChanges:{}};
    }
    console.log("Program with id " + req.params.program_id + " initializing.");
    res.send("Hello world!");
});

app.post('/send-job/:program_id', function (req, res) {
    var args = req.body.args;
    var microtask = req.body.microtask;
    var jobID = req.body.jobID;
    jobs[req.params.program_id].jobs.push({args: args, microtask: microtask, jobID: jobID});
    fs.access('/public/' + req.params.program_id + '.gz', fs.F_OK, function(err) {
        if (err) {
            writeJSRunFile(req.params.program_id, jobs[req.params.program_id].file, microtask, args);
        }
    });
    console.log("New job for id " + req.params.program_id + " added. Args are " + args + ".");
    res.send("Hello world!");
});

app.listen(8080, function() {
    console.log("Application listening on port 8080.");
});
