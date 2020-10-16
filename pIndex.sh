#!/bin/bash
# creates an index.html file the sandbox portal

ls -1 ./portal/svg/G[0-4]*.svg > temp1.lst
ls -1 ./portal/svg/G[5-9]*.svg >> temp1.lst

sed s/\\/portal\\/svg\\///g temp1.lst > temp2.lst
sed s/gTree.svg//g temp2.lst > temp3.lst
sed s/[.]//g temp3.lst > svg.lst

rm -f temp1.lst temp2.lst temp3.lst

awk -f pIndex.awk pTemplate.txt svg.lst
