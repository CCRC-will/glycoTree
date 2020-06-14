BEGIN {
  residues = 0;
  linkages = 0;
}

$0 ~ "RES" {
  residues = 1;
  linkages = 0;
}

$0 ~ "LIN" {
  residues = 0;
  linkages = 1;
}

(residues == 1) && ($0 !~ "RES") {
    printf("\nreading residue: %s\n", $0);
    pos =  match($0, ":");
    val = substr($0, 1, pos-1);
    split(val,v1, /[0-9]*/);
    split(val,v2, /[a-zA-Z]*/);
    nT = v1[2];
    nID = v2[1];
    printf("nodeType %s and nodeID %s\n", nT, nID );
    val = substr($0, pos+1, 256);
    if (nT == "b") {
      split(val, vals, "-");
      anomer = vals[1];
      printf("anomeric configuration is %s\n", anomer);
      step = 2;
      config = "";
      for (i=2; i<=length(vals); i++) {
        if (vals[i] ~ /[A-Z]/) step = 3; 
        ## printf("step is %d - vals[%d] is %s\n", step, i, vals[i]);
        if (step == 4) vs = vals[i];
        if (step == 2) config = config "-" vals[i];
        if (match(config, "-") == 1) config = substr(config, 2, 16);
        if (step == 3) {
           base = vals[i];
           step++;
        }
      }
      printf("absolute configuration is %s\n", config);
      printf("base is %s\n", base);
      ## printf("variarion string is %s\n", vs);
      split(vs, vars, "|");
      for (j=1; j<=length(vars); j++) {
         printf("variation[%d] is %s\n", j, vars[j]);
         split(vars[j], p, ":");
         if (match(p[2], /[0-9]/) == 1) {
           ringdiff = 0 + p[2] - p[1];
           if (ringdiff == 4) printf("  ring form is p\n"); else printf("  ring form is f\n");
         }
         if (match(p[2], "a") == 1) printf("  carboxy at C-%s\n", p[1]);
         if (match(p[2], "keto") == 1) printf("  ketone at C-%s\n", p[1]);
         if (match(p[2], "d") == 1) printf("  deoxy at C-%s\n", p[1]);
      }
    }
}

(linkages == 1) && ($0 !~ "LIN") {
  printf("\nreading linkage: %s\n", $0);
  split($0, parts, ":");
  data = parts[2];
  ## printf("data are %s\n", data);
  split(data, nodeData, /\(([^)]+)\)/ );
  parent = nodeData[1];
  child = nodeData[2];
  split(parent, parentID, /[a-z]/);
  split(child, childID, /[a-z]/);
  ## printf("child ID is %s; parent ID is %s\n", childID[1], parentID[1]);
  pstart = match(data, /\(/ ) + 1;
  plen = match(data, /\)/ ) - pstart;
  paren = substr(data, pstart, plen);
  ## printf("parenthetical is %s\n", paren );
  split(paren, site, /\+/)
  ## printf("linkage site: %s\n", site[1]);
  printf("child %s is linked to parent %s at position %s\n", childID[1], parentID[1], site[1]);
  ## this should work but it don't:      match(data, "\(([^)]+)\)", z );
}
