show=""

if [ $# -gt 1 ]; then
  show="-v showRows=1";
fi

awk -v rootID="$1" -v parentColumn=7 -v nodeColumn=2 $show -f getSubtree.awk model/N-nodes-v4.2.csv
