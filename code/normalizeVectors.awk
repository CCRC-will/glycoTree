## Usage: awk -f normalizeVectors.awk [vector_csv_file]

BEGIN {
  FS = ",";
  summed = false;
}

FNR == 1 {
  printf("%s\n", $0);;
}

FNR > 1 {
  sum = 0;
  for (i = 2; i <= NF; i++) {
    sum += $i;
  }
  len = sqrt(sum);
  sum2 = 0;
  printf("%s", $1);
  for (i = 2; i <= NF; i++) {
     printf(",%0.4f", $i/len);
  }
  printf("\n");
}

