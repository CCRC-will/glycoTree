## Usage: awk -f 2022_5_14_adminEnzymeMap.awk [map data file] > [temporary file]
  ## 1. Back up the enzyme_mapping file
  ## 2. Execute this script to generate a temporary enzyme_mapping file
  ## 3. Check the temporary file for accuracy
  ## 4. Overwrite the enzyme_mapping file with the temporary file
  BEGIN {
  FS = ",";
  admin = "WSY";
  ##   the arrays "status", "disputer" and "proposed" in the next lines were generated
  ##      on the client-side by javascript and hold the values that YOU approved
  
  status[303]= "rejected";
  disputer[303]= "WSY";
  status[351]= "proposed";
  proposed[351]= "351,O-glycan_a-D-GalpNAc_758,O758,GT,P38649,test,proposed,WSY,WSY,null";
  status[352]= "active";
  proposed[352]= "352,O-glycan_a-D-GalpNAc_758,O758,GT,P16442,test 2,active,WSY,WSY,null";

  touched[0] = "none"
  target[0] = "0";
}

NR == 1 {
  ##   the indices of the "status" and "administrator" columns are identified from the header
  printf("%s\n", $0);
  for (i = 1; i <= NF ; i++) {
    if ($i == "status") target[i] = "status";
    if ($i == "administrator") target[i] = "administrator";
    if ($i == "disputer_id") target[i] = "disputer_id";
  }
}

NR > 1 {
  ##   as appropriate, the value of the "status", "disputer_id", and "administrator"
  ##   columns are changed in each line 
  for (i = 1; i <= NF; i++) {
    ##  each field (i) in the line  is processed
    sep = ","; ## comma-separated
    if (i == NF) sep = "\n";  ## last field terminated by line-feed
    if ($1 in status) {
      ##  "target columns" in this LINE should be modified
      ##  the record in this line has been processed and should not be appended to the file
      touched[$1] = status[$1];
      if (i in target) {
        ##  only the "status", "disputer_id", and "administrator" COLUMNS should be modified
		  if (target[i] == "status") printf("%s%s", status[$1], sep);
		  if (target[i] == "administrator") printf("%s%s", admin, sep);
		  if (target[i] == "disputer_id") printf("%s%s", disputer[$1], sep);
      } else {
        ## other COLUMNS should NOT be modified
        printf("%s%s", $i, sep);
      }
    } else {
      ## keep the initial values of ALL columns for this line
      printf("%s%s", $i, sep);
    }
  }
}

END {
  ## append proposed records that have not been processed in (N > 1) section
  for (key in proposed) if (!key in touched) {
    printf("%s%s",proposed[key], sep);
  }
}