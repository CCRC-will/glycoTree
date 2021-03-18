#!/bin/bash
## Usage: ./processRelatedGlycans.sh
##  creates lists of residue compositions of fully assigned glycoTree csv files
##    ONLY FULLY ASSIGNED FILES ARE PROCESSED!  FILES THAT CONTAIN ANY UNASSIGNED RESIDUES ARE IGNORED!!
##    then makes square matrix of residue matches for each pair of structures
##      then makes json files describing the structures most closely related to each structure

echo calculating structure compositions
echo "accession,composition_string" > ./model/correlation/resComps.csv

find ./data/gct/csv/mapped/sorted/ -name "G*.csv" -print -maxdepth 1 | xargs -I % awk -f ./code/mkComps.awk % >> ./model/correlation/resComps.csv

echo matching residue compositions
awk -f ./code/comp2match.awk ./model/correlation/resComps.csv > ./model/correlation/resMatch.csv

echo generating match json files
awk -v out="./model/json/match" -f ./code/mkMatchJSON.awk ./model/correlation/resMatch.csv ./model/correlation/resMatch.csv

echo appending json files with related glycan data
find ./model/json/ -name "G*.json" -print -maxdepth 1 | xargs -I % awk -f ./code/appendJSON.awk -v inDir="./model/json/match" -v outDir="./model/json/complete"  -v exclude="probe_acc" %
