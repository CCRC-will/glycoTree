#!/bin/bash
## Usage: fetchSVGfiles.sh [template directory] [source directory] [destination directory]
##  generates a list of csv files in $1 [template directory], changing extensions to .svg
##  copies files in the modified list from $2 [source] into $3 [destination]

here=`pwd`
cd $1
ls -1 G*.csv > temp.lst
mv temp.lst $here
cd $here
sed 's/csv/svg/g' temp.lst > svgfiles.lst
cd $2
ls -1 > temp.lst
mv temp.lst $here
cd $here
diff -y  temp.lst svgfiles.lst > filediff.lst
awk -v dir=$2 '$0 !~ "<" {print dir $1}' filediff.lst > files2get.lst
for file in `cat files2get.lst`; do cp "$file" $3 ; done
rm files2get.lst
rm temp.lst
rm filediff.lst
rm svgfiles.lst
