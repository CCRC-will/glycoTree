# Usage: awk -v FS="," -v i=<index_column> -v c=<comparison_column> -f compCols.awk <file1> <file2>
#  Compares the contents of two csv files based on indices in column[i] and values in column[c]

(NR == FNR) && (FNR > 1) {
  ref[$i] = $c;
}

(NR > FNR) && (FNR > 1) {
  tested[$i] = $c;
  if ($i in ref) {
     if(ref[$i] == $c) {
       if (v > 0) printf("+ index %s:  %s matches %s\n", $i, $c, ref[$i]); 
     } else {
       printf("- mismatch for index %s: %s .......... match would be %s\n", $i, $c, ref[$i]);
     }
  } else {
     printf("< index %s with value %s from second file does not exist in first file\n", $i, $c);
  }
}


END {
  for (k in ref) if (!(k in tested))
     printf("> index %s with value %s from first file does not exist in second file\n", k, ref[k]);
}
