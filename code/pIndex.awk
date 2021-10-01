## Usage:   awk -f pIndex.awk <template file> <supported accessions file>

BEGIN {
}

##  the template file is specified by the first argument
NR == FNR {
  printf("%s\n", $0);
}

## each line in the file specified by subsequent argument is a supported accession
NR > FNR {
  printf("\t  <tr>\n");
  printf("\t    <td><a href=\"javascript:showImage('%s');\">%s</a></td>\n", $1, $1);
  printf("\t  </tr>\n");
}


END {
  printf("\t</table>\n</div>\n</body>\n</html>");
}
