mergeInto(LibraryManager.library, {
__kmpc_for_static_init_4u: function(loc, gtid, schedtype, plastiter, plower, pupper, pstride, incr, chunk)
{
    var args = Array.prototype.slice.call(arguments);
    //Module.print(args);
    var span = chunk*incr;
    var nth = ATLAS_NUM_THREADS;
    if (schedtype == 34)
    {

        var tripcount = (HEAP32[pupper>>2]-HEAP32[plower>>2])/incr + 1;
        var small_chunk = (tripcount/nth) | 0;
        var extras = tripcount - (small_chunk)*nth;
        HEAP32[pstride>>2] = nth * small_chunk;
        HEAP32[plower>>2] = HEAP32[plower>>2] +
            incr * (gtid * small_chunk + (gtid<extras?gtid:extras))
        HEAP32[pupper>>2] = HEAP32[plower>>2] +
            small_chunk * incr - (gtid < extras ? 0 : incr  );
        if (gtid == nth - 1) HEAP32[plastiter>>2] = 1;
    }
    else if (schedtype == 33)
    {
        HEAP32[pstride>>2] = nth * span;
        HEAP32[plower>>2] = HEAP32[plower>>2] + span*gtid;
        HEAP32[pupper>>2] = HEAP32[plower>>2] + span - incr;
        if (gtid == nth - 1) HEAP32[plastiter>>2] = 1;
    }
},
__kmpc_for_static_init_4: function(loc, gtid, schedtype, plastiter, plower, pupper, pstride, incr, chunk)
{
    var args = Array.prototype.slice.call(arguments);
    //Module.print(args);
    var span = chunk*incr;
    var nth = ATLAS_NUM_THREADS;
    if (schedtype == 34)
    {

        var tripcount = (HEAP32[pupper>>2]-HEAP32[plower>>2])/incr + 1;
        var small_chunk = (tripcount/nth) | 0;
        var extras = tripcount - (small_chunk)*nth;
        HEAP32[pstride>>2] = nth * small_chunk;
        HEAP32[plower>>2] = HEAP32[plower>>2] +
            incr * (gtid * small_chunk + (gtid<extras?gtid:extras))
        HEAP32[pupper>>2] = HEAP32[plower>>2] +
            small_chunk * incr - (gtid < extras ? 0 : incr  );
        if (gtid == nth - 1) HEAP32[plastiter>>2] = 1;
    }
    else if (schedtype == 33)
    {
        HEAP32[pstride>>2] = nth * span;
        HEAP32[plower>>2] = HEAP32[plower>>2] + span*gtid;
        HEAP32[pupper>>2] = HEAP32[plower>>2] + span - incr;
        if (gtid == nth - 1) HEAP32[plastiter>>2] = 1;
    }
},
__kmpc_reduce_nowait: function(loc, global_tid, num_vars, reduce_size,
                                 reduce_data,reduce_func,lck)
{
    return 2;
},

__kmpc_end_reduce_nowait: function(loc, global_tid, lck )
{
    Module.print("end reduce");

}
,

__kmpc_for_static_fini: function(loc, global_tid)
{

},

__kmpc_fork_call: function(loc, argc, microtask)
{
    var args = Array.prototype.slice.call(arguments);
    //module.print(args);
    //module.print(HEAP32[args[3]>>2]);
    //module.print(HEAP32[(args[3]>>2)+1]);
    //module.print(HEAP32[(args[3]>>2)+2]);
    // module.print(HEAP32);

    var request = require('sync-request');
    var output = Module['read']('ATLAS_BASENAME_client.js', false);
    var idlocs = [];
    var nth = ATLAS_NUM_THREADS;

    for (l = 0; l < nth; l++)
    {
        idlocs.push(_malloc(4));
        HEAP32[idlocs[l]>>2] = l;
        //Module.print(HEAPU8[idlocs[l]])
    }
    //Module.print(HEAP32.toString().length);
    var idres = request('POST','http://localhost:8080/initialize-task', {json:{'file':output,'microtask':microtask,'nth':nth}});
    var uuid = idres.getBody('utf8');
    const viewbuf = Buffer.from(HEAPU8);
    var origbufsize = Module['buffer'].byteLength;
    var buf = new Buffer(Math.ceil(origbufsize/4)*4);
    viewbuf.copy(buf);
    Module.print("length: " + buf.byteLength);
    request('POST','http://localhost:8080/initialize-mem/'+uuid, {body:buf,headers:{'Content-type':'application/octet-stream'}});

    for (l = 0; l < nth; l++)
    {
        argarr = [idlocs[l],idlocs[l]];
        for (q = 0; q < argc; q++)
        {
            argarr.push(HEAP32[(args[3]>>2)+q]);
        }
        Module.print(argarr);
        //Module.print(microtask);
        var res = request('POST','http://localhost:8080/send-job/'+uuid, {json:{'args':argarr, 'jobID':l}});
        //var stack = Runtime.stackSave();
        //Runtime.dynCall('viiii', microtask,argarr);
        //Runtime.stackRestore(stack);
    }
    var success = false;
    var j;
    while (success == false) {
        var res = request('GET','http://localhost:8080/pool-results/'+uuid);
        var j = JSON.parse(res.getBody('utf8'));
        success = j['success'];
    }
    Module.print("done");
    var heap = j['heapChanges'];
    for (key in heap) {
        HEAPU8[key] = heap[key];
    }





},

});



