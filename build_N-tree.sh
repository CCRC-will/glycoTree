#!/bin/bash
# Usage: ./build_N-tree.sh [svg_source_directory] [clear_flag]
#  the first argument is the full path to the directory containing GlyTouCan-generated svg image files
#     the svg directory string must be terminated by a forward slash, e.g., "~/svg/"
#  if the second argument is set to "clear", previous data for the N-tree will be cleared
#   Example:
#              ./build_N-tree.sh ./data/input_svg/ clear

start=$(date)
echo $start
 for i in "$@"; do
  ## identify svg_source_directory, as it contains the character '/'
  if grep -q "\/" <<< $i ; then
    echo svg directory is $i
    svg_dir=$i
  fi
  ## the key word 'clear' is in the argument list
  if [ $i = 'clear' ]; then
    echo "Clearing old glycoTree data files (.txt, csv, .lst, .gTree.svg, .GlycoCT.svg, etc)"
    ./2_clear_data.sh
  fi
done

echo
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

## The following is deprecated (at least temporarily)
## echo
## echo Copying GOG files
## cp ./data/GOG/G*.txt ./data/gct/

## echo Copying extra GlycoCT files
## cp ./data/gct/extra/G*.txt ./data/gct/

## The following was replaced with transfer of files from ./data/input_gct
## echo
## echo Extracting GlycoCT files from ./data/mammal_N-glycans.json
## awk -f ./code/gctExtract.awk ./data/mammal_N-glycans.json 

echo
echo "Copying GlycoCt files from ./data/input_gct"
find ./data/input_gct -name "G*.txt" -print -maxdepth 1 | sort | xargs -I % cp % ./data/gct
echo
echo "Generating list of GlycoCT files to process into file ./data/gct/files.lst"
find ./data/gct -name "G*.txt" -print -maxdepth 1 | sort > ./data/gct/files.lst

echo
echo Generating glycoTree csv files
java -jar ./code/GenerateCSV.jar ./data/gct/files.lst list 1 &> ./log/csv.log

echo
if grep -q "[A-Za-z]" <<< $svg_dir ; then
  echo Fetching svg files from $svg_dir
  ./code/fetchSVG.sh ./data/gct/csv/ $svg_dir ./data/svg/ > ./log/noSVG.lst
  echo "Accessions lacking SVG support are listed in file ./model/glycansLackingSVG.lst"
  sed 's/[.]svg//g' ./log/noSVG.lst | sort > ./model/glycansLackingSVG.lst
fi

echo
echo "Generating list of glycoTree csv files to process into file ./data/gct/csv/files.lst"
find ./data/gct/csv -name "G*.csv" -print -maxdepth 1 | sort > ./data/gct/csv/files.lst


echo
echo Fetching current model files

node_file=`ls ./model/N-nodes-v4.2.y.csv`
echo using node file $node_file

sugar_file=`ls ./model/sugars*.csv`
echo using sugar file $sugar_file

enzyme_file=`ls ./model/enzyme-mappings*.csv`
echo using enzyme file $enzyme_file

echo formatting node file
sed -i.bak 's///g' $node_file

echo
echo Mapping residues in csv files to canonical tree 
java -jar ./code/TreeBuilder3.jar -l ./data/gct/csv/files.lst -s $sugar_file -c $node_file -n 3 -v 1 -m 3 -e 1 -o ./model/ext.csv &> ./log/map.log

echo 
echo Sorting mapped residues
./code/sortCSV.sh ./data/gct/csv/mapped 1 > ./log/sort.log

## pubchem IDs deprecated - pubchem has its own mapping
## echo
## echo Adding PubChem IDs
## find ./data/gct/csv/mapped/sorted/ -name "G*.csv" -print -maxdepth 1 | xargs -I % awk -v out="./data/gct/csv/mapped/sorted/pc_annotated/" -f ./code/addPCids.awk ./model/pc_sugars.csv % 

echo
echo "Generating list of unassigned residues into file ./model/unassigned.csv"
echo "glycan_ID,residue,residue_ID,name,anomer,absolute,ring,parent_ID,site,form_name" > ./model/unassigned.csv
find ./data/gct/csv/mapped/sorted/ -name "G*.csv" -print -maxdepth 1 | sort | xargs -I % grep -h "unassigned" % >> ./model/unassigned.csv

