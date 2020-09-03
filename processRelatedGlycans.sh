#!/bin/bash
## Usage: ./generateCompositionComparisons.sh
##  creates lists of residue compositions of fully assigned glycoTree csv files
##    then makes square matrix of residue matches for each pair of structures
##      then makes json files describing the structures most closely related to each structure

echo calculating structure compositions
awk -f ./code/mkComps.awk ./data/gct/csv/mapped/sorted/pc_annotated/G*.csv > ./model/correlation/resComps.csv

echo matching residue compositions
awk -f ./code/comp2match.awk ./model/correlation/resComps.csv > ./model/correlation/resMatch.csv

echo generating match json files
awk -v out="./model/json/match" -f ./code/mkMatchJSON.awk ./model/correlation/resMatch.csv ./model/correlation/resMatch.csv

echo appending json files with related glycan data
awk -f ./code/appendJSON.awk -v inDir="./model/json/match" -v outDir="./model/json/complete"  -v exclude="probe_acc" ./model/json/G*.json
