# Usage: awk -v s=[subdirectory_name] -f compareLineCount.awk [files]

#  Compares the number of lines in [file] to the number of lines in file with same name in 
#    subdirectory "mapped" of directory holding [file]
#   For example, 
#  awk -v s="mapped" -f compareLineCount.awk data/und/csv/G*
#  compares number of lines of files G* in directory data/und/csv/
#    to number of lines in corresponding files in data/und/csv/mapped/

BEGIN {
  count = 0;
}

FNR == 1 {
  if (FNR != NR) {
    # printf("\n./%s has %d lines", f, count);
    if (count != countG) {
      printf("\n%s and %s have different number of lines (%d, %d)", f, g, count, countG);
    }
  }
  count = 0;
  f = FILENAME;
  n = split(f,a,"/");
  p = a[n];
  g = ".";
  for (i = 1; i < n; i++) g = g "/" a[i];
  g = g "/" s "/" p;
  countG = 0;
  while ((getline line < g) > 0) countG++;
  # printf("\n\n%s has %d lines", g, countG);
  
  close(g);
}

{count ++;}

END {
  if (count != countG) {
    printf("\n%s and %s have different number of lines (%d, %d)", f, g, count, countG);
  }
}
