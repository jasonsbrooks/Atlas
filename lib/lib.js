mergeInto(LibraryManager.library, {
__kmpc_for_static_init_4u: function(loc, gtid, schedtype, plastiter, plower, pupper, pstride, incr, chunk)
{
    var args = Array.prototype.slice.call(arguments);
    //Module.print(args);
    span = chunk*incr;
    nth = chunk;
    HEAP32[pstride>>2] = nth * span;
    HEAP32[plower>>2] = HEAP32[plower>>2] + span*gtid;
    HEAP32[pupper>>2] = HEAP32[plower>>2] + span - incr;
    if (gtid == nth - 1) HEAP32[plastiter>>2] = 1;




},
__kmpc_for_static_fini: function(loc, global_tid)
{

},

// sendjsprogramcontents: function(contents)
// {
//  var querystring = require('querystring');
//  var http = require('http');
//   // build the post string from an object
//  var post_data = querystring.stringify({
//    'program' : contents,
//  });

//  // an object of options to indicate where to post to
//  var post_options = {
//    host: 'localhost',
//    port: '8080',
//    path: '/send-job/123',
//    method: 'post',
//    headers: {
//        'content-type': 'application/x-www-form-urlencoded',
//        'content-length': buffer.bytelength(post_data)
//    }
//  };

//  // set up the request
//  var post_req = http.request(post_options, function(res) {
//    res.setencoding('utf8');
//    res.on('data', function (chunk) {
//        console.log('response: ' + chunk);
//    });
//  });

//  // post the data
//  post_req.write(post_data);
//  post_req.end();


// },

__kmpc_fork_call: function(loc, argc, microtask)
{
    var args = Array.prototype.slice.call(arguments);
    //module.print(args);
    //module.print(HEAP32[args[3]>>2]);
    //module.print(HEAP32[(args[3]>>2)+1]);
    //module.print(HEAP32[(args[3]>>2)+2]);
    // module.print(HEAP32);

    var request = require('sync-request');
    var output = Module['read']('add_client.js', false);
    var idlocs = [];

    for (l=0; l< 10; l++)
    {
        idlocs.push(_malloc(4));
        HEAP32[idlocs[l]>>2] = l;
        Module.print(HEAPU8[idlocs[l]])
    }
    Module.print(HEAP32.toString().length);
    request('POST','http://localhost:8080/initialize-job/123', {json:{'file':output,'heap':HEAP32.toString(),'microtask':microtask}});
    for (l=0; l<10; l++)
    {
        argarr = [idlocs[l],idlocs[l]];
        for (q=0; q<argc; q++)
        {
            argarr.push(HEAP32[(args[3]>>2)+q]);
        }
        Module.print(argarr);
        Module.print(microtask);
        var res = request('POST','http://localhost:8080/send-job/123', {json:{'args':argarr, 'jobID':l}});
        //var stack = Runtime.stackSave();
        //Runtime.dynCall('viiii', microtask,argarr);
        //Runtime.stackRestore(stack);
    }
    success = false;
    var j;
    while (success == false) {
        var res = request('GET','http://localhost:8080/pool-results/123');
        var j = JSON.parse(res.getBody('utf8'));
        success = j['success'];
    }
    var heap = j['heapChanges'];
    for (key in heap) {
        HEAPU8[key] = heap[key];
    }





},

});



