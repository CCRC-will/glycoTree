find ./model/gTree_SVG -name "G*.svg"  -print -maxdepth 1 | xargs -I % cp % ./portal/svg
find ./model/json/complete -name "G*.json"  -print -maxdepth 1 | xargs -I % cp % ./portal/json
./pIndex.sh
cp svg.lst accessions.lst

