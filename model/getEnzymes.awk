BEGIN {
  FS = ",";
}

NR == 1 {
  print $0;
}

NR > 1 {
  data[$5] = $0;
}

END {
  for (p in data) {
    print data[p];
  }
}

