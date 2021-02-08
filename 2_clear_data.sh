#!/bin/bash

here=`pwd`
echo "The script (2_clear_data.sh) was called from $here"
echo "Removing intermediate GlycoTree data"

echo
echo "Removing lists from $here/data"
rm $here/data/*.lst
echo "### Files in directory $here/data ###"
ls -F $here/data

echo
echo "Removing svg and lst files from $here/data/svg"
find $here/data/svg/ -name "G*.svg" -print -maxdepth 1 | xargs -I % rm %
rm $here/data/svg/*.lst
echo "### Files in directory $here/data/svg ###"
ls -F $here/data/svg

echo
echo "Removing txt and lst files from $here/data/gct"
rm $here/data/gct/*.lst
find $here/data/gct/ -name "G*.txt" -print -maxdepth 1 | xargs -I % rm %
echo "### Files in directory $here/data/gct ###"
ls -F $here/data/gct

echo
echo "Removing csv and lst files from $here/data/gct/csv"
find $here/data/gct/csv/ -name "G*.csv" -print -maxdepth 1 | xargs -I % rm %
rm $here/data/gct/csv/*.lst
echo "### Files in directory $here/data/gct/csv ###"
ls -F $here/data/gct/csv/

echo
echo "Removing csv files from $here/data/gct/csv/mapped"
find $here/data/gct/csv/mapped/ -name "G*.csv" -print -maxdepth 1 | xargs -I % rm %
rm $here/data/gct/csv/mapped/report.csv
rm $here/data/gct/csv/mapped/files.lst
echo "### Files in directory $here/data/gct/csv/mapped ###"
ls -F $here/data/gct/csv/mapped/

echo
echo "Removing csv files from $here/data/gct/csv/mapped/sorted"
find $here/data/gct/csv/mapped/sorted/ -name "G*.csv" -print -maxdepth 1 | xargs -I % rm %
echo "### Files in directory $here/data/gct/csv/mapped/sorted ###"
ls -F $here/data/gct/csv/mapped/sorted/

echo
echo "Removing csv files from $here/data/gct/csv/mapped/sorted/pc_annotated"
find $here/data/gct/csv/mapped/sorted/pc_annotated/ -name "G*.csv" -print -maxdepth 1 | xargs -I % rm %
echo "### Files in directory $here/data/gct/csv/mapped/sorted/pc_annotated ###"
ls -F $here/data/gct/csv/mapped/sorted/pc_annotated/

echo
echo "Removing model data that was auto-generated"
echo
rm $here/model/unassigned.csv
rm $here/model/annotated_glycans.csv
rm $here/model/annotated_glycans.json
rm $here/model/glycansLackingSVG.lst
echo "### Files in directory $here/model ###"
ls -F $here/model/

echo
echo "Removing svg files from $here/model/gTree_svg"
find $here/model/gTree_svg/ -name "G*.svg" -print -maxdepth 1 | xargs -I % rm %
echo "### Files in directory $here/model/gTree_svg ###"
ls -F $here/model/gTree_svg/

echo
echo "Removing svg files from $here/model/GlycoCT_svg"
find $here/model/GlycoCT_svg/ -name "G*.svg" -print -maxdepth 1 | xargs -I % rm %
echo "### Files in directory $here/model/GlycoCT_svg ###"
ls -F $here/model/GlycoCT_svg/ 

echo
echo "Removing json files from $here/model/json"
find $here/model/json/ -name "G*.json" -print -maxdepth 1 | xargs -I % rm %
echo "### Files in directory $here/model/json ###"
ls -F $here/model/json/

echo
echo "Removing json files from $here/model/json/complete"
find $here/model/json/complete/ -name "G*.json" -print -maxdepth 1 | xargs -I % rm %
echo "### Files in directory $here/model/json/complete ###"
ls -F $here/model/json/complete/

echo
echo "Removing json files from $here/model/json/match"
find $here/model/json/match/ -name "G*.json" -print -maxdepth 1 | xargs -I % rm %
echo "### Files in directory $here/model/json/match ###"
ls -F $here/model/json/match/

echo
echo "Removing json files from $here/portal/json"
find $here/model/portal/json/ -name "G*.json" -print -maxdepth 1 | xargs -I % rm %
echo "### Files in directory $here/portal/json ###"
ls -F $here/portal/json/

echo
echo "Removing svg files from $here/portal/svg"
find $here/model/portal/svg/ -name "G*.svg" -print -maxdepth 1 | xargs -I % rm %
echo "### Files in directory $here/portal/svg ###"
ls -F $here/portal/svg

echo
echo "Current directory is $here"
echo

