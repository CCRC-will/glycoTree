## Usage: awk -f intersect.awk [file1] [file2] > [file3]

## Generates a list [file3] of strings corresponding to the intersection of $1 in file1 with $1 in file2

BEGIN {
  count1 = 1;
  count2 = 1;
}

NR == FNR {
  ## fill array item with $1 values from file1
  item[count1++] = $1;
}

NR != FNR {
  ## put values in {$1 of file 2} that are also in {$1 of file1} into intersection
  for (i = 1; i < count1; i++) {
     if ($1 == item[i]) {
       intersect[count2++] = $1;
     }
  }
}

END {
  for (j = 1; j < count2; j++) printf("%s\n",intersect[j]);
}

