## Usage: awk -v out=[output_directory] -f mkMatchJSON.awk [residue_match_csv_file] [residue_match_csv_file]
##  makes  a collection of json files describing the structures most closely related 
##   to each structure in the residue_match_csv_file

BEGIN {
  FS = ",";
  fRank = 0;
}

FNR == 1 {
  fRank++;
}

fRank == 1 && FNR == 1 {
  ## first line of first time through - populate accession array a
  for (i = 3; i <= NF; i++) {
    j = i - 2;
    a[j] = $i;
    ## printf("\ni is %d, j is %d, a[j] is %s", i, j, a[j]);
  }
}

fRank == 1 && FNR > 1 {
  ## subsequent lines of first time through - populate count (dp) array c
  j = FNR - 1;
  c[j] = $2
}

fRank == 2 && FNR > 1 {
  ## second time through: generate json file for each structure in match file
  ## fn is the filename of the output file
  fn = sprintf("%s/%s.json", out, $1);
  probeDP = $2;
  printf("{\n  \"probe_acc\": \"%s\",", $1) > fn;
  printf("\n  \"dp\":  \"%d\",", probeDP) >> fn;
  printf("\n  \"related_glycans\": [ ") >> fn;
  sep = "";
  for (i = 3; i <= NF; i++) {
    j = i - 2;
    targetDP = c[j]; 
    nMatch = $i;
    if ( (probeDP + targetDP - 2 * nMatch) < 2 ) { 
       ## the target and probe match except for a single residue at most
       printf("%s\n   {", sep) >> fn;
       sep = ",";
       printf("\n     \"accession\": \"%s\",", a[j]) >> fn;
       printf("\n     \"relative_dp\": \"%+d\",", (targetDP - probeDP)) >> fn;
       printf("\n     \"match\": \"%d\"", $i) >> fn;
       printf("\n   }") >> fn;
    }
  }
  printf("\n  ]") >> fn;
  printf("\n}") >> fn;
}

fRank == 2 && FNR > 2 {
  close(fn);
}

