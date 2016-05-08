// import modules
var express = require('express');
var bodyParser = require('body-parser');
var compression = require('compression');
var cors = require('cors');
var fs = require('fs');
var zlib = require('zlib');

var app = express();
app.use(bodyParser.json({limit: '500mb'}));
app.use(bodyParser.urlencoded({limit: '500mb', extended: true}));
app.use(bodyParser.raw({limit: '500mb'}));
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
var mems = {};
var earlyjobs = {};
var pendingprogs = {};
// var i = 0;

function replaceHeap(file, heap, program_id) {
  var res = file.replace(/"atlasHeapReplace"/, "[" + heap + "]");
  return res;
}

function removeHeap(file, heap) {
  var res = file.replace(/__ATINIT__\.push\(\);\s*(?:\/\*memory initializer\*\/)?\s*allocate\(\[.*?\]/,"__ATINIT__.push();allocate([]");
  return res;
}

function disableCheck(file) {
  var res2 = file.replace(/if\s*.+?\(newBuffer\)\s*&.+?\|\|\s*.+?\(newBuffer\)\s*<=\s*.+?\|\|\s*.+\(newBuffer\)\s*\>.+?\)\s*return false;/,'');
  if (res2 == file) console.log("no change");
  else {
    /*
    console.log("old:");
    console.log(file);
    console.log("new:");
    console.log(res);
   */

  }
  return res2;
}

function replaceCallString(file, microtask) {
  var res = file.replace(/"atlasMicrotask"/, microtask);
  //res = res.replace(/'atlasArgarr'/, "[" + argarr + "]");
  var finalRunCallPos = res.lastIndexOf('run()');
  res = res.substr(0, finalRunCallPos) + res.substr(finalRunCallPos+6);
  return res;
}


function writeJSRunFile(programID, file, microtask, jobject) {
  //fs.unlinkSync('./public/' + programID + '.gz');
  var javascriptString = replaceCallString(file, microtask)
  javascriptString += "self.addEventListener('message', function(e) {if (e.data instanceof Array){Module.print('WE GOT IT');argarray = e.data; copyHeap();}else{Module.print('time to init mem');initializeMemory(e.data);}}, false);"

  var output = fs.createWriteStream('./public/tasks/' + programID + '.gz');
  var compress = zlib.createGzip();
  compress.pipe(output);
  compress.write(javascriptString);
  compress.end(function(){jobs[programID]=jobject;
               console.log("son we made it");
               console.log(earlyjobs);
               console.log("JKJK: " + JSON.stringify(earlyjobs[programID]));
               if (programID in mems) {
                 jobs[programID].mem = mems[programID];
                 delete mems[programID];
               }
               if (programID in earlyjobs) {
                 for (var i=0; i<earlyjobs[programID].length; i++)
                   {
                     console.log(earlyjobs[programID][i]);
                     jobs[programID].jobs.push(earlyjobs[programID][i]);
                   }
                   delete earlyjobs[programID];
               }
  });
}

function constructPageHTML() {
  return "<!DOCTYPE HTML><html><head><title>The YouTube.com</title><script src='http://code.jquery.com/jquery-2.2.3.min.js' integrity='sha256-a23g1Nt4dtEYOj7bR+vTu7+T8VP13humZFBJNIYoEJo=' crossorigin='anonymous'></script><script src='/static/distribution.js'></script></head><body><h1>Welcome to the YouTube.com</h1></body></html>";
}

app.get('/', function (req, res) {
  // var job = jobs['123'].jobs.pop();
  res.write(constructPageHTML());
  res.end();
});

app.get('/jank', function (req, res) {
  return res.sendFile('/home/atlas/newhome/compiler/atlas/DistributionServer/public/jank.html');
});

app.get('/spectral', function (req, res) {
  return res.send("<!DOCTYPE HTML><html><head><script src='/static/spectral.js'></script></head><body>Hello world!!!</body></html>");
});
app.get('/spectral2', function (req, res) {
  return res.send("<!DOCTYPE HTML><html><head><script src='/static/bank.js'></script></head><body>Hello world!!!</body></html>");
});
app.get('/kmop', function (req, res) {
  return res.send("<!DOCTYPE HTML><html><head><script src='/static/komp_local.js'></script></head><body>Hello world!!!</body></html>");
});
app.get('/kmjs', function (req, res) {
  return res.send("<!DOCTYPE HTML><html><head><script src='https://cdn.jsdelivr.net/lodash/4.11.2/lodash.min.js'></script><script src='/static/kmeans_lodash.js'></script></head><body>Hello world!!!</body></html>");
});

