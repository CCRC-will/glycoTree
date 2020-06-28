## glycoct field MUST PRECEED glytoucan_ac field

BEGIN {
  FS = "\"";
  ## def is a boolean: 1 -> defined; 0 -> not defined
  def = 1;
  foundglycoct = 0;
  gctEncoding = "error";
  log_file = "./log/gct_extract.log";
  printf("Extracting GlycoCT files from json file %s", ARGV[1]) > log_file;
}

$2 ~ "glycoct" {
  if ($4 ~ "UND") def = 0;
  gsub(" ", "\n", $4);
  gctEncoding = $4;
  foundglycoct = 1;
}

$2 ~ "glytoucan_ac" {
  outfile = "./data/def/" $4 ".txt";
  if (def == 0) {
    outfile = "./data/und/" $4 ".txt";
  }
  if (foundglycoct == 1) {
    printf("%s", gctEncoding) > outfile;
    close(outfile);
  } else {
    printf("\n\nCannot create file %s", outfile) >> log_file;
  }
  gctEncoding = "error";
  foundglycoct = 0;
  def = 1;
}

