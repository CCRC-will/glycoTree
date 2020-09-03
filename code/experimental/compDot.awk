## Usage: awk -f compDot.awk [composition csv vector file]
## calculates dot product to convert composition vector file to residue match file


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
  data[j] = $0;
  count = 0;
  for (i = 2; i <= length($0); i++) {
    count += $i;
  }
  dp[j] = count;
##printf("\n## %s", compStr[j]);
}

END {
  ## print header row
  printf("accession,dp");
  for (j = 0; j < length(accession); j++) {
    printf(",%s", accession[j]);
  }

  for (j = 0; j < length(accession); j++) {
  ## for (j = 0; j < 3; j++) {
    printf("\n%s,%s", accession[j], dp[j]);
    n = split(data[j], dj, ",");
    for (k = 0; k < length(accession); k++) {
      m = split(data[k], dk, ",");
      sum = 0;
      ## calculate the dot product of vectors dj and dk (same length)
      ## for (s = 1; s <= n; s++) for (t = 1; t <= m; t++) {
      for (s = 1; s <= n; s++) {
        sum += dj[s] * dk[s];
      }
      printf(",%d", sum);
    }
    ##printf("\n");
  }
  if (showTime == 1) system("date");
}
