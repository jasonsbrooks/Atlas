#!/usr/bin/python2

import argparse
import os
import subprocess
import shutil


COMPILER = "emcc"
O_LEVEL = "-O3"
FLAGS = ["-fopenmp "]

def setFlags(args,LIB_FILE):
    global LIB_FILES
    if args.serial:
        LOCAL_FLAGS = O_LEVEL +  " --js-library " + os.path.basename(LIB_FILE) + " --memory-init-file 0"
        FLAGS.append((LOCAL_FLAGS,"_local.js"))
        LIB_FILES = [LIB_FILE]
    else:
        SERVER_FLAGS = O_LEVEL + " --js-library " + os.path.basename(LIB_FILE) + " --memory-init-file 0"
        FLAGS.append((SERVER_FLAGS,"_server.js"))
        CLIENT_FLAGS = O_LEVEL + " --js-library " + os.path.basename(LIB_FILE) + " --memory-init-file 0 --pre-js preAdd.js"
        FLAGS.append((CLIENT_FLAGS,"_client.js"))
        LIB_FILES = [LIB_FILE, "lib/preAdd.js"]


parser = argparse.ArgumentParser(description = "Distributed OpenMP runtime for Emscripten")
parser.add_argument('--serial', action='store_true', help='execute serially (no distribution)')
parser.add_argument('--jobs', default=10, help="number of jobs (if specified in C file)")
parser.add_argument('-o', metavar="output", help='output basename', required=True)
parser.add_argument('files', metavar='source files', type = str, nargs='*', help='all C source files that need to be compiled, along with compiler flags')

args = parser.parse_args()

if args.serial:
    LIB_FILE = "lib/libSerial.js"
else:
    LIB_FILE = "lib/lib.js"

setFlags(args,LIB_FILE)

CURDIR = os.getcwd()
WORKDIR = os.path.join(CURDIR,"tmp")
try:
    os.mkdir(WORKDIR)
except:
    shutil.rmtree(WORKDIR)
    os.mkdir(WORKDIR)

for f in args.files:
    print os.path.join(CURDIR,f)
    shutil.copy(os.path.join(CURDIR,f), WORKDIR)

for f in LIB_FILES:
    shutil.copy(os.path.join(CURDIR,f), WORKDIR)

os.chdir(WORKDIR)
with open(os.path.basename(LIB_FILE),'r+') as f:
    libtxt = f.read()
    subtxt = libtxt.replace("ATLAS_NUM_THREADS",str(args.jobs))
    f.seek(0)
    f.write(subtxt)
    f.truncate()


for flag in FLAGS:
    subprocess.call([COMPILER] + map(os.path.basename,args.files)+flag[0].split()+["-o",args.o+flag[1]])

for flag in FLAGS:
    shutil.copy(os.path.join(WORKDIR,args.o+flag[1]),CURDIR)

os.chdir(CURDIR)
shutil.rmtree(WORKDIR)
