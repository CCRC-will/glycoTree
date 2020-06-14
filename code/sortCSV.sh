#!/bin/bash
if [ "$#" -lt 1 ]; then
 echo "Usage ./sortCSV.sh [data-directory] [verbose-flag]"
 echo "Positional Parameters"
 echo '$0 = ' $0
 echo '$1 = ' $1
 echo '$2 = ' $2
fi


count=0

for filename in $1/G*.csv; do
  fpath=${filename%/*} 
  fbase=${filename##*/}
  ffext=${fbase##*.}
  fpref=${fbase%.*}

## TODO: path names need to be set from command line args
  acsv="$fpath/annotated/$fpref.csv"
  sortedcsv="$fpath/sorted/$fpref.csv"

 # verbose info about files processed
 if [ "$2" -gt 0 ]; then
  echo
  echo "count is "$count
  echo "file is $filename"
  echo "base is $fbase"
  echo "sorted file is $sortedcsv"
 fi

 sort -t, -gk9 $filename > $sortedcsv 
 if [ "$2" -gt 0 ]; then
    echo "sort -t, -gk9 $csv > $sortedcsv"
    ls -l $sortedcsv
 fi

 let "count++"
#fi
done
