## Usage: 
##   awk -v nodeID=[value] -v parentColumn=[value] -v nodeColumn=[value] -v showRows=[0|1] -f getSubtree.awk [input_file]
## Traverses (depth first) a tree specified in the [input_file], starting at node specified as [nodeID]
##   the indices for columns containing the [parentID] and the [nodeID] are provided as input parameters
##  the output is a collection of nodeIDs, indented hierarchically 
##   if showRows == 1, the entire row corresponding to the nodeID is printed

function getDescendants(nodeID, level) {
  for (j = 0; j < level; j++) printf("    ");
  printf("%s", nodeID);
  if (showRows == 1) {
    for (i in line) {
      split(line[i], fields, FS);
      if (nodeID == fields[nodeColumn]) printf(":    %s", line[i]);
    }
  }
  printf("\n");
  for (i in line) {
    split(line[i], fields, FS);
    if (fields[parentColumn] == nodeID) {
      getDescendants(fields[nodeColumn], level+1);
    }
  }

}

BEGIN {
  FS = ",";
  count = 0;
}

{
  line[count++] = $0;
}

END {
  getDescendants(rootID, 0);
}
