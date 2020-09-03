## Usage: awk -f mkVectors.awk [canonical_node_csv_file] [glycoTree_csv_files]


function zeroVec() {
  for (j = 0; j < length(rid); j++ ) {
    key = rid[j];
    vec[key] = 0;
  }
}

function printHeader() {
  printf("accession,");
  sep = "";
  for (j = 0; j < length(rid); j++ ) {
    printf("%s%s", sep, rid[j]);
    sep = ",";
  }
  printf("\n");
}

function printVec() {
  printf("%s,", accession);
  sep = "";
  for (j = 0; j < length(rid); j++ ) {
    key = rid[j];
    printf("%s%s", sep, vec[key]);
    sep = ",";
  }
  printf("\n");
}

BEGIN {
  FS = ",";
  fRank = 0;
  assigned = 1; 
}


FNR == 1 {
  fRank++;
  i = 0;
}

fRank == 1 && FNR > 1 {
  rid[i++] = $2;
}

fRank == 2 && FNR == 1 {
  printHeader();
}

fRank > 2 && FNR == 1 {
  if (assigned == 1) printVec(); ## print vector for previous file
  assigned = 1;
}

fRank > 1 && FNR == 1 {
  zeroVec();
}

fRank > 1 && FNR > 1 {
  accession = $1;
  if ($2 == "unassigned") {
     assigned = 0; ## do not process files with unassigned residues
  } else {
    key = $3;
    vec[key] = 1;
  } 
}

END {
  if (assigned == 1) printVec(); ## print vector for last file
}
