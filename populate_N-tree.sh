#!/bin/bash

echo Preparing directories
mkdir ./data
mkdir ./data/def
mkdir ./data/und
mkdir ./data/def/csv
mkdir ./data/und/csv
mkdir ./data/def/csv/mapped
mkdir ./data/und/csv/mapped

echo
echo Extracting GlycoCT files
awk -f ./code/gctExtract.awk ./data/mammal_N-glycans.json 

echo
echo Generating lists of extracted GlycoCT files
ls -1 ./data/def/G*.txt > ./data/def/files.lst
ls -1 ./data/und/G*.txt > ./data/und/files.lst

echo
echo Generating glycoTree csv files
java -jar ./code/GenerateCSV.jar ./data/def/files.lst list 0 > ./log/def_csv.log
java -jar ./code/GenerateCSV.jar ./data/und/files.lst list 0 > ./log/und_csv.log

echo
echo Generating lists of glycoTree csv files
ls -1 ./data/def/csv/G*.csv > ./data/def/csv/files.lst
ls -1 ./data/und/csv/G*.csv > ./data/und/csv/files.lst

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
java -jar ./code/TreeBuilder3.jar -l ./data/def/csv/files.lst -s $sugar_file -c $node_file -n 3 -v 1 -m 3 -e 2 -o ./model/ext_def.csv > ./log/csv_map_def.log
java -jar ./code/TreeBuilder3.jar -l ./data/und/csv/files.lst -s $sugar_file -c $node_file -n 3 -v 1 -m 3 -e 2 -o ./model/ext_und.csv > ./log/csv_map_und.log

echo
echo Generating lists of unassigned residues 
echo "glycan_ID,residue,residue_ID,name,anomer,absolute,ring,parent_ID,site,form_name" > ./model/unassigned_def.csv
echo "glycan_ID,residue,residue_ID,name,anomer,absolute,ring,parent_ID,site,form_name" > ./model/unassigned_und.csv
grep -h "unassigned" ./data/def/csv/mapped/G* >> ./model/unassigned_def.csv
grep -h "unassigned" ./data/und/csv/mapped/G* >> ./model/unassigned_und.csv

echo
echo Annotating residues with biosynthetic enzymes 
awk -f ./code/mkCSVmap.awk $enzyme_file ./data/def/csv/mapped/G*.csv  > ./model/annotated_def.csv
awk -f ./code/mkCSVmap.awk $enzyme_file ./data/und/csv/mapped/G*.csv  > ./model/annotated_und.csv

echo
echo Comparing number of lines in csv and mapped csv files
awk -v s="mapped" -f compareLineCount.awk data/def/csv/G* > ./model/linecount_def.txt
awk -v s="mapped" -f compareLineCount.awk data/und/csv/G* > ./model/linecount_und.txt
