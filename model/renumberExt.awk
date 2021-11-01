# Usage: awk -f renumberExt.awk <canonical residue file> <canonical residue extension file>
#  renumbers the residues in the extended canonical residue list such that they can be appended to the 
#     existing canonical residue file
# Example: awk -f renumberExt.awk canonical_residues.csv ext.csv


BEGIN {
  FS = ",";
  max = 0;
}

NR == FNR {
  print($0);
  rindex = 0 + substr($2, 2);
  if ( (match($2, /[0-9]/) > 0) && (rindex > max) ) {
    max = rindex;
  }
}

(NR > FNR) && (FNR > 1) {
  rindex = substr($2, 3);
  newindex = rindex + max;
  newID = sprintf("N%s", newindex);
  ## printf("%s changed to %s\n", $2, newID);
  split($1, parts, "_"); 
  ## printf("parts: %s %s %s\n", parts[1], parts[2], parts[3]);
  newName  = sprintf("%s_%s_%s", parts[1], parts[2], newindex);
  ## printf("%s changed to %s\n", $1, newName);
  newLinkID = $7;
  if (index($7, "NE") > 0) {
    ## print($7);
    rindex = substr($7, 3);
    newlinkindex = rindex + max;
    newLinkID = sprintf("N%s", newlinkindex);
  }
  printf("%s,%s,%s,%s,%s,%s,%s,%s,%s,,,,,,\n", newName, newID, $3, $4, $5, $6, newLinkID, $8, $9);
}

