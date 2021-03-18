BEGIN {
  FS = "\t";
}

NF > 2 {
  printf("%s\n", $3);
}
