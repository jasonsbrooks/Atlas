var HEAPU8Copy;
var argarray = 'atlasArgarr';

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
	postMessage(JSON.stringify(changes));
}

function runCode() {
    var stack = Runtime.stackSave();
    Module.print(HEAPU8[argarray[0]]);
    Module.print(HEAP32[argarray[0]>>2]);
	Runtime.dynCall('v'+'i'.repeat(argarray.length), 'atlasMicrotask', argarray);
    Runtime.stackRestore(stack);
    Module.print(HEAPU8[argarray[0]]);
    Module.print(HEAP32[argarray[0]>>2]);
	diffHeap();
}

var Module = {
  'preInit': [],
  'preRun': [copyHeap],
  'noInitialRun': true,
};

