rm model/nodes/nodeMap.csv
awk 'BEGIN {FS=",";} FNR > 1 {printf("%s\n", $2);}' ./model/N-nodes*.csv > tm1.lst
sort -V tm1.lst > tm2.lst
for node in `cat tm2.lst`
do 
  echo "$node" >> model/nodes/nodeMap.csv
  ## the following line is slow, but will process an arbitrary number of csv files
  for filename in ~/glycoTree/data/gct/csv/mapped/G*.csv; do  grep -h "[0-9],$node," $filename; done >> model/nodes/nodeMap.csv
done

awk -f code/showNodes.awk model/nodes/nodeMap.csv 

rm tm1.lst tm2.lst tm3.txt
