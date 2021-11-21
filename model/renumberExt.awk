# Usage: awk [-v m=x] [-v p=X] -f renumberExt.awk [canonical residue file] [canonical residue extension file]
#  renumbers the residues in an extended canonical residue file and appends extensions to an 
#     existing canonical residue file
#     variables passed are:
#         'p' -> ID-prefix (e.g., 'O' or 'N')
#         'm' -> maximum index of existing residues (e.g., 600) - next (extended) id has numeric part (m+1)
# Example: awk -v p=N -v m=758 -f renumberExt.awk N_canonical_residues.csv ext.csv


BEGIN {
  extPrefix = p "E";
  ## printf("prefix is %s;  extPrefix is %s\n", p, extPrefix);
  FS = ",";
  if (m > 0) {
    max = m;
  } else {
    max = 0;
  }
  i = 1;
}

NR == FNR {
  ## print residue from original file
  print($0);
    rindex = 0 + substr($2, 2);
    usedIndices[FNR] = rindex;
}

(NR > FNR) && (FNR > 1) {
  rindex = substr($2, 3);
  newindex = rindex + max;
  okToAdd = 1;
  ## check for duplicate indices in original tree (BUT NOT IN ALL TREES!)
  for (j in usedIndices) if (newindex == usedIndices[j]) {
    okToAdd = 0;
    break;
  }
  if (okToAdd == 1) {
    // renumber current residue id
    newID = sprintf("%s%s", p, newindex);
    split($1, parts, "_"); 
    newName  = sprintf("%s_%s_%s", parts[1], parts[2], newindex);
    newLinkID = $7;
    // renumber parent of current residue id ONLY if parent is a new canonical residue
    //   if parent previously exists, use its original id ($7)
    if (index($7, extPrefix) > 0) {
      rindex = substr($7, 3);
      newlinkindex = rindex + max;
      newLinkID = sprintf("%s%s", p, newlinkindex);
    }
    printf("%s,%s,%s,%s,%s,%s,%s,%s,%s,,,not validated,,,\n", newName, newID, $3, $4, $5, $6, newLinkID, $8, $9);
  } else {
    printf("!!! Duplicate index number %s !!!\n", newindex);
  }
}

