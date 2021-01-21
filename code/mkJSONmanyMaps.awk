## Usage: awk -f mkJSONmanyMaps.awk  <enzyme_csv_file> <glycan_csv_files>
## Creates a separate file with the JSON representation of each structure in the 
##  glycan_csv_files, including canonical residue mappings and the enzymes 
##  that process each residue.
## Each file is named as ./model/json/[accession].json

function getKey(str) {
  split(str, a, ":");
  split(a[1], b, "-");
  k = b[2] "_" a[2];
  return k;
}


BEGIN {
  FS = ",";
  count = 0;
  file_rank = 0;
}

FNR == 1 {
  file_rank++;
}

file_rank == 1 {
  count++;
  id[count] = $2;
  type[count] = $3;
  orthology_group[count] = $4;
  uniprot[count] = $5;
  protein_refseq[count] = $6;
  dna_refseq[count] = $7;
  gene_name[count] = $8;
  gene_id[count] = $9;
  species[count] = $10;
  required_residues[count] = $11;
  blocking_residues[count] = $12;
  notes[count] = $13;
  ## Need to strip the line-feed from last field in the record.
  branch_site_specificity[count] = substr($14, 1, length($14)-1);
}

file_rank > 1 && FNR == 2 {
  if (file_rank > 2) {
    ## close the previous glycan record
    printf("\n   ]") >> outFile;
    printf("\n}\n") >> outFile;
    close(outFile);
  }
  outFile = "./model/json/" $1 ".json";
  accession = $1;
  printf("{\n  \"accession\": \"%s\",",  accession) > outFile;
  printf(" \n  \"residues\": [") >> outFile;
}


file_rank > 1 && FNR > 1 { ## printf("FNR is %s", FNR);
  if (FNR > 2) printf(",") >> outFile;
  printf("\n    {") >> outFile;
  printf("\n      \"canonical_name\": \"%s\",", $2) >> outFile;
  printf("\n      \"residue_id\": \"%s\",", $3) >> outFile;
  printf("\n      \"glycoct_index\": \"%s\",", $11) >> outFile;
  printf("\n      \"sugar_name\": \"%s\",", $4) >> outFile;
  printf("\n      \"anomer\": \"%s\",", $5) >> outFile;
  printf("\n      \"absolute_configuration\": \"%s\",", $6) >> outFile;
  printf("\n      \"ring_form\": \"%s\",", $7) >> outFile;
  printf("\n      \"parent\": \"%s\",", $8) >> outFile;
  printf("\n      \"site\": \"%s\",", $9) >> outFile;
  printf("\n      \"limited_to\": \"%s\",", $12) >> outFile;
  printf("\n      \"not_found_in\": \"%s\",", $13) >> outFile;
  printf("\n      \"notes\": \"%s\",", $14) >> outFile;
  printf("\n      \"evidence\": \"%s\",", $15) >> outFile;

  printf("\n      \"enzymes\": [") >> outFile;
  enz_count = 0;
  for (i = 1; i <= count; i++) {
    if ($3 == id[i]) {
      if (enz_count++ > 0) printf(",") >> outFile; ## close previous enzyme record
      printf("\n        {") >> outFile; 
      printf("\n          \"uniprot\": \"%s\",", uniprot[i]) >> outFile;
      printf("\n          \"species\": \"%s\",", species[i]) >> outFile;
      printf("\n          \"type\": \"%s\",", type[i]) >> outFile;
      printf("\n          \"orthology_group\": \"%s\",", orthology_group[i]) >> outFile;
      printf("\n          \"protein_refseq\": \"%s\",", protein_refseq[i]) >> outFile;
      printf("\n          \"dna_refseq\": \"%s\",", dna_refseq[i]) >> outFile;
      printf("\n          \"gene_name\": \"%s\",", gene_name[i]) >> outFile;
      printf("\n          \"gene_id\": \"%s\",", gene_id[i]) >> outFile;
      printf("\n          \"required_residues\": \"%s\",", required_residues[i]) >> outFile;
      printf("\n          \"blocking_residues\": \"%s\",", blocking_residues[i]) >> outFile;
      printf("\n          \"notes\": \"%s\",", notes[i]) >> outFile;
      printf("\n          \"branch_site_specificity\": \"%s\"", branch_site_specificity[i]) >> outFile;
      printf("\n        }") >> outFile;
    }
  }
  printf("\n      ]") >> outFile;
  printf("\n    }") >> outFile;
}

END {
  printf("\n  ]") >> outFile;
  printf("\n}") >> outFile;
}
