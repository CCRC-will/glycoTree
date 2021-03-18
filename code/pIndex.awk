BEGIN {
}

NR == FNR {
  printf("%s\n", $0);
}

NR > FNR {
  printf("\t  <tr>\n\t    <td>%s</td>\n", $1);
  printf("\t    <td><a href=\"explore.html?%s\" target=\"_blank\">Explore</a></td></td>\n", $1);
  printf("\t    <td><a href=\"javascript:showImage('%s');\">View</a></td>\n", $1);
  printf("\t  </tr>\n");
}


END {
  printf("\t</table>\n</div>\n</body>\n</html>");
}
