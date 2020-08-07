#!/bin/bash

if [ $# -lt 2 ]; then
 echo "Usage .[/codebase-directory]/sortCSV.sh [data-directory] [verbose-flag]"
 echo "You provided only $# argument(s) - 2 are required"
 exit
fi


count=0

for filename in $1/G*.csv; do
  fpath=${filename%/*} 
  fbase=${filename##*/}
  ffext=${fbase##*.}
  fpref=${fbase%.*}
  dest="sorted"
  sortedfile="$fpath/$dest/$fpref.csv"

  # verbose info about files processed
  if [ "$2" -gt 0 ]; then
    echo
    echo "sorting file: $filename"
    echo "result file: $sortedfile"
  fi

  sort -r -t, -k3 $filename > $sortedfile 

  let "count++"
done
