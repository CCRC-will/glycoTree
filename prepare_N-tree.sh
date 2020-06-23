#!/bin/bash

echo
echo renaming and moving api.glygen.org to ./data/

mkdir ./data	
mv api.glygen.org.json ./data/mammal_N-glycans.json

echo
echo fetching fully_determined.zip file from github

curl -o ./data/fully_determined.zip https://raw.githubusercontent.com/glygen-glycan-data/PyGly/master/smw/glycandata/export/fully_determined.zip

echo
echo unpacking 'fully_determined.zip'

cd ./data/
pwd
mkdir fully_determined
tar -xf fully_determined.zip -C fully_determined

echo
echo Extracting file list from csv file ...

cd ..
pwd
awk -f ./code/extractFilenames_json.awk ./data/mammal_N-glycans.json > ./data/mammal_N-glycans.lst

echo
echo Generating fully-determined files.lst

cd ./data/fully_determined/
ls -1 G[0-3]*.txt > files.lst
ls -1 G[4-6]*.txt >> files.lst
ls -1 G[7-9]*.txt >> files.lst

echo
echo Calculating intersection of files - VERY SLOW

cd ../..
pwd
awk -f ./code/intersect.awk ./data/mammal_N-glycans.lst ./data/fully_determined/files.lst > ./data/complete.lst 

echo
echo Resolving paths

awk -v d="./data/fully_determined/" '{printf("%s%s\n", d, $1);}' ./data/complete.lst > ./data/complete_paths.lst

echo
echo Converting GlycoCT to csv files

mkdir ./data/fully_determined/csv
mkdir ./log

java -jar ./code/GenerateCSV.jar ./data/complete_paths.lst list 0 > ./log/make_csv.txt

echo
echo generating csv "files.lst"
ls -1 ./data/fully_determined/csv/G* > ./data/fully_determined/csv/files.lst

echo
echo mapping residues to canonical tree

node_file=`ls ./model/N-nodes*.csv`
echo using node file $node_file
sugar_file=`ls ./model/sugars*.csv`
echo using sugar file $sugar_file

mkdir ./data/fully_determined/csv/mapped

java -jar ./code/TreeBuilder3.jar -l ./data/fully_determined/csv/files.lst -s $sugar_file -c $node_file -n 3 -v 1 -m 3 -e 2 -o ./model/ext.csv > ./log/map_residues.txt

grep -h "unassigned" ./data/fully_determined/csv/mapped/G* > ./model/unassigned.csv

echo
echo annotating residues with enzyme information

enzyme_file=`ls ./model/enzyme-mappings*.csv`
echo using enzyme file $enzyme_file
awk -f ./code/mkCSVmap.awk $enzyme_file ./data/fully_determined/csv/mapped/G*.csv  > ./model/annotated_residues.csv
