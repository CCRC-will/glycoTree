#!/bin/bash
## Usage: fetchSVGfiles.sh [template directory] [source directory] [destination directory] 
##  generates a list of csv files in $1 [template directory], changing extensions to .svg
##  copies files in the modified list from $2 [source] into $3 [destination]

here=`pwd`
t1=$here/log/temp1.lst
t2=$here/log/temp2.lst
s1=$here/log/svgfiles.lst
fd=$here/log/filediff.lst
fg=$here/log/files2get.lst

cd $1
## list accessions in template directory
for filename in G*.csv; do echo $filename; done > $t1
cd $here
sed 's/csv/svg/g' $t1 > $s1
echo
## copy files to destination directory
for file in `cat $s1`; do 
  if [ -e "$2$file" ]; then 
     cp "$2$file" $3
  else
    echo $file
  fi
done
