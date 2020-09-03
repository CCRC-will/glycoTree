## Usage: awk -f countCommon.awk [raw_vector_csv_file]

BEGIN {
  FS = ",";
}

FNR > 1 {
  a[FNR] = $1;
  d[FNR] = $0;
  count = 0;
  for (i = 2; i <= length($0); i++) { 
    count += $i;
  }
  c[FNR] = count;
}

END {
  printf("accession,dp");
  for (i = 2; i <= length(a); i++) { 
    printf(",%s", a[i]);
  }
  ## for (i = 2; i <= length(d); i++) { 
  for (i = 2; i < 5; i++) { 
    printf("\n%s,%d", a[i], c[i]);
    split(d[i], s, ",");
    for (j = 2; j <= length(d); j++) {
      split(d[j], t, ",");
      sum = 0;
      for (k = 2; k <= length(s); k++) {
        sum += s[k] * t[k];
      }
      printf(",%d", sum);
   }
  }
}
