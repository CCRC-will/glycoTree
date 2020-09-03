## Usage: awk -f v2i.awk [glycoTree_csv_vector_file]
## converts glycoTree_csv_vector_file (binary string) to integer representation and back

BEGIN {
 base = 32;
 printf("base is %d", base);
}

function decodeInt(c, pad) {
 result = "";
 for (k=pad; k>-1; k--) {
   p = 2^k;
   ## printf("\n    2^k:%d  k:%d  c:%d:", p, k, c);
   if (c >= p) {
       ##printf("1  ");
       result = result",1";
       c -= p;
   } else {
      ##printf("0  ");
       result = result",0";
   }
 }
 ## printf("{pad:%d result:%s}\n", pad, result);
 return(result);
}

FNR > 1 {
 s = $0;
 n = split(s,t,",");
 printf("\n\n%s,%d", t[1], n);
 b = 0;
 d = 2;
 sep = ",";
 padding = base - 1; 
 q = 0;
 back[q++] = t[1];
 for (i=2; i<=n; i++) {
   j = (base - 1) - i + d;
   b += t[i] * 2^j;
   ## printf("#i:%d,j:%d,t:%d,b:%d#", i, j, t[i], b);
   if ( ( ((i-1) % base) == 0 ) || (n == i) ) {
     ## printf("\n[d:%d  i:%d  j:%d  t:%d  b:%d]", d, i, j, t[i], b);
     printf("%s%d", sep, b);
     back[q++] = decodeInt(b, padding);
     if ( (n - i) < base) {
       d += n - i;
       padding = n - i - 1;
     } else {
       d += base;
     }
     b = 0;
   }
 }
 printf("\ndecoded (recovered) data:\n");
 for (q = 0; q < length(back); q++) {
   printf("%s", back[q]);  
 }
 printf("\noriginal data:");
 printf("\n%s",$0);
}
