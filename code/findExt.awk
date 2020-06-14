# Usage: awk -v last=<some integer> -f findExt.awk <files>
#  finds records in csv files whose third field begins with "NE" - i.e., extended N-glycan canonical residues
#   last - the last residue in the extended tree to be ignored while searching

BEGIN {
  FS = ",";
}

{
  t = substr($3,0,2);
  if (t == "NE") {
    n = 0 + substr($3,3);
    if (n > last) printf("%s %s\n", $1, $3);
  }
}
