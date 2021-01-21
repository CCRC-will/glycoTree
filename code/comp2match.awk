## Usage: awk -f comp2match.awk [composition csv file]
## converts composition string file to match file (optimized)

BEGIN {
  showTime = 0;
  if (showTime == 1) system("date");
  FS = ",";
}

FNR == 1 {
  ##  just csv header "accession,composition_string"
}


FNR > 1 {
  ## generate accession array
  j = FNR - 2; ## zero-indexed; start with record 2
  accession[j] = $1;
  printf("accession[%d] is %s - ", j, accession[j]);
  data[j] = $0;
  count = 0;
}

END {
  ## print header row
  printf("accession,dp");
  for (j = 0; j < length(accession); j++) {
    printf(",%s", accession[j]);
  }

  for (j = 0; j < length(accession); j++) {
    split(data[j], jCSVfields, ","); ## first is accession, 2nd is compString
    n = split(jCSVfields[2], compJ, " "); ## split the second field (compString)
    printf("\n%s,%d", accession[j], n);
    for (k = 0; k < length(accession); k++) {
      split(data[k], kCSVfields, ","); ## first is accession, 2nd is compString
      m = split(kCSVfields[2], compK, " "); ## split the second field (compString)
      sum = 0;
      ## calculate the match of vectors jCSVfields and kCSVfields (NOT same length)
      ##  split -> one-indexed array
      ## limit traversal range of the t loop - more efficient
      a = 1;  
      for (s = 1; s <= n; s++) {
        for (t = a; t <= m; t++) { 
          if (compJ[s] == compK[t]) {
            sum++;
            a = t + 1;
            t = m + 1;
          }
        }
      }
      printf(",%d", sum);
    }
    ##printf("\n");
  }
  if (showTime == 1) {
    printf("\n");
    system("date");
  }
}
