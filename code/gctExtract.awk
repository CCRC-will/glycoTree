## glycoct field MUST PRECEED glytoucan_ac field
##  output directory is ./data/gct/

BEGIN {
  FS = "\"";
  foundglycoct = 0;
  gctEncoding = "error";
  log_file = "./log/gct_extract.log";
  printf("Extracting GlycoCT files from json file %s", ARGV[1]) > log_file;
}

$2 ~ "glycoct" {
 ## add line feeds
  gsub(" ", "\n", $4);
  gctEncoding = $4;
  foundglycoct = 1;
}

$2 ~ "glytoucan_ac" {
  outfile = "./data/gct/" $4 ".txt";
  if (foundglycoct == 1) {
    printf("%s", gctEncoding) > outfile;
    close(outfile);
  } else {
    printf("\n\nCannot create file %s", outfile) >> log_file;
  }
  gctEncoding = "error";
  foundglycoct = 0;
}

