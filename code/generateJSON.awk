## Usage: awk -f generateJSON.awk  <enzyme_csv_file> <glycan_csv_files>
## Creates a separate file with the JSON representation of each structure in the 
##  glycan_csv_files, including canonical residue mappings and the enzymes 
##  that process each residue.
## Each file is named as ./model/json/[accession].json

function aLen(a, i, c) {
  ## a is an array whose length is returned
  ## must include arguments 'i' and 'c' to keep them local 
  c =  0;
  for (i in a) {
    c++;
  }
  return c;
}


BEGIN {
  FS = ",";
  lastRes = "none";
  file_rank = 0;
}

FNR == 1 {
  ## keep track of which file is being processed
  file_rank++;
}

file_rank == 1 && FNR == 1 {
  ## process HEADER from <enzyme_csv_file>
  ## This file contains enzyme information for canonical residues, NO curator annotations 
    ## populate key vector for this mapping
    for (i = 1; i <= NF; i++) {
      dataKey[i] = $i;
    }
}

file_rank == 1 && FNR > 1 {
  ## process DATA from <enzyme_csv_file>
  ## This file contains enzyme information for canonical residues, NO curator annotations 
  ## keep track of the number of enzymes associated with each residue
  if (lastRes == $2) {
    ## the current line describes an enzyme affecting the same residue as the last line
    resEnzCount++;
  } else {
    ## the current line describes an enzyme affecting a different residue than the last line
    ## save the number of enzymes for the residue annotated in the last line
    enzCount[lastRes] = resEnzCount;
    ## reset the counter and the name of the last residue
    resEnzCount = 1;
    lastRes = $2;
  }

  for (i=1; i <= NF; i++) {
    ## k = dataKey[i] "," $2 "," resEnzCount;
    data[dataKey[i],$2,resEnzCount] = $i;
  }
}

file_rank > 1 && FNR == 1 {
  ## process header from <glycan_file>
  ## This file contains enzyme information for residues in a specific glycan, including curator annotations 
    ## cw populate key vector for this residue
    for (i = 1; i <= NF; i++) {
      resKey[i] = $i;
    }
}

file_rank > 1 && FNR == 2 {
  ## one of the glycan_csv_files is being processed
  if (file_rank > 2) {
    ## input files with rank > 1 contain data for a specific glycan 
    ## such files generate a new output file, which must be closed before processing any subsequent file (i.e., rank > 2)
    ## close the previous glycan record
    printf("\n   ]") >> outFile;
    printf("\n}\n") >> outFile;
    close(outFile);
  }
  outFile = "./model/json/" $1 ".json";
  ## outFile = "~/play/example.json";
  for (i = 1; i <= NF; i++) {
    if (resKey[i] == "glytoucan_ac") accession = $i;
  }
  printf("{\n  \"glytoucan_ac\": \"%s\",",  accession) > outFile;
  printf(" \n  \"residues\": [") >> outFile;
}


file_rank > 1 && FNR > 1 { 
  ## add structural and curated annotations for the current residue
  if (FNR > 2) printf(",") >> outFile;
  sep = "";
  printf("%s\n    {", sep) >> outFile;
  sep = "";

  for (i = 2; i <= NF; i++) {
    printf("\n      \"%s\": \"%s\",", resKey[i], $i) >> outFile;
    if (resKey[i] == "residue_id") rid = $i;
  }

  ## add enzyme information for the current residue
  printf("\n      \"enzymes\": [") >> outFile;
  sep_i = "";
  for (i = 1; i <= enzCount[rid]; i++) {
      printf("%s\n         {", sep_i) >> outFile;
      sep_i = ",";
      sep_j = "";
      ## dataKey[1] and dataKey[2] specify the residue, which is already described in above section
      for (j = 3; j < aLen(dataKey); j++) {
        printf("%s\n          \"%s\": \"%s\"", sep_j, dataKey[j], data[dataKey[j],rid,i] ) >> outFile;
        sep_j = ",";
      }
      printf("\n         }") >> outFile;
    }
  printf("\n      ]") >> outFile;
  printf("\n    }") >> outFile;
}

END {
  printf("\n  ]") >> outFile;
  printf("\n}") >> outFile;
}
