## Usage:   awk -v pars=<catenated^strings> -v start=<1st line> -v mode=<0|1>-f findseq.awk <files> 
##
##  pars - a catenated list of strings separated by "^", each corresponding to a substring in a sequence of lines
##  mode - specifies whether found data is reported (mode=0 -> just filenames;  mode=1 -> found stings)
##  start - the line in which to start searching
##  
##    awk -v pars="-dglc-HEX-^n-acetyl^b-dman-HEX-" -v start=2 -f findseq.awk G0[0-5]*
##      finds "N-glycanase-generated" N-glycans in GlycoCT format in files G00... to G05...
##    awk -v pars="-dglc-HEX-^n-acetyl^-dglc-HEX-^n-acetyl" -v start=2 -v mode=1 -f findseq.awk G5[0-5]*
##      finds "PNGase-generated" N-glycans in GlycoCT format in files G50... to G55... - reporting found strings

BEGIN {
  ok = 1;
  lnum = start;
  split(pars, p, "^");
  len = length(p);
  lastline = -1 + start + len;
  ## printf("%s\n%s\n%s\n%s\n\n",p[1],p[2],p[3],p[4]);
  x = "";
  printf("file");
  if (mode == 1) {
    for (i=1; i<=len; i++) printf(",line%d,data%d", i, i);
  }
}

(ok == 1) && (FNR == lnum ) {
  ## printf("processing line %d for file %s\n", lnum, FILENAME);
  i = 1 + lnum - start;
  ## printf("file is %s: line is %d: index is %d\n", FILENAME, lnum, i);
  if ($0 ~ p[i]) {
    if (mode == 1) {
      ## keep track of found strings and line numbers
      x = sprintf("%s,%d,\"%s\"", x, lnum, $0);
    }
    lnum++;
  } else { 
    ok = 0;
  }
}
 
FNR  == lastline {
  if (ok == 1) {
    y = sprintf("%s\n%s%s", y, FILENAME, x);
  }
  ok = 1;
  lnum = start;
  x = "";
}

  
END {
  printf("%s\n", y);
}

