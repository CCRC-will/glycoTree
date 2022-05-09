BEGIN {
  FS=",";
}

NR == 1 {
 printf("%s,%s,%s\n", "instance", $0, "status,proposer_id,administrator,disputer_id");
}

NR > 1 {
  printf("%d,%s,%s\n", NR-1, $0, "active,AN,WSY,");
}

