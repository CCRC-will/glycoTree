## Usage: awk -f mkCSVmap.awk <enzyme_csv_file> <glycan_csv_files>
## Creates a CSV representation of each structure in the glycan_csv_files, 
##  including canonical residue mappings and the enzymes that process each residue

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

file_rank > 1 && FNR > 1 { 
  glytoucan_ac = $1;
  residue_name = $2;
  residue_id = $3;
  parent_residue_id = $8;
  for (i = 1; i <= count; i++) {
    if (residue_id == id[i]) {
      printf("%s,%s,%s,%s,%s,%s,%s,%s,%s\n", glytoucan_ac, residue_name, residue_id, uniprot[i], gene_name[i], gene_id[i], parent_residue_id, type[i], species[i]);
    }
  }
}
