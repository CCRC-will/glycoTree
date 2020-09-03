## Usage: awk -f v2match.awk [composition csv vector file]
##  converts a composition vector file to a residue match file

BEGIN {
  showTime = 1;
  if (showTime == 1) system("date");
  FS = ",";
}

FNR == 1 {
  for (i = 0; i < NF-1; i++) { ## zero-indexed; NF-1 values
   ## start with column 2 - column 1 has "accession"
   r = i + 2;
   residue[i] = $r;
  }
}


FNR > 1 {
  j = FNR - 2; ## zero-indexed; start with record 2
  accession[j] = $1;
  compStr[j] = "";
  count = 0;
  sep = "";
  for (i = 0; i < NF-1; i++) {
    r = i + 2
    if ($r == 1) {
      compStr[j] = compStr[j] sep residue[i];
      sep = ",";
      count++;
    }
  }
  dp[j] = count;
##printf("\n## %s", compStr[j]);
}

END {
  outfile = "/Users/wsyork/play/compositions.txt"; 
  printf(" ") > outfile;
  ## print header row
  printf("accession,dp");
  for (j = 0; j < length(accession); j++) {
    printf(",%s", accession[j]);
    printf("%s, %s\n", accession[j], compStr[j]) >> outfile;
  }

  for (j = 0; j < length(accession); j++) {
  ## for (j = 0; j < 3; j++) {
    printf("\n%s,%s", accession[j], dp[j]);
    n = split(compStr[j], resj, ",");
    for (k = 0; k < length(accession); k++) {
      m = split(compStr[k], resk, ",");
      count = 0;
      ## printf("\n%s,", accession[k]);
      ##printf("(%s:%s)",accession[j],accession[k]);
      for(s = 1; s <= n; s++) for(t = 1; t <= m; t++) {
        ## check whether residue s has same string representation as res t
        if (resj[s] == resk[t]) {
          ## printf("(%s:%s)", resj[s], resk[t]);
          count++;
        }
      }
      printf(",%d", count);
    }
    ##printf("\n");
  }
  printf("\n");
  if (showTime == 1) system("date");
}
