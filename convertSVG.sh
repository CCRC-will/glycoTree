#!/bin/bash

echo Preparing directories
mkdir ./data/svg/gTree_svg
mkdir ./data/svg/GlycoCT_svg

echo
echo Generating a list of original svg files 
ls -1 ./data/svg/G*.svg > ./data/svg/files.lst

echo
echo Flattening svg files
echo semantic annotation of svg encoding with canonical IDs
java -jar ./code/SVGflatten.jar -l ./data/svg/files.lst -c ./data/gct/csv/mapped -a gTree -o ./data/svg/gTree_svg -m ./model/map_gTree.csv -v 1 -r 1 > ./log/gTree_svg.log
echo semantic annotation of svg encoding with GlycoCT indices
java -jar ./code/SVGflatten.jar -l ./data/svg/files.lst -c ./data/gct/csv -a GlycoCT -o ./data/svg/GlycoCT_svg -m ./model/map_GlycoCT.csv -v 1 -r 1 > ./log/GlycoCT_svg.log