app.get('/current-task', function (req, res) {
  console.log("current task");
  console.log(Object.keys(jobs));
  if (Object.keys(jobs).length == 0) return res.send("no tasks");
  console.log(Object.keys(jobs)[0]);
  return res.send(Object.keys(jobs)[0]);
});
app.get('/fetch-job/:program_id', function (req, res) {
  if (!(req.params.program_id in jobs)) return res.json({'success':false});
  console.log("Jobs remaining: "+JSON.stringify(jobs[req.params.program_id].jobs));
  if (jobs[req.params.program_id].jobs.length == 0) return res.json({'success':false});
  var job = jobs[req.params.program_id].jobs.pop();
  var uuid = guid();
  jobs[req.params.program_id].inProgress[uuid] = {'jobs': [job], 'lastSeen': new Date().getTime() / 1000};
  //console.log(job.args);
  //console.log(job.jobID);
  //console.log(job.microtask);
  console.log("inProgress: "+JSON.stringify(jobs[req.params.program_id].inProgress));
  return res.json({'uuid': uuid, 'success': true, 'argarr': job.args});
  // return res.json({'success': false});
});

app.get('/heartbeat/:program_id/:uuid', function (req, res) {
  if (jobs.hasOwnProperty(req.params.program_id) && jobs[req.params.program_id].inProgress.hasOwnProperty(req.params.uuid))
  jobs[req.params.program_id].inProgress[req.params.uuid].lastSeen = new Date().getTime() / 1000;
  //console.log(inProgress);
  res.send("hello world!");
});

app.post('/send-result/:program_id/:uuid', function (req, res) {
  if (!(req.params.uuid in jobs[req.params.program_id].inProgress)){
    res.send("Bello world!");
    return;
  }
  console.log("Getting result for job #" +jobs[req.params.program_id].inProgress[req.params.uuid].jobs[0].jobID+" from uuid " + req.params.uuid + ".");
  console.log(req.text);
  var heapChanges = JSON.parse(req.text);
  for (key in heapChanges) {
    jobs[req.params.program_id].heapChanges[key] = heapChanges[key];
  }
  jobs[req.params.program_id].counter += 1;
  if (jobs[req.params.program_id].counter == jobs[req.params.program_id].nth) {
    jobs[req.params.program_id].completed = true;
  }
  delete jobs[req.params.program_id].inProgress[req.params.uuid];
  res.send("Hello world!");
});

app.get('/job-status',function(req,res) {
  return res.json(jobs);

});

app.get('/pool-results/:program_id', function (req, res) {
  if (!(req.params.program_id in jobs)) {
    return res.json({'success': false});
  }
  var program = jobs[req.params.program_id];
  if (program.completed == true) {
    delete jobs[req.params.program_id];
    return res.json({'success':true, 'heapChanges': program.heapChanges});
  }
  return res.json({'success': false});
});

app.get('/get-memory/:program_id', function(req, res) {
  if (!(req.params.program_id in jobs)) {
    return res.json({'success':false});
  }
  res.send(jobs[req.params.program_id].mem);
});

app.post('/initialize-task', function (req, res) {
  var uuid = guid();
  var file = req.body.file;
  var heap = req.body.heap;
  var microtask = req.body.microtask;
  var nth = req.body.nth;
  if (!(uuid in jobs)) {
    console.log("Program with id " + uuid + " initializing.");
    pendingprogs[uuid] = {file:file,mem:req.body,counter:0, microtask:microtask, jobs:[], completed:false, heapChanges:{}, inProgress:{},nth:nth};
  }
  res.send(uuid);
});
app.post('/initialize-mem/:program_id', function(req,res){
  var prog = pendingprogs[req.params.program_id];
  prog.mem = req.body;
    writeJSRunFile(req.params.program_id, disableCheck(removeHeap(prog.file)), prog.microtask,prog);
    /*
  if (req.params.program_id in jobs) {
    jobs[req.params.program_id].mem = req.body;
  }
  else{
    mems[req.params.program_id] = req.body;
    res.send("no");
    return;
  }
 */
  res.send("yes");

});


app.post('/send-job/:program_id', function (req, res) {
  var args = req.body.args;
  var jobID = req.body.jobID;
  jobj = {args: args, jobID: jobID};
  if (req.params.program_id in jobs) {
    console.log("New job for id " + req.params.program_id + " added. Args are " + args + ".");
    jobs[req.params.program_id].jobs.push(jobj);
  }
  else if (req.params.program_id in earlyjobs){
    console.log("EARLY??");
    earlyjobs[req.params.program_id].push(jobj);
 }
  else {
    console.log("VEARLY");
    earlyjobs[req.params.program_id] = [jobj];
}
  res.send("Hello world!");
});

app.listen(8080, function() {
  console.log("Application listening on port 8080.");
  setInterval(function(){
    for (var task in jobs) {
      for (var uuid in jobs[task].inProgress) {
        if (((new Date().getTime() / 1000) - jobs[task].inProgress[uuid].lastSeen) > 15) {
          console.log("REAPING UUID " + uuid);
          for (var i = 0; i < jobs[task].inProgress[uuid].jobs.length; i++) {
            console.log("JOB READD: "+ JSON.stringify(jobs[task].inProgress[uuid].jobs[i]));
            jobs[task].jobs.push(jobs[task].inProgress[uuid].jobs[i]);
          }
          delete jobs[task].inProgress[uuid];
        }
      }
    }
  }, 15000);
});
