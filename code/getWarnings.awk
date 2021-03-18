BEGIN {
  FS = ",";

  reqText = "%s,This glycan contains a residue (%s) that cannot be added by known enzymes unless another residue (%s) has already been added.  "
  reqSuffix1 = "This glycan does not have residue %s and is thus inconsistent with this rule.\n";
  reqSuffix2 = "This glycan is biosynthetically consistent with this rule because it has residue %s.\n";
  reqAcc = "";
  reqRes = "";
  req = "";
  reqPresent = 0;

  blkText = "%s,This glycan contains a residue (%s) whose addition by known enzymes is blocked by another residue (%s).  "
  blkSuffix1 = "This glycan has residue %s and is thus inconsistent with this rule.\n";
  blkSuffix2 = "This glycan is biosynthetically consistent with this rule because it lacks residue %s.\n";
  blkAcc = "";
  blkRes = "";
  blk = "";
  blkPresent = 0;
  printf("glytoucan_ac,warning\n");
}

function print_req(a, s, q, p)  {
  txt = reqText reqSuffix1;
  if (p == 1) txt = reqText reqSuffix2;
  printf(txt, a, s, q, q);
}

function print_bkl(a, s, q, p)  {
  txt = blkText blkSuffix1;
  if (p == 1) txt = reqText blkSuffix2;
  printf(txt, a, s, q, q);
}


FNR == 1 {
  # print warnings for previous file
  if (length(req) > 1) {
    for (i in residues) if (residues[i] == req) reqPresent = 1;
    print_req(reqAcc, reqRes, req, reqPresent);
  }
  if (length(blk) > 1) {
    for (i in residues) if (residues[i] == blk) blkPresent = 1;
    print_blk(blkAcc, blkRes, blk, blkPresent);
  }
  # reset parameters for this file
  reqAcc = "";
  reqRes = "";
  req = "";
  reqPresent = 0;
  blkAcc = "";
  blkRes = "";
  blk = "";
  blkPresent = 0;
  for (i in residues) residues[i] = ""; 
}

FNR > 1 {
  residues[FNR] = $3;
  if (length($14) > 0) {
    reqAcc = $1;
    reqRes = $3;
    req = $14;
  }
  if (length($15) > 0) {
    blkAcc = $1;
    blkRes = $3;
    blk = $15;
  }
}

END {
  if (length(reqAcc) > 1) {
    for (i=1; i<length(residues); i++) if (residues[i] == req) reqPresent = 1;
    print_req(reqAcc, reqRes, req, reqPresent);
  }
}
