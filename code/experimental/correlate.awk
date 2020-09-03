## Usage: awk -f correlate.awk [normalized_vector_csv_file]
##  calculates and prints dot product of normalized vector file elements

BEGIN {
  FS = ",";
}

FNR > 1 {
  a[FNR] = $1
  d[FNR] = $0
}

END {
  printf("accession");
  for (i = 2; i <= length(a); i++) { 
    printf(",%s", a[i]);
  }
  for (i = 2; i <= length(d); i++) { 
    printf("\n%s", a[i]);
    split(d[i], s, ",");
    for (j = 2; j <= length(d); j++) {
      split(d[j], t, ",");
      sum = 0;
      for (k = 2; k <= length(s); k++) {
        sum += s[k] * t[k];
      }
      printf(",%0.2f", sum);
   }
  }
}
