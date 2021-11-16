#!/bin/bash
# Usage: ./build_all.sh [clear_flag]
#  if the first argument is set to "clear", previous data for the N-tree will be cleared
#   Example:
#              ./build_all.sh clear &> ./log/build.log

start=$(date)
here=`pwd`
echo "This program was called from directory $here" 
echo $start

N_Dir=$here/data/Nlinked
echo "N directory is $N_Dir"
csvN_Dir=$N_Dir/csv
echo "csv N directory is $csvN_Dir"

O_Dir=$here/data/Olinked
echo "O directory is $O_Dir"
csvO_Dir=$O_Dir/csv
echo "csv O directory is $csvO_Dir"

mappedDir=$here/data/mapped
echo "mapped global data directory is $mappedDir"
sortedDir=$mappedDir/sorted
echo "sorted directory is $sortedDir"
logDir=$here/log
echo "log directory is $logDir"
modelDir=$here/model
echo "model directory is $modelDir"
codeDir=$here/code
echo "code directory is $codeDir"
gctIn_N=$here/data/input_N
echo "gct source directory for N-glycans is $gctIn_N"
gctIn_O=$here/data/input_O
echo "gct source directory for O-glycans is $gctIn_O"
sqlDir=$here/SQL
echo "SQL directory is $sqlDir"
portalDir=$here/portal
echo "portal directory is $portalDir"

for i in "$@"; do
  ## the key word 'clear' is in the argument list
  if [ $i = 'clear' ]; then
    echo "Clearing old glycoTree data files (.txt, csv, .lst, .gTree.svg, .GlycoCT.svg, etc)"
    ./2_clear_data.sh
  fi
done

echo
echo Preparing directories

mkdir ./data/mapped
mkdir ./data/mapped/sorted
mkdir ./model/bak

mkdir ./data/Nlinked
mkdir ./data/Nlinked/csv
##  make a symbolic link so output to ./data/Nlinked/csv/mapped/ goes to ./data/mapped/
ln -s $here/data/mapped/ $here/data/Nlinked/csv/mapped

mkdir ./data/Olinked
mkdir ./data/Olinked/csv
##  make a symbolic link so output to ./data/Olinked/csv/mapped/ goes to ./data/mapped/
ln -s $here/data/mapped/ $here/data/Olinked/csv/mapped


## The following is deprecated (at least temporarily)
## echo
## echo Copying GOG files
## cp ./data/GOG/G*.txt ./data/gct/

## echo Copying extra GlycoCT files
## cp ./data/gct/extra/G*.txt ./data/gct/

NL=$'\n'

echo
echo "Copying GlycoCt files from $gctIn_N to $N_Dir"
cd $gctIn_N
cp G*.txt $N_Dir/
cd $here

echo
echo "Generating list of N-linked GlycoCT files to process and placing in file:$NL    $N_Dir/files.lst"
find $N_Dir -name "G*.txt" -print -maxdepth 1 | sort > $N_Dir/files.lst

echo
echo Generating glycoTree csv files for N-glycans
java -jar $codeDir/GenerateCSV.jar $N_Dir/files.lst list 1 &> $logDir/csv.log

echo
echo "Generating list of glycoTree N-linked csv files to process and placing in file:$NL    $csvN_Dir/files.lst"
find $csvN_Dir -name "G*.csv" -print -maxdepth 1 | sort > $csvN_Dir/files.lst

echo
echo Fetching current model files

## There should be only one file in ./model/ that matches 'N-canonical_residues*.csv'
node_file=`ls $modelDir/N_canonical_residues*.csv`
echo using node file $node_file

sugar_file=`ls $modelDir/sugars*.csv`
echo using sugar file:\n    $sugar_file

enzyme_file=`ls $modelDir/enzyme_mappings*.csv`
echo using enzyme file:\n    $enzyme_file

echo formatting node file
sed -i.bak 's///g' $node_file
mv $modelDir/canonical_residues*.csv.bak $modelDir/bak/

echo
echo Mapping residues in N-glycan csv files to canonical tree 
java -jar $codeDir/TreeBuilder3.jar -l $csvN_Dir/files.lst -s $sugar_file -c $node_file -n 3 -v 1 -m 3 -e 1 -o $modelDir/ext.csv &> $logDir/map_N.log

echo
echo "Copying GlycoCt files from $gctIn_O to $O_Dir"
cd $gctIn_O
cp G*.txt $O_Dir/
cd $here

echo
echo "Generating list of O-linked GlycoCT files to process and placing in file:$NL    $O_Dir/files.lst"
find $O_Dir -name "G*.txt" -print -maxdepth 1 | sort > $O_Dir/files.lst

echo
echo Generating glycoTree csv files for O-glycans
java -jar $codeDir/GenerateCSV.jar $O_Dir/files.lst list 1 &> $logDir/csv.log

echo
echo "Generating list of glycoTree O-linked csv files to process and placing in file:$NL    $csvO_Dir/files.lst"
find $csvO_Dir -name "G*.csv" -print -maxdepth 1 | sort > $csvO_Dir/files.lst

## There should be only one file in ./model/ that matches 'O-canonical_residues*.csv'
node_file=`ls $modelDir/O_canonical_residues*.csv`
echo using node file $node_file

echo
echo Mapping residues in O-glycan csv files to canonical tree 
java -jar $codeDir/TreeBuilder3.jar -l $csvO_Dir/files.lst -s $sugar_file -c $node_file -n 2 -v 1 -m 3 -e 1 -o $modelDir/ext.csv &> $logDir/map_O.log

echo 
echo Sorting mapped residues
$codeDir/sortCSV.sh $mappedDir 1 > $logDir/sort.log

echo
echo "Generating list of unassigned residues and placing in file:$NL    $modelDir/unassigned.csv"
echo "glycan_ID,residue,residue_ID,name,anomer,absolute,ring,parent_ID,site,form_name" > $modelDir/unassigned.csv
find $sortedDir -name "G*.csv" -print -maxdepth 1 | sort | xargs -I % grep -h "unassigned" % >> $modelDir/unassigned.csv

##  Make a large csv file containing data in directory ./data/mapped/sorted ##
echo "Assembling mapped/sorted csv file for import into DB file:$NL     $sqlDir/compositions.csv"
cd $sortedDir
awk -f $codeDir/assembleCompositions.awk G*.csv > $sqlDir/compositions.csv
cd $here

echo
echo "Generating file containing a list of mapped csv files:$NL    $mappedDir/files.lst"
find ./data/mapped -name "G*.csv" -print -maxdepth 1  | sort > $mappedDir/files.lst

echo
echo "Calculating common canonical residues in all accession pairs and writing related glycan data in file:$NL    $sqlDir/correlation.csv"
java -jar $codeDir/CorrelateGlycans.jar -v 2 -l $mappedDir/files.lst -c 512 -j $modelDir/json/match -o $sqlDir/correlation.csv &> ./log/correlate.log

echo
echo "Generating a list of accessions currently supported by GlycoTree into file:$NL     $here/accessions.lst"
## the column index '7' in the following command is file-system-dependent and may require adjustment fo different computers
find $mappedDir -maxdepth 1 -name "G*.csv" -print | cut -d \/ -f 7 | sort | cut -d . -f 1 > $here/accessions.lst

echo
echo "Generating the home page for the portal as file:$NL     $portalDir/index.html"
awk -f $codeDir/pIndex.awk $codeDir/pTemplate.html  $here/accessions.lst > $portalDir/index.html

echo Done
echo
echo Started processing: $start
echo Ended processing: $(date)
