var HEAPU8Copy;

function initializeMemory() {
	Module.print("initializing memory");
	var heapArray = Int32Array.from('atlasHeapReplace');
	var TESTHEAPU8 = new Uint8Array(heapArray.buffer);
	Module.print(TESTHEAPU8.slice(5251270, 5251290));
	Module.print(TESTHEAPU8.slice(5251254, 5251274));
	updateGlobalBuffer(heapArray.buffer);
	updateGlobalBufferViews();
	Module.print(HEAP32[5251280>>2]);
}

function copyHeap() {
	// HEAP32 = new Int32Array(HEAPU8);
	HEAPU8Copy = new Uint8Array(HEAPU8);
	Module.print("we copying");
	runCode();
}

function diffHeap() {
	Module.print("we diffing");
	var changes = {}
	for (var i = 0; i < HEAPU8.length; i++) {
		if (HEAPU8[i] !== HEAPU8Copy[i]) {
			changes[i] = HEAPU8[i];
		}
	}
	makeCorsRequest(JSON.stringify(changes));
	Module.print(JSON.stringify(changes));
}

function runCode() {
    var stack = Runtime.stackSave();
    var argarray = 'atlasArgarr';
    Module.print(HEAPU8[argarray[0]]);
    Module.print(HEAP32[argarray[0]>>2]);
	Runtime.dynCall('v'+'i'.repeat(argarray.length), 'atlasMicrotask', argarray);
    Runtime.stackRestore(stack);
    Module.print(HEAPU8[argarray[0]]);
    Module.print(HEAP32[argarray[0]>>2]);
	diffHeap();
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
  var url = 'http://137.135.81.12:8080/send-result/123';

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


var Module = {
  'preInit': [],
  'preRun': [copyHeap],
  'noInitialRun': true,
};

