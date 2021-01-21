## Usage: awk -f mkJSONmap.awk <id_map_file> <enzyme_csv_file> <glycan_csv_files>
## Creates a JSON representation of each structure in the glycan_csv_files, 
##  including canonical residue mappings and the enzymes that process each residue

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
  printf("{ \"glycans\": [\n");
}

FNR == 1 {
  file_rank++;
}

file_rank == 1 {
  ## count corresponds to the line number in te enzyme_csv_file
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
    printf("\n      ]");
    printf("\n    },\n");
  }
  accession = $1;
  printf("    {\n      \"accession\": \"%s\",",  accession);
  printf(" \n      \"residues\": [");
}


file_rank > 1 && FNR > 1 { ## printf("FNR is %s", FNR);
  if (FNR > 2) printf(",");
  printf("\n        {");
  printf("\n          \"canonical_name\": \"%s\",", $2);
  printf("\n          \"residue_id\": \"%s\",", $3);
  printf("\n          \"glycoct_index\": \"%s\",", $11);
  printf("\n          \"sugar_name\": \"%s\",", $4);
  printf("\n          \"anomer\": \"%s\",", $5);
  printf("\n          \"absolute_configuration\": \"%s\",", $6);
  printf("\n          \"ring_form\": \"%s\",", $7);
  printf("\n          \"parent\": \"%s\",", $8);
  printf("\n          \"site\": \"%s\",", $9);
  printf("\n          \"limited_to\": \"%s\",", $12);
  printf("\n          \"not_found_in\": \"%s\",", $13);
  printf("\n          \"notes\": \"%s\",", $14);
  printf("\n          \"evidence\": \"%s\",", $15);
   printf("\n          \"enzymes\": [");
   enz_count = 0;
   for (i = 1; i <= count; i++) {
     ## for every line [i] in the enzyme_csv_file 
     if ($3 == id[i]) { 
       ## $3 may match the id of multiple lines in the enzyme_csv_file (multiple enzymes)
       if (enz_count++ > 0) printf(","); ## close previous enzyme record and increment enz_count
       printf("\n            {"); 
       printf("\n              \"uniprot\": \"%s\",", uniprot[i]);
       printf("\n              \"species\": \"%s\",", species[i]);
       printf("\n              \"type\": \"%s\",", type[i]);
       printf("\n              \"orthology_group\": \"%s\",", orthology_group[i]);
       printf("\n              \"protein_refseq\": \"%s\",", protein_refseq[i]);
       printf("\n              \"dna_refseq\": \"%s\",", dna_refseq[i]);
       printf("\n              \"gene_name\": \"%s\",", gene_name[i]);
       printf("\n              \"gene_id\": \"%s\",", gene_id[i]);
       printf("\n              \"required_residues\": \"%s\",", required_residues[i]);
       printf("\n              \"blocking_residues\": \"%s\",", blocking_residues[i]);
       printf("\n              \"notes\": \"%s\",", notes[i]);
       printf("\n              \"branch_site_specificity\": \"%s\"", branch_site_specificity[i]);
       printf("\n            }");
     }
   }
  printf("\n          ]");
  printf("\n        }");
}

END {
  printf("\n      ]");
  printf("\n    }");
  printf("\n  ]");
  printf("\n}\n");
}
