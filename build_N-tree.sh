#!/bin/bash
# Usage: ./build_N-tree.sh [svg_source_directory] [clear_flag]
#  the first argument is the full path to the directory containing GlyTouCan-generated svg image files
#     the svg directory string must be terminated by a forward slash, e.g., "~/svg/"
#  if the second argument is set to "clear", previous data for the N-tree will be cleared
#   Example:
#              ./build_N-tree.sh ./data/input_svg/ clear

start=$(date)
echo $start
here=`pwd`
gctDir=$here/data/gct
echo "gct directory is $gctDir"
csvDir=$gctDir/csv
echo "csv directory is $csvDir"
mappedDir=$csvDir/mapped
echo "mapped data directory is $mappedDir"
sortedDir=$mappedDir/sorted
echo "sorted directory is $sortedDir"
svgDir=$here/data/svg
echo "svg directory is $svgDir"
logDir=$here/log
echo "log directory is $logDir"
modelDir=$here/model
echo "model directory is $modelDir"
codeDir=$here/code
echo "code directory is $codeDir"
gctIn=$here/data/input_gct
echo "gct source directory is $gctIn"
sqlDir=$here/SQL
echo "SQL directory is $sqlDir"
portalDir=$here/portal
echo "portal directory is $portalDir"
echo "Called this program from directory $here" 

for i in "$@"; do
  ## identify svg_source_directory, as it contains the character '/'
  if grep -q "\/" <<< $i ; then
    echo svg source directory is $i
    svgSource=$i
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
## awk -f $codeDir/gctExtract.awk ./data/mammal_N-glycans.json 

echo
echo "Copying GlycoCt files from $gctIn to $gctDir"
cd $gctIn
cp G*.txt $gctDir/
cd $here


echo
echo "Generating list of GlycoCT files to process and placing in file $gctDir/files.lst"
find $gctDir -name "G*.txt" -print -maxdepth 1 | sort > $gctDir/files.lst

echo
echo Generating glycoTree csv files
java -jar $codeDir/GenerateCSV.jar $gctDir/files.lst list 1 &> $logDir/csv.log

echo
if grep -q "[A-Za-z]" <<< $svgSource ; then
  echo Fetching svg files from $svgSource
  $codeDir/fetchSVG.sh $csvDir/ $svgSource $svgDir/ > $logDir/noSVG.lst
  echo "Accessions lacking SVG support are listed in file ./model/glycansLackingSVG.lst"
  sed 's/[.]svg//g' $logDir/noSVG.lst | sort > $modelDir/glycansLackingSVG.lst
fi

echo
echo "Generating list of glycoTree csv files to process and placing in file $csvDir/files.lst"
find $csvDir -name "G*.csv" -print -maxdepth 1 | sort > $csvDir/files.lst


echo
echo Fetching current model files

## There should be only one file in ./model/ that matches 'canonical_residues*.csv'
node_file=`ls $modelDir/canonical_residues*.csv`
echo using node file $node_file

sugar_file=`ls $modelDir/sugars*.csv`
echo using sugar file $sugar_file

enzyme_file=`ls $modelDir/enzyme-mappings*.csv`
echo using enzyme file $enzyme_file

echo formatting node file
sed -i.bak 's///g' $node_file
mv $modelDir/canonical_residues*.csv.bak $modelDir/bak/

echo
echo Mapping residues in csv files to canonical tree 
java -jar $codeDir/TreeBuilder3.jar -l $csvDir/files.lst -s $sugar_file -c $node_file -n 3 -v 1 -m 3 -e 1 -o $modelDir/ext.csv &> $logDir/map.log

echo 
echo Sorting mapped residues
$codeDir/sortCSV.sh $mappedDir 1 > $logDir/sort.log

echo
echo "Generating list of unassigned residues and placing in file $modelDir/unassigned.csv"
echo "glycan_ID,residue,residue_ID,name,anomer,absolute,ring,parent_ID,site,form_name" > $modelDir/unassigned.csv
find $sortedDir -name "G*.csv" -print -maxdepth 1 | sort | xargs -I % grep -h "unassigned" % >> $modelDir/unassigned.csv

