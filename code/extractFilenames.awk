## Usage: awk -f extractFilenames.awk [input file]

## extracts file names from csv file downloaded from GlyGen, where the first field of each row is the GlyTouCan accession.

NR > 1 {
  split($1,s,"\"");
  printf("%s.txt\n", s[2]);
}
