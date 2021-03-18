## Usage: awk -f getSQLcomps.awk G*.csv
##   call from glycotree/data/gct/csv/mapped/sorted
##   this directory requires a symbolic link to glycotree/SQL/getSQLcomps.awk where the awk script lives

BEGIN {
  FS=",";
}

NR == 1 {
  printf("%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n",$1,$3,$4,$5,$6,$7,$8,$9,$10,$11);
}

FNR > 1 {
  printf("%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n",$1,$3,$4,$5,$6,$7,$8,$9,$10,$11);
}