echo
echo "Annotating residues with biosynthetic enzymes in csv format, file ./model/annotated_glycans.csv"
echo "glytoucan_ac,residue_name,residue_id,uniprot,gene_name,gene_id,parent_residue_id,type,species\n" > ./model/temp_annotated_glycans.csv
find ./data/gct/csv/mapped/sorted/ -name "G*.csv" -print -maxdepth 1 | sort | xargs -I % awk -f ./code/mkCSVmap.awk $enzyme_file %  >> ./model/temp_annotated_glycans.csv
sort -k1.1,1.1r -k1.2,1 -k3,3n -k3.2,3n -k4,4g -t, model/temp_annotated_glycans.csv > model/annotated_glycans.csv
rm model/temp_annotated_glycans.csv

echo
echo "Generating file containing a list of mapped csv files:   ./data/gct/csv/mapped/files.lst"
find ./data/gct/csv/mapped -name "G*.csv" -print -maxdepth 1  | sort > ./data/gct/csv/mapped/files.lst
echo "Generating a list of svg files that may match the csv files into file ./data/svg/hope.lst"
sed 's/[.]csv/.svg/g' ./data/gct/csv/files.lst > ./data/svg/temp.lst
sed 's/gct\/csv/svg/g' ./data/svg/temp.lst > ./data/svg/hope.lst
rm ./data/svg/temp.lst

echo
echo Flattening svg files
echo semantic annotation of svg encoding with canonical IDs
java -jar ./code/SVGflatten.jar -l ./data/svg/hope.lst -c ./data/gct/csv/mapped -a gTree -o ./model/gTree_svg -m ./model/map_gTree.csv -v 2 -r 1 &> ./log/gTree_svg.log
echo semantic annotation of svg encoding with GlycoCT indices
java -jar ./code/SVGflatten.jar -l ./data/svg/hope.lst -c ./data/gct/csv -a GlycoCT -o ./model/GlycoCT_svg -m ./model/map_GlycoCT.csv -v 2 -r 1 &> ./log/GlycoCT_svg.log

echo
echo Combining semantic id map files
awk -f ./code/hashem.awk ./model/map_gTree.csv ./model/map_GlycoCT.csv > ./model/map_both.csv

## the following is deprecated - output file is too large - file can be fully generated by catenating individual json files
## echo
## echo "Annotating residues with biosynthetic enzymes - results in single json file: ./model/bak/annotated_glycans.json"
## find ./data/gct/csv/mapped/sorted/ -name "G*.csv" -print -maxdepth 1 | sort | xargs -I % awk -f ./code/mkJSONmap.awk $enzyme_file %  > ./model/bak/annotated_glycans.json

echo
echo "Annotating residues with biosynthetic enzymes - for each structure, results are in a separate json file: ./model/json/[accession].json" 
find ./data/gct/csv/mapped/sorted/ -name "G*.csv" -print -maxdepth 1 | sort | xargs -I % awk -f ./code/generateJSON.awk $enzyme_file %

echo
echo "Calculating common canonical residues in all accession pairs and writing json encoding of related glycan data in ./model/json/match"
java -jar ./code/CorrelateGlycans.jar -v 2 -l ./data/gct/csv/mapped/files.lst -c 512 -j ./model/json/match -0 ./SQL/match.csv &> ./log/correlate.log

echo
echo "Appending initial json files with related glycan data"
find ./model/json -name "G*.json" -print -maxdepth 1 | sort | xargs -I % awk -f ./code/appendJSON.awk -v inDir="./model/json/match" -v outDir="./model/json/complete"  -v exclude="probe_acc" %

echo
echo "Replacing svg and json files in portal"
find ./model/gTree_SVG -name "G*.svg"  -print -maxdepth 1 | xargs -I % cp % ./portal/svg
find ./model/json/complete -name "G*.json"  -print -maxdepth 1 | xargs -I % cp % ./portal/json

echo
echo "Generating list of accessions associated with svg files into file ./model/svg.lst"
find ./portal/svg -maxdepth 1 -name "G*.svg" -print | sort | cut -d \/ -f 4 | awk 'BEGIN {FS=".";} {printf("%s\n", $1);}' > ./model/svg.lst

echo
echo "Generating a list of accessions currently supported by GlycoTree into file ./accessions.lst"
find ./data/gct/csv/mapped -maxdepth 1 -name "G*.csv" -print | cut -d \/ -f 6 | sort | awk 'BEGIN {FS=".";} {printf("%s\n", $1);}' > accessions.lst

echo
echo "Generating the home page for the portal as file ./portal/index.html"
awk -f ./code/pIndex.awk ./code/pTemplate.txt  accessions.lst > ./portal/index.html

echo Done
echo
echo Started processing: $start
echo Ended processing: $(date)
