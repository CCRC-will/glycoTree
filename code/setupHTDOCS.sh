find ~/htdocs/portal/svg -name "G*.svg"  -print -maxdepth 1 | xargs -I % rm %
find ./portal/svg -name "G*.svg"  -print -maxdepth 1 | xargs -I % cp % ~/htdocs/portal/svg
find ~/htdocs/portal/json -name "G*.json"  -print -maxdepth 1 | xargs -I % rm %
find ./portal/json -name "G*.json"  -print -maxdepth 1 | xargs -I % cp % ~/htdocs/portal/json
find ./portal/nodes -name "n*.html"  -print -maxdepth 1 | xargs -I % cp % ~/htdocs/portal/nodes
cp ./portal/index.html ~/htdocs/portal/
