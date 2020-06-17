## Usage: awk -f extractFilenames.awk [input file]

## extracts file names from json file downloaded from GlyGen accession.

BEGIN {
  FS = "\"";
}

$0 ~ "glytoucan_ac" {
  printf("%s.txt\n", $4);
}
