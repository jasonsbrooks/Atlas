$(document).ready(function() {
  // atlasUUID comes from a script tag in the head
  console.log(atlasUUID);
  heartbeat = window.setInterval(pollTask, 500);
});
var taskid = -1;
var currentArgArrs;
var currentHeapChanges = {};
var numIters;
var taskbuffer;
var uuid;
var heartbeat;
var runnerWorker;
var serverIP = "http://52.7.238.54:8080";

function pollTask() {
  $.get("http://52.7.238.54:8080/current-task", function(data) {
    if (data != "no tasks") {
      if (taskid == data){
        runJobCycle(runnerWorker);
        return;
      }
      // clearInterval(heartbeat);
      taskid = data;
      console.log("got new task: " + data);
      runnerWorker = new Worker("/static/tasks/"+taskid+".gz");
      runnerWorker.onmessage = function(e) {
        // result.textContent = e.data;
        console.log(e.data);
        $('body').append("<h2>Finished job with UUID " + uuid + "</h2>");
        $('body').append(e.data);
        console.log("message received from worker");
        var parsedResult = JSON.parse(e.data);
        console.log(parsedResult);
        for (item in parsedResult) {
          currentHeapChanges[item] = parsedResult[item];
        }

        if (currentArgArrs.length > 0) {
          $('body').append('<h3>Running the next job in the current set sent over.</h3>');
          console.log("GOT HERE 1");
          runnerWorker.postMessage(currentArgArrs.pop());
        } else {
          console.log("GOT HERE 2");
          currentHeapChanges = {'numIters': numIters, 'heapChanges': currentHeapChanges};
          console.log(JSON.stringify(currentHeapChanges));
          makeCorsRequest(JSON.stringify(currentHeapChanges));
          $('body').append('<h3>Getting new jobs because none left in current batch.</h3>');
          currentHeapChanges = {};
          currentArgArrs = [];
          numIters = 0;
          runJobCycle(runnerWorker);
          return;
        }
      }
      initHeap(taskid,runnerWorker);
    }
      clearInterval(heartbeat);
      heartbeat = window.setInterval(pollTask, 5000);
  });


}

function runJobCycle(runnerWorker) {
  $.get("http://52.7.238.54:8080/fetch-job/"+taskid, function(data) {
    if (data.success == false) {
      clearInterval(heartbeat);
      heartbeat = window.setInterval(pollTask, 5000);
      return;
    } else {
      console.log("OLD UUID: " + uuid);
      uuid = data.uuid;
      console.log("NEW UUID: " + uuid);
      runnerWorker.postMessage(taskbuffer);
      console.log("sent buffer len"+taskbuffer.byteLength+" to worker");
      clearInterval(heartbeat);
      heartbeat = window.setInterval(function() {
        $.get("http://52.7.238.54:8080/heartbeat/"+taskid +'/'+uuid, function(data) {
          console.log(data);
        });
      }, 5000);
      currentArgArrs = data.argarr;
      numIters = currentArgArrs.length;
      runnerWorker.postMessage(currentArgArrs.pop());
    }
  });
}



// Create the XHR object.
function createCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {
    // XHR for Chrome/Firefox/Opera/Safari.
    xhr.open(method, url, true);
    xhr.setRequestHeader("Content-type", "text/plain");
  } else if (typeof XDomainRequest != "undefined") {
    // XDomainRequest for IE.
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    // CORS not supported.
    xhr = null;
  }
  return xhr;
}

function initHeap(progid, worker) {
  xhr = createCORSRequest('GET','http://52.7.238.54:8080/get-memory/'+progid);
  xhr.responseType = "arraybuffer";
  xhr.onload = function() {
    taskbuffer = xhr.response;
    runJobCycle(worker);
  };
  xhr.onerror = function() {
    alert("heap request failed");
  };
  xhr.send();

}
// Make the actual CORS request.
function makeCorsRequest(heap) {
  // All HTML5 Rocks properties support CORS.
  var url = 'http://52.7.238.54:8080/send-result/'+taskid+'/'+uuid;

  var xhr = createCORSRequest('POST', url);
  if (!xhr) {
    alert('CORS not supported');
    return;
  }

  // Response handlers.
  xhr.onload = function() {
    var text = xhr.responseText;
    console.log(text);
    clearInterval(heartbeat);
    heartbeat = window.setInterval(pollTask, 5000);
  };

  xhr.onerror = function() {
    alert('Woops, there was an error making the request.');
  };

  xhr.send(heap);
}
