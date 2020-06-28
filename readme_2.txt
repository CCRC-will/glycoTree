Preparing the N-glycan canonical tree

https://github.com/CCRC-will/gTree.git

This workflow is partially automated using the bash script "populate_N-tree.sh"
Only step 1 (collecting input file specifying the structures of mamallian N-glycans) is required as prerequisites fo the automation
All commands assume the active directory is the one holding this readme file
Shell commands are on lines starting with the command prompt ($)

##### Part A: Collect and list biologically relevant GlycoCT files #####

** Prepare a directory ./data/ to hold glycan structure files

$	mkdir data

** Generate a json file describing all mammalian N-glycans in GlyGen, using the following parameters:
	- Glycan Type: N-glycan
	- Organism: Homo Sapiens OR Mus musculus OR Rattus norvegicus
	
This can be done directly in a browser using the GlyGen API with the following URI:	

https://api.glygen.org/directsearch/glycan/?query={"operation":"AND","query_type":"search_glycan","organism":{"organism_list":[{"name":"Rattus norvegicus","id":10116},{"name":"Homo sapiens","id":9606},{"name":"Mus musculus","id":10090}],"operation":"or"},"glycan_type":"N-glycan"}

** Save the resulting json file in the subdirectory ./data/ as
./data/mammal_N-glycans.json


***** AUTOMATION STARTS HERE *****
	You can ignore the rest of this file if you automate the remaining steps by invoking 
$	./populate_N-tree.sh

		
** Download the GlycoCT files specifying structures of all fully-defined glycans in GlyGen from:
	
$	curl -o ./data/t2.zip https://raw.githubusercontent.com/glygen-glycan-data/PyGly/master/smw/glycandata/export/fully_determined.zip

** Unpack the zip file, creating directory called ".data/fully_determined".

$	mkdir ./data/fully_determined
$	tar -xf ./data/fully_determined.zip -C ./data/fully_determined

** Prepare directories to hold the (defined and undefined) GlycoCT files embodied in ./data/mammal_N-glycans.json

$	mkdir ./data/def
$	mkdir ./data/und

** Extract the GlycoCT files from ./data/mammal_N-glycans.json

$	awk -f ./code/gctExtract.awk ./data/mammal_N-glycans.json 

** Make lists of GlycoCT files in the ./data/def/ and ./data/und/ directories

$	ls -1 ./data/def/G*.txt > ./data/def.lst
$	ls -1 ./data/und/G*.txt > ./data/und.lst


##### Part B: converting GlycoCT files to csv files #####

** Prepare directories to hold the (defined and undefined) csv files

$	mkdir ./data/def/csv
$	mkdir ./data/und/csv

** Generate csv files - the file GenerateCSV.jar (must be present in the directory ./code/)

$	java -jar ./code/GenerateCSV.jar ./data/def.lst list 0 > ./log/def_csv.log

##### Part C: mapping residues in the csv files to the canonical tree #####

** Generate an input glycan csv file list for ./code/TreeBuilder3.jar

$	ls -1 ./data/def/csv/G*.csv > ./data/def/csv/files.lst

** Prepare directories to hold the mapped csv files

$	mkdir ./data/def/csv/mapped
$	mkdir ./data/und/csv/mapped

** Map the residues in the csv files to the canonical tree
-- The command below works for the most up-to-date model files at the time of this writing ... 
The script ./prepare_N-tree.sh uses the current versions found in the directory ./model/

!!!! Need to catch inconsistencies in partially defined structures in TreeBuilder3
$	java -jar ./code/TreeBuilder3.jar -l ./data/def/csv/files.lst -s ./model/sugars_V-2.0.csv -c ./model/N-nodes_V-2.2.csv -n 3 -v 1 -m 3 -e 2 -o ./model/ext.csv > ./log/csv_map.log

13. After TreeBuilder[3] is run with  "-e 2", check which residues remain unassigned:

$	grep -h "unassigned" ./data/def/csv/mapped/G* > ./model/unassigned.csv

##### Part C: annotating residues in the canonically mapped csv files with enzymes #####

14. Annotate residues with enzymes using ./code/mkCSVmap.awk
-- The command below works for the most up-to-date enzyme-mappings file at the time of this writing ... 
The script ./prepare_N-tree.sh uses the current version found in the directory ./model/
$	awk -f ./code/mkCSVmap.awk ./model/enzyme-mappings_v-2.1.csv ./data/def/csv/mapped/G*.csv  > ./model/annotated_residues.csv

