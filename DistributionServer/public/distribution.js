$(document).ready(function() {
  var runnerWorker;
  $.get("http://137.135.81.12:8080/current-task", function(data) {
      taskid = data;
      console.log("got new task: " + data);
      runnerWorker = new Worker("/static/tasks/"+taskid+".gz");
      runnerWorker.onmessage = function(e) {
          // result.textContent = e.data;
          console.log(e.data);
          $('body').append("<h2>Finished job.</h2>");
          $('body').append(e.data);
          console.log("message received from worker");
          makeCorsRequest(e.data);
          runJobCycle(runnerWorker);
      }
      runJobCycle(runnerWorker);
  });
});
var taskid;
var uuid;
var heartbeat;

function runJobCycle(runnerWorker) {
    $.get("http://137.135.81.12:8080/fetch-job/"+taskid, function(data) {
        if (data.success == false) {
            clearInterval(heartbeat);
            return;
        } else {
            uuid = data.uuid;
            heartbeat = window.setInterval(function() {
                $.get("http://137.135.81.12:8080/heartbeat/"+taskid +'/'+uuid, function(data) {
                    console.log(data);
                });
            }, 5000);
            runnerWorker.postMessage(data.argarr);
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

// Make the actual CORS request.
function makeCorsRequest(heap) {
  // All HTML5 Rocks properties support CORS.
  var url = 'http://137.135.81.12:8080/send-result/'+taskid+'/'+uuid;

  var xhr = createCORSRequest('POST', url);
  if (!xhr) {
    alert('CORS not supported');
    return;
  }

  // Response handlers.
  xhr.onload = function() {
    var text = xhr.responseText;
    console.log(text);
  };

  xhr.onerror = function() {
    alert('Woops, there was an error making the request.');
  };

  xhr.send(heap);
}
