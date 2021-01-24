BEGIN {
  outfile = "tm3.txt";
  printf("  dummy file\n") > outfile;
  FS = ",";
}

$1 ~ "^N[0-9]+" {
  printf("  </body>\n</html>") >> outfile;
  close(outfile);
  outfile = "portal/nodes/node" $1 ".html";
  printf("<html>\n  <body>\n") > outfile;
  newSet = 1;
}

$1 !~ "^N[0-9]+" {
  if (newSet == 1)  {
    printf("    <h2>Node %s:</b> %s-%s-%s linked to Node %s at site %s</h2>\n",$3,$5,$6,$10,$8,$9) >> outfile;
    printf("    <b>Limited to</b>  %s <br>\n", $12) >> outfile;
    printf("    <b>Not found in</b> %s<br>\n", $13) >> outfile;
    printf("    <b><b>Notes</b> - %s<br>\n", $14) >> outfile;
    printf("    <b><b>Evidence</b> - %s<br>\n", $15) >> outfile;
    printf("    <b>Click an accession listed below to see this node in context:</b><br>\n") >> outfile;
    newSet = 0;
  } 
  printf("      <a href='../explore.html?%s' target='_blank'>%s</a><br>\n",$1,$1) >> outfile;
}

END {
  printf("  </body>\n</html>") >> outfile;
  close(outfile);
}
