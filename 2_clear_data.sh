#!/bin/bash

here=`pwd`
echo "clear data script called from $here"
echo "Clearing intermediate data"

echo
rm $here/data/*.lst
echo $here/data
ls $here/data

echo
find $here/data/svg/ -name "G*.svg" -print -maxdepth 1 | xargs -I % rm %
rm $here/data/svg/*.lst
echo $here/data/svg/G*.svg
ls $here/data/svg

echo
rm $here/data/gct/*.lst
find $here/data/gct/ -name "G*.txt" -print -maxdepth 1 | xargs -I % rm %
echo $here/data/gct
ls $here/data/gct

echo
find $here/data/gct/csv/ -name "G*.csv" -print -maxdepth 1 | xargs -I % rm %
rm $here/data/gct/csv/*.lst
echo $here/data/gct/csv
ls $here/data/gct/csv/

echo
find $here/data/gct/csv/mapped/ -name "G*.csv" -print -maxdepth 1 | xargs -I % rm %
rm $here/data/gct/csv/mapped/report.csv
echo $here/data/gct/csv/mapped
ls $here/data/gct/csv/mapped/

echo
find $here/data/gct/csv/mapped/sorted/ -name "G*.csv" -print -maxdepth 1 | xargs -I % rm %
echo $here/data/gct/csv/mapped/sorted
ls $here/data/gct/csv/mapped/sorted/

echo
find $here/data/gct/csv/mapped/sorted/pc_annotated/ -name "G*.csv" -print -maxdepth 1 | xargs -I % rm %
echo $here/data/gct/csv/mapped/sorted/pc_annotated
ls $here/data/gct/csv/mapped/sorted/pc_annotated/

echo
echo "Clearing generated model data"
echo
rm $here/model/unassigned.csv
rm $here/model/annotated_glycans.csv
rm $here/model/annotated_glycans.json
echo $here/model
ls $here/model/

echo
find $here/model/gTree_svg/ -name "G*.svg" -print -maxdepth 1 | xargs -I % rm %
echo $here/model/gTree_svg
ls $here/model/gTree_svg/

echo
find $here/model/GlycoCT_svg/ -name "G*.svg" -print -maxdepth 1 | xargs -I % rm %
echo $here/model/GlycoCT_svg
ls $here/model/GlycoCT_svg/ 

echo
find $here/model/json/ -name "G*.json" -print -maxdepth 1 | xargs -I % rm %
echo $here/model/json
ls $here/model/json/

echo
find $here/model/json/complete/ -name "G*.json" -print -maxdepth 1 | xargs -I % rm %
echo $here/model/json/complete
ls $here/model/json/complete/

echo
find $here/model/json/match/ -name "G*.json" -print -maxdepth 1 | xargs -I % rm %
echo $here/model/json/match
ls $here/model/json/match/

echo
echo $here

