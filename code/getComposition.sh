#!/bin/bash

echo -n "Please enter the ID of a canonical node that requires the presence of another canonical node: "
read c1

echo -n "Please enter the ID of the canonical node that is required: "
read c2

errStr="Exiting because you did not enter canonical ids!"
if [ -z "$c1" ]; then 
  echo $errStr; 
  exit;
fi
if [ -z "$c2" ]; then 
  echo $errStr; 
  exit;
fi

## must be run from directory holding the G* files

## echo "First node: $c1"
## grep "[0-9],$c1," G* | cut -f 1 -d : | xargs  -I{} awk 'BEGIN {FS=","} FNR == 1 {printf("\n%s:  ", FILENAME);} FNR > 1 {printf(" %s ", $3);}' {}
## echo
## echo

## find all files containing canonical residue c1 and write to file
grep "[0-9],$c1," G* | cut -f 1 -d : | xargs  -I{} awk 'BEGIN {FS=","} FNR == 1 {printf("\n%s:  ", FILENAME);} FNR > 1 {printf("%s\t", $3);}' {} > found.tsv

## search file found.tsv for lines that contain c2
echo
echo "structures containing BOTH $c1 and $c2"
grep $c2 found.tsv | cut -f 1 -d .

## search file found.txt for lines that do not contain c2
echo
echo "structures containing $c1 BUT NOT $c2"
grep -v $c2 found.tsv | cut -f 1 -d .

## clean up
rm found.tsv

