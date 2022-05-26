NR == 1 {
  # the first line of the first input file
  printf("%s\n", $0);
}

FNR > 1 {
  # not the first line of all input files
  printf("%s\n", $0);
}
