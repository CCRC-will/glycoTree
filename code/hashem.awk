## Usage: awk -f hashem2.awk [glycoTree index map file] [GlycoCT index map file]

BEGIN {
  FS = ",";
  count = 0;
  file_rank = 0;
}

FNR == 1 {
  file_rank++;
}


file_rank == 1 && FNR > 1 {
  key = $1 "," $2;
  if (NF == 4) {
    key = $1 "," $2 "," $3;
  }
  hash[key] = $NF;
  ## printf("input key: %s; value: %s\n", key, hash[key]);
}

file_rank > 1 && FNR == 1 {
  printf("%s,glycoct_index", $0);;
}

file_rank > 1 && FNR > 1 {
  key = $1 "," $2;
  if (NF == 4) {
    key = $1 "," $2 "," $3;
  }
  printf("\n%s,%s,%s", key, hash[key], $NF); 
}

