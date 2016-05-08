var HEAPU8Copy;
var argarray;

function initializeMemory(buf) {
    Module.print("initializing memory");
    Module.print(buf.byteLength);
    debugger;
    updateGlobalBuffer(buf);
    updateGlobalBufferViews();
    _emscripten_replace_memory(buf);
}

function copyHeap() {
    // HEAP32 = new Int32Array(HEAPU8);
    //var dst = new ArrayBuffer(Module['buffer'].byteLength);
    HEAPU8Copy = new Uint8Array(HEAPU8);

    //HEAPU8Copy.set(HEAPU8);
    Module.print("we copying");
    debugger;
    runCode();
}

function diffHeap() {
    Module.print("we diffing");
    var changes = {};
    for (var i = 0; i < HEAPU8.length; i++) {
        if (HEAPU8[i] !== HEAPU8Copy[i]) {
            changes[i] = HEAPU8[i];
        }
    }
    postMessage(JSON.stringify(changes));
}

function runCode() {
    var stack = Runtime.stackSave();
    Runtime.dynCall('v'+'i'.repeat(argarray.length), "atlasMicrotask", argarray);
    Runtime.stackRestore(stack);
    debugger;
    diffHeap();
}

var Module = {
  'preInit': [],
  'preRun': [copyHeap],
  'noInitialRun': true,
  'retainer':initializeMemory

};

