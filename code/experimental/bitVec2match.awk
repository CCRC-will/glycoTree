## Usage: awk -f bitVec2match.awk [glycoTree_csv_vector_file]
## finds common elements of row pairs in glycoTree_csv_vector_file 
##  not complete - experiment to convert string vector to bit vector

BEGIN {
 base = 16;
 ## printf("base is %d", base);
 record[0] = "";
 saved = "";
 FS = ",";
}

FNR > 1 {
 s = $0;
 id = $1;
 printf("\n%s", id);
 sep = ",";
 str = "";
 j = 0;
 for (i=2; i<=NF; i++) {
   str = str $i;
   if ( ((i-1)%base == 0) || (i == NF) ) {
     temp[j++] = str;
     str = "";
   }
 }
 common = 0;
 for (k=0; k<j; k++) {
   ## printf("\n%s is temp[%s]", temp[k], k);
   if (FNR == 2) {
     saved = id;
     record[saved","k] = temp[k];
     ## printf("  -  copying record[%d]: %s\n", saved","k, record[saved","k]);
   }
   ## do the next bit for all pairs at the end (permuting 'saved')
     ## printf("\n%s is record[%s]", record[saved","k], saved","k);
     d[k] = record[saved","k] + temp[k];
     ## printf("\n%s is d[%d]", d[k], k);
     z = 0;
     n=split(d[k],y,""); 
     for (i=0; i<=n; i++) if(y[i]==2) z++; 
     ## printf("\nn is %d; overlap is %d\n", n, z);
     common += z;
 }
 printf(" has %d residues in common with %s", common, saved);
}

