#!/bin/bash
# creates an index.html file the sandbox portal

find ./portal/svg -name "G*.svg" -print -maxdepth 1 > temp1.lst

sed s/\\/portal\\/svg\\///g temp1.lst > temp2.lst
sed s/gTree.svg//g temp2.lst > temp3.lst
sed s/[.]//g temp3.lst > svg.lst

sort svg.lst >  accessions.lst

awk -f pIndex.awk pTemplate.txt  accessions.lst > ./portal/index.html

rm -f temp1.lst temp2.lst temp3.lst 