##  Make a large csv file containing data in directory ./data/gct/csv/mapped/sorted ##
echo Assembling mapped/sorted csv file for import into DB -> $sqlDir/compositions.csv
cd $sortedDir
awk -f $codeDir/assembleCompositions.awk G*.csv > $sqlDir/compositions.csv
cd $here

echo
echo "Generating file containing a list of mapped csv files:   $mappedDir/files.lst"
find ./data/gct/csv/mapped -name "G*.csv" -print -maxdepth 1  | sort > $mappedDir/files.lst
echo "Generating a list of svg files that may match the csv files into file $svgDir/hope.lst"
sed 's/[.]csv/.svg/g' ./data/gct/csv/files.lst > $svgDir/temp.lst
sed 's/gct\/csv/svg/g' ./data/svg/temp.lst > $svgDir/hope.lst
rm $svgDir/temp.lst

echo
echo Flattening svg files
echo semantic annotation of svg encoding with canonical IDs
java -jar $codeDir/SVGflatten.jar -l $svgDir/hope.lst -c $mappedDir -a gTree -o $modelDir/gTree_svg -m $modelDir/map_gTree.csv -v 2 -r 1 &> $logDir/gTree_svg.log
echo semantic annotation of svg encoding with GlycoCT indices
java -jar $codeDir/SVGflatten.jar -l $svgDir/hope.lst -c $csvDir -a GlycoCT -o $modelDir/GlycoCT_svg -m $modelDir/map_GlycoCT.csv -v 2 -r 1 &> $logDir/GlycoCT_svg.log

echo
echo "Combining semantic id (svg/GlycoCT/glycoTree) map files"
awk -f $codeDir/hashem.awk $modelDir/map_gTree.csv $modelDir/map_GlycoCT.csv > $modelDir/map_both.csv

echo
echo "Calculating common canonical residues in all accession pairs and writing related glycan data in file $sqlDir/correlation.csv"
java -jar $codeDir/CorrelateGlycans.jar -v 2 -l $mappedDir/files.lst -c 512 -j $modelDir/json/match -o $sqlDir/correlation.csv &> ./log/correlate.log

echo
echo "Replacing svg files in portal"
find $modelDir/gTree_SVG -name "G*.svg"  -print -maxdepth 1 | xargs -I % cp % $portalDir/svg

echo
echo "Generating list of accessions associated with svg files and placing in file ./model/svg.lst"
find $portalDir/svg -maxdepth 1 -name "G*.svg" -print | sort | cut -d \/ -f 7 | awk 'BEGIN {FS=".";} {printf("%s\n", $1);}' > $modelDir/svg.lst

echo
echo "Generating a list of accessions currently supported by GlycoTree into file $here/accessions.lst"
find $mappedDir -maxdepth 1 -name "G*.csv" -print | cut -d \/ -f 9 | sort | awk 'BEGIN {FS=".";} {printf("%s\n", $1);}' > $here/accessions.lst

echo
echo "Generating the home page for the portal as file ./portal/index.html"
awk -f $codeDir/pIndex.awk $codeDir/pTemplate.txt  $here/accessions.lst > $portalDir/index.html

echo
## The following requires access to SQL DB.  Populate DB first, then use PHP to generate this file (use .tsv format).
#! echo "Annotating residues with biosynthetic enzymes in csv format, file ./model/annotated_glycans.csv"
#! echo "glytoucan_ac,residue_name,residue_id,uniprot,gene_name,gene_id,parent_residue_id,type,species\n" > ./model/temp_annotated_glycans.csv
#! find ./data/gct/csv/mapped/sorted/ -name "G*.csv" -print -maxdepth 1 | sort | xargs -I % awk -f ./code/mkCSVmap.awk $enzyme_file %  >> ./model/temp_annotated_glycans.csv
#! sort -k1.1,1.1r -k1.2,1 -k3,3n -k3.2,3n -k4,4g -t, model/temp_annotated_glycans.csv > model/annotated_glycans.csv
#! rm model/temp_annotated_glycans.csv

echo Done
echo
echo Started processing: $start
echo Ended processing: $(date)
