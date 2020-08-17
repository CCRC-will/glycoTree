## Usage awk -v out=[output directory] -f addPCids.awk [map file] [structure file(s)]

BEGIN {
  FS = ",";
  fileRank = 0;
}

FNR == 1 {
  fileRank++;
  if (fileRank > 2) {
    close(outFile);
  }
}

fileRank == 1 && FNR > 1 {
  ## file #1 is a mapping from $1 to $2
  map[$1] = $2;
}

fileRank > 1 && FNR  == 1 {
  header = $0 ",pubchem_id";
}

fileRank > 1 && FNR  == 2 {
  outFile = out $1 ".csv";
  printf("%s", header) > outFile;
}

fileRank > 1 && FNR  > 1 {
  printf("\n%s,%s", $0, map[$4]) >> outFile;
}
