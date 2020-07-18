#!/bin/bash

echo Preparing directories
mkdir ./data
mkdir ./data/gct
mkdir ./data/gct/csv
mkdir ./data/gct/csv/mapped

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
java -jar ./code/TreeBuilder3.jar -l ./data/gct/csv/files.lst -s $sugar_file -c $node_file -n 3 -v 1 -m 3 -e 2 -o ./model/ext.csv > ./log/map.log

echo
echo Generating list of unassigned residues 
echo "glycan_ID,residue,residue_ID,name,anomer,absolute,ring,parent_ID,site,form_name" > ./model/unassigned.csv
grep -h "unassigned" ./data/gct/csv/mapped/G* >> ./model/unassigned.csv

echo
echo Annotating residues with biosynthetic enzymes 
awk -f ./code/mkCSVmap.awk $enzyme_file ./data/gct/csv/mapped/G*.csv  > ./model/annotated_glycans.csv

echo
echo Comparing number of lines in csv and mapped csv files
awk -v s="mapped" -f ./code/compareLineCount.awk data/gct/csv/G* > ./model/linecount.txt
