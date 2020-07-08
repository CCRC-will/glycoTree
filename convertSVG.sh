#!/bin/bash

# This script only processes structures whose csv encodings are in the directories:
#	./data/def/csv/mapped
#	./data/def/csv/

#  Additional setup is required to process structures whose csv encodings are in the directories
#	./data/und/csv/mapped
#	./data/und/csv/

echo Preparing directories
mkdir ./data/svg/svg_gTree
mkdir ./data/svg/svg_GlycoCT

echo
echo Generating a list of original svg files 
#  TODO: make another directory containing the "und" svg files.  ./data/svg/ contains only "def" svg files
#     This will change the following command (split it and use different directories)
ls -1 ./data/svg/G*.svg > ./data/svg/files.lst

echo
echo Flattening svg files
echo semantic annotation of svg encoding with canonical IDs
java -jar ./code/SVGflatten.jar -l ./data/svg/files.lst -c ./data/def/csv/mapped -a gTree.v2.0 -o ./data/svg/svg_gTree -v 0 > ./log/def_svg.log
echo semantic annotation of svg encoding with GlycoCT indices
java -jar ./code/SVGflatten.jar -l ./data/svg/files.lst -c ./data/def/csv -a GlycoCT -o ./data/svg/svg_GlycoCT -v 0 > ./log/def_svg_GlycoCT.log
echo Processing "und" files will require two additional java commands

