mergeInto(LibraryManager.library, {
__kmpc_for_static_init_4u: function(loc, gtid, schedtype, plastiter, plower, pupper, pstride, incr, chunk)
{
    var args = Array.prototype.slice.call(arguments);
    Module.print(args);
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

    Module.print("PLOWER: "+ HEAP32[plower>>2]);
    Module.print("PUPPER: "+ HEAP32[pupper>>2]);



},
__kmpc_for_static_fini: function(loc, global_tid)
{

},
__atomic_compare_exchange: function()
{
    Module.print("in a cx");

},
__atomic_load: function()
{
    Module.print("atomic load");

},
__kmpc_reduce_nowait: function(loc, global_tid, num_vars, reduce_size,
                                 reduce_data,reduce_func,lck)
{
    Module.print("reduce nowait");

},

__kmpc_end_reduce_nowait: function(loc, global_tid, lck )
{
    Module.print("end reduce");

}
,



__kmpc_fork_call: function(loc, argc, microtask)
{
    var args = Array.prototype.slice.call(arguments);
    //module.print(HEAP32[args[3]>>2]);
    //module.print(HEAP32[(args[3]>>2)+1]);
    //module.print(HEAP32[(args[3]>>2)+2]);
    // module.print(HEAP32);

    var idlocs = [];
    var nth = ATLAS_NUM_THREADS;

    for (l=0; l < nth; l++)
    {
        idlocs.push(_malloc(4));
        HEAP32[idlocs[l]>>2] = l;
        //Module.print(HEAPU8[idlocs[l]])
    }
    Module.print(HEAP32.toString().length);
    for (l=0; l < nth; l++)
    {
        argarr = [idlocs[l],idlocs[l]];
        for (q=0; q<argc; q++)
        {
            argarr.push(HEAP32[(args[3]>>2)+q]);
        }
        Module.print(argarr);
        //Module.print(microtask);
        var stack = Runtime.stackSave();
       // Module.print(argarr.length);
        Runtime.dynCall('v'+'i'.repeat(argarr.length), microtask,argarr);
        Runtime.stackRestore(stack);
    }





},

});



