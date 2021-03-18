#!/bin/bash
# Usage: gog_populate_N-tree.sh [svg_source_directory]

echo Preparing directories
mkdir ./data/gct
mkdir ./data/gct/csv
mkdir ./data/gct/csv/mapped
mkdir ./data/gct/csv/mapped/sorted
mkdir ./data/gct/csv/mapped/sorted/pc_annotated
mkdir ./data/svg
mkdir ./model/gTree_svg
mkdir ./model/GlycoCT_svg
mkdir ./model/json
mkdir ./model/bak


echo
echo Copying GOG files
cp ./data/GOG/G*.txt ./data/gct/

echo Copying extra GlycoCT files
cp ./data/gct/extra/G*.txt ./data/gct/

echo
echo Extracting GlycoCT files from ./data/mammal_N-glycans.json
awk -f ./code/gctExtract.awk ./data/mammal_N-glycans.json 

echo
echo "Generating list of GlycoCT files to process (./data/gct/files.lst)"
find ./data/gct -name "G*.txt" -print -maxdepth 1 > ./data/gct/files.lst

echo
echo Generating glycoTree csv files
java -jar ./code/GenerateCSV.jar ./data/gct/files.lst list 1 > ./log/csv.log

echo
if [ $# -gt 0 ]; then
  echo fetching svg files from $1
  ./fetchSVG.sh ./data/gct/csv/ $1 ./data/svg/ > ./log/noSVG.lst
  echo "Accessions lacking SVG support are listed in (./model/glycansLackingSVG.lst)"
  sed 's/[.]svg//g' ./log/noSVG.lst > ./model/glycansLackingSVG.lst
fi

echo
echo "Generating list of glycoTree csv files to process (./data/gct/csv/files.lst)"
find ./data/gct/csv -name "G*.csv" -print -maxdepth 1 > ./data/gct/csv/files.lst

echo
echo Fetching current model files

node_file=`ls ./model/N-nodes*.csv`
echo using node file $node_file

sugar_file=`ls ./model/sugars*.csv`
echo using sugar file $sugar_file

enzyme_file=`ls ./model/enzyme-mappings*.csv`
echo using enzyme file $enzyme_file

echo
echo Mapping residues in csv files to canonical tree 
java -jar ./code/TreeBuilder3.jar -l ./data/gct/csv/files.lst -s $sugar_file -c $node_file -n 1 -v 1 -m 3 -e 1 -o ./model/ext.csv > ./log/map.log

echo 
echo Sorting mapped residues
./code/sortCSV.sh ./data/gct/csv/mapped 1 > ./log/sort.log

echo
echo Adding PubChem IDs
find ./data/gct/csv/mapped/sorted/ -name "G*.csv" -print -maxdepth 1 | xargs -I % awk -v out="./data/gct/csv/mapped/sorted/pc_annotated/" -f ./code/addPCids.awk ./model/pc_sugars.csv % 

echo
echo "Generating list of unassigned residues (./model/unassigned.csv)"
echo "glycan_ID,residue,residue_ID,name,anomer,absolute,ring,parent_ID,site,form_name" > ./model/unassigned.csv
find ./data/gct/csv/mapped/sorted/ -name "G*.csv" -print -maxdepth 1 | xargs -I % grep -h "unassigned" % >> ./model/unassigned.csv

echo
echo "Annotating residues with biosynthetic enzymes in csv format (./model/annotated_glycans.csv)"
find ./data/gct/csv/mapped/sorted/ -name "G*.csv" -print -maxdepth 1 | xargs -I % awk -f ./code/mkCSVmap.awk $enzyme_file %  > ./model/annotated_glycans.csv

echo
echo "Generating a list of all csv files (./data/gct/csv/files.lst)"
find ./data/gct/csv -name "G*.csv" -print -maxdepth 1  > ./data/gct/csv/files.lst
echo "Generating a list of mapped csv files (./data/gct/csv/mapped/files.lst)"
find ./data/gct/csv/mapped -name "G*.csv" -print -maxdepth 1  > ./data/gct/csv/mapped/files.lst
echo "Generating a list of svg files that may match the csv files (./data/svg/hope.lst)"
sed 's/[.]csv/.svg/g' ./data/gct/csv/files.lst > ./data/svg/temp.lst
sed 's/gct\/csv/svg/g' ./data/svg/temp.lst > ./data/svg/hope.lst
rm ./data/svg/temp.lst

echo
echo Flattening svg files
echo semantic annotation of svg encoding with canonical IDs
java -jar ./code/SVGflatten.jar -l ./data/svg/hope.lst -c ./data/gct/csv/mapped -a gTree -o ./model/gTree_svg -m ./model/map_gTree.csv -v 2 -r 1 > ./log/gTree_svg.log
echo semantic annotation of svg encoding with GlycoCT indices
java -jar ./code/SVGflatten.jar -l ./data/svg/hope.lst -c ./data/gct/csv -a GlycoCT -o ./model/GlycoCT_svg -m ./model/map_GlycoCT.csv -v 2 -r 1 > ./log/GlycoCT_svg.log

echo
echo Combining semantic id map files
awk -f ./code/hashem.awk ./model/map_gTree.csv ./model/map_GlycoCT.csv > ./model/map_both.csv

echo
echo "Annotating residues with biosynthetic enzymes - results in single json file: ./model/bak/annotated_glycans.json"
find ./data/gct/csv/mapped/sorted/ -name "G*.csv" -print -maxdepth 1 | xargs -I % awk -f ./code/mkJSONmap.awk $enzyme_file %  > ./model/bak/annotated_glycans.json

echo
echo "Annotating residues with biosynthetic enzymes - for each structure, results are in a separate json file: ./model/json/[accession].json" 
find ./data/gct/csv/mapped/sorted/ -name "G*.csv" -print -maxdepth 1 | xargs -I % awk -f ./code/mkJSONmanyMaps.awk $enzyme_file %

