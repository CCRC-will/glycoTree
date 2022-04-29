BEGIN {
  FS=",";
}

{
  printf("%s,%s,%s,%s,%s\n",$1,$2,$3,$4,$7);
}
