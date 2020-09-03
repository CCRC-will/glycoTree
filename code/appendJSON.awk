## Usage: awk -v exDir=[export directory] -f appendJSON.awk [files_to_be_appended]
##  appends another record to a json file
##  NB - the first and last lines of both files must be 
##    bracket characters - "{" or "}"

BEGIN {
  bcount = 0;
  sep = "";  ## control linefeeds
  ## exclude = "bogus";
  outfile = "";
}


FNR == 1 {
  close(outfile);
  n = split(FILENAME, fnParts, "/"); 
  fileBase = fnParts[n];
  fileDir = "";
  for (i = 1; i < n; i++) {
    fileDir = fileDir fnParts[i]"/";
  }
  infile = inDir "/" fileBase;
  outfile = outDir "/" fileBase;
  printf("") > outfile;  ## initiate new outfile
}



{
  if ($0 ~ "{") bcount++;
  if ($0 ~ "}") bcount--;
  if (bcount > 0) {
    printf("%s%s", sep,  $0) >> outfile;
    sep = "\n";
  } else {
    ## insert data before last bracket
    ecount = 0;
    gotAline = 0;
    while(( getline line<infile) > 0 ) {
      if (gotAline == 0) {
        ## infile exists, so insert new comma and linefeed 
        ##  only before first line read
        printf(",\n") >> outfile; 
      }
      gotAline = 1;
      if (ecount > 0) {
        if (line !~ exclude) print line >> outfile;
      }
      if (line ~ "{") ecount++;
      if (line ~ "}") ecount--;
    }
    close(infile);
    if (gotAline == 0) {
      ## file with added data does not exist, so close brackets
      printf("\n}") >> outfile;
    }
  }
}
