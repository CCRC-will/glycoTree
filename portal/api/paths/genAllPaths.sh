#!/bin/bash
# Usage: ./genAllPaths.sh [accessions filename] [output file]
#   Example:
#              ./genAllPaths.sh ./mappedNglycans.txt ./allPaths.json

echo -n "password:  "
read pw

input_file=$1
output_file=$2

now=$(date)

n=0
# first line of output file
echo "{ \"date\": \"$now\"," > $output_file
echo " \"pathways\": [" >> $output_file
while read line; do
  if [ $n -gt 0 ]
  then
    echo "," >> $output_file
  fi
  n=$((n+1))
  php genPath_v2.php fmt=json scope=likely end=$line head=1 pw=$pw >> $output_file
done < $input_file

echo " ]" >> $output_file
echo "}" >> $output_file
