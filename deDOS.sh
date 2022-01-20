#!/bin/bash
time=$(date +%s)

mDir=$1
for filename in *canonical_residues.csv; do 
  echo "Removing problematic characters in $filename"; 
  cp $filename ./bak/$time.$filename
  sed -i.bak -e $'s/\xC2\xA0/ /g' -e $'s/\x0D//g' $filename
  rm $filename.bak
  echo "searching for non-breaking spaces in $filename:\n"
  awk '/\xC2\xA0/ { printf("\n%s line %d\n%s",FILENAME,FNR,$0); }' $filename
  echo "searching for carriage returns in $filename:\n"
  awk '/\x0D/ { printf("\n%s line %d\n%s",FILENAME,FNR,$0); }' $filename
done

