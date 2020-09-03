## Usage: awk -f mkComps.awk [glycoTree_csv_files]
## creates a csv file listing the canonical compositions of all structures
##   in argument files that are fully assigned to the canonical tree
## CSV file, first column is accession, second is space-separated composition string

BEGIN {
  FS = ",";
  assigned = 1; 
  compStr = "";
  printf("accession,composition_string");
}

FNR == 1 && NR > 1 {
  ## new structure file, but not the first
  if (assigned == 1) {
    printf("\n%s,%s", accession, compStr);;
  }
}

FNR == 1 {
##  printf("\n new filename %s\n", FILENAME);
  compStr = "";
  assigned = 1;
  fsep = "";
}

FNR > 1 {
  ## record for a given structure
  accession = $1;
  if ($2 == "unassigned") {
     assigned = 0; ## do not process files with unassigned residues
  } else {
     compStr = compStr fsep $3;
     fsep = " ";
  } 
}

END {
  if (assigned == 1) printf("\n%s,%s", accession, compStr);;
}
