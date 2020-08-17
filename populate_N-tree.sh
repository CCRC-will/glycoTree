#!/bin/bash

echo Preparing directories
mkdir ./data/gct
mkdir ./data/gct/csv
mkdir ./data/gct/csv/mapped
mkdir ./data/gct/csv/mapped/sorted
mkdir ./data/svg
mkdir ./model/gTree_svg
mkdir ./model/GlycoCT_svg
mkdir ./model/json


echo
echo Extracting GlycoCT files
awk -f ./code/gctExtract.awk ./data/mammal_N-glycans.json 
echo copying extra GlycoCT files
cp ./data/gct/extra/G*.txt ./data/gct/

echo
echo Generating list of extracted GlycoCT files
ls -1 ./data/gct/G*.txt > ./data/gct/files.lst

echo
echo Generating glycoTree csv files
java -jar ./code/GenerateCSV.jar ./data/gct/files.lst list 0 > ./log/csv.log

echo
echo Generating list of glycoTree csv files
ls -1 ./data/gct/csv/G*.csv > ./data/gct/csv/files.lst

echo
echo Fetching current model files

node_file=`ls ./model/N-nodes*.csv`
echo using node file $node_file

sugar_file=`ls ./model/sugars*.csv`
echo using sugar file $sugar_file

enzyme_file=`ls ./model/enzyme-mappings*.csv`
echo using enzyme file $enzyme_file

echo
echo Mapping residues in csv files to canonical tree 
java -jar ./code/TreeBuilder3.jar -l ./data/gct/csv/files.lst -s $sugar_file -c $node_file -n 1 -v 1 -m 3 -e 2 -o ./model/ext.csv > ./log/map.log

echo 
echo Sorting mapped residues
./code/sortCSV.sh ./data/gct/csv/mapped 0

echo
echo Adding PubChem IDs
awk -v out="./data/gct/csv/mapped/sorted/pc_annotated/" -f ./code/addPCids.awk ./model/pc_sugars.csv ./data/gct/csv/mapped/sorted/G*.csv

echo
echo Generating list of unassigned residues 
echo "glycan_ID,residue,residue_ID,name,anomer,absolute,ring,parent_ID,site,form_name" > ./model/unassigned.csv
grep -h "unassigned" ./data/gct/csv/mapped/sorted/pc_annotated/G* >> ./model/unassigned.csv

echo
echo Annotating residues with biosynthetic enzymes in csv format
awk -f ./code/mkCSVmap.awk $enzyme_file ./data/gct/csv/mapped/sorted/pc_annotated/G*.csv  > ./model/annotated_glycans.csv

if [ $# -gt 0 ]; then
  echo
  echo fetching svg files from $1
  ./fetchSVGfiles.sh ./data/gct/csv/mapped/sorted/pc_annotated/ $1 ./data/svg/
fi

echo
echo Generating a list of original svg files 
ls -1 ./data/svg/G*.svg > ./data/svg/files.lst

echo
echo Flattening svg files
echo semantic annotation of svg encoding with canonical IDs
java -jar ./code/SVGflatten.jar -l ./data/svg/files.lst -c ./data/gct/csv/mapped -a gTree -o ./model/gTree_svg -m ./model/map_gTree.csv -v 1 -r 1 > ./log/gTree_svg.log
echo semantic annotation of svg encoding with GlycoCT indices
java -jar ./code/SVGflatten.jar -l ./data/svg/files.lst -c ./data/gct/csv -a GlycoCT -o ./model/GlycoCT_svg -m ./model/map_GlycoCT.csv -v 1 -r 1 > ./log/GlycoCT_svg.log

echo
echo Combining semantic id map files
awk -f ./code/hashem.awk ./model/map_gTree.csv ./model/map_GlycoCT.csv > ./model/map_both.csv

echo
echo Annotating residues with biosynthetic enzymes - results in single large json file
awk -f ./code/mkJSONmap.awk $enzyme_file ./data/gct/csv/mapped/sorted/pc_annotated/G*.csv  > ./model/annotated_glycans.json
echo
echo Annotating residues with biosynthetic enzymes - results in one json file for each structure
awk -f ./code/mkJSONmanyMaps.awk $enzyme_file ./data/gct/csv/mapped/sorted/pc_annotated/G*.csv

