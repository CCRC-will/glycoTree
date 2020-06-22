Preparing the N-glycan canonical tree


This workflow is partially automated using the bash script "prepare_N-tree.sh"
Only step 1 (collecting input file specifying the structures of mamallian N-glycans) is required as prerequisites fo the automation
All commands assume the active directory is the one holding this readme file
Shell commands are on lines starting with the command prompt ($)

##### Part A: preparing file lists of biologically relevant GlycoCT files #####

1. Generate a csv list of mammalian N-glycans from GlyGen, using the glycan Advanced Search page with the following parameters:
	- Glycan Type: N-glycan
	- Organism: Homo Sapiens OR Mus musculus OR Rattus norvegicus
	
This can be done directly from the API using the following URI:	

https://api.glygen.org/directsearch/glycan/?query={%22operation%22:%22AND%22,%22query_type%22:%22search_glycan%22,%22mass_type%22:%22Native%22,%22enzyme%22:{},%22glytoucan_ac%22:%22%22,%22organism%22:{%22organism_list%22:[{%22name%22:%22Rattus%20norvegicus%22,%22id%22:10116},{%22name%22:%22Homo%20sapiens%22,%22id%22:9606},{%22name%22:%22Mus%20musculus%22,%22id%22:10090}],%22operation%22:%22or%22},%22glycan_type%22:%22N-glycan%22,%22glycan_subtype%22:%22%22,%22protein_identifier%22:%22%22,%22glycan_motif%22:%22%22,%22pmid%22:%22%22}

Unfortunately, the API does not currently support a curl implementation of this query

Save the resulting json file (api.glygen.org.json) in this directory, i.e., 
	THE DIRECTORY HOLDING the script "prepare_N-tree.sh"

!!!!! AUTOMATION STARTS HERE !!!!!
	You can ignore the rest of this file if you automate the remaining steps by invoking 
$	./prepare_N-tree.sh

2. Move the glycan_list (json) file to directory ./data and change its name to mammal_N-glycans.json, like this ...

$	mkdir ./data	
$	mv api.glygen.org.json ./data/mammal_N-glycans.json
		
3. Download the GlycoCT files specifying structures of all fully-defined glycans in GlyGen from:
	
$	curl -o ./data/t2.zip https://raw.githubusercontent.com/glygen-glycan-data/PyGly/master/smw/glycandata/export/fully_determined.zip
	
4. Save the resulting file (fully_determined.zip) in the "./data" directory.
	
		Note that steps 1 - 4 are NOT AUTOMATED.



5. Unpack the zip file, creating directory called ".data/fully_determined".

$	mkdir ./data/fully_determined
$	tar -xf ./data/fully_determined.zip -C ./data/fully_determined


6. Extract the GlyTouCan accessions and generate file names for the mammalian N-glycans using data in the csv file ...

$	awk -f ./code/extractFilenames_json.awk ./data/mammal_N-glycans.json > ./data/mammal_N-glycans.lst

7. Make a list of all GlycoCT files for fully-determined structures.

$	cd ./data/fully_determined/
$	ls -1 G[0-3]*.txt > files.lst
$	ls -1 G[4-6]*.txt >> files.lst
$	ls -1 G[7-9]*.txt >> files.lst
$	cd ../../

8. Generate a file list corresponding to the intersection of fully-determined.lst and mammal_N-glycans.lst:

$	awk -f ./code/intersect.awk data/mammal_N-glycans.lst ./data/fully_determined/files.lst > ./data/complete.lst 


9. The application "GCT2csv.jar" uses a list of GlycoCT files including their path names.  In the context of this workflow, relative path names work, although complete path names will also work. So, generate the file data/complete-paths.lst from complete.lst ...

$	awk -v d="./data/fully_determined/" '{printf("%s%s\n", d, $1);}' ./data/complete.lst > ./data/complete_paths.lst

##### Part B: converting GLycoCT files to csv files #####

10. The file data/complete-paths.lst can be used as input by GCT3csv.jar.  First, a place to put the csv files is required:

$	mkdir ./data/fully_determined/csv

11. Generate csv files - the file GCT2csv.jar (must be present in the directory ./code/)
$	java -jar ./code/GCT2csv.jar ./data/complete_paths.lst list 0 > ./log/make_csv.txt

##### Part C: mapping residues in the csv files to the canonical tree #####

12. Generate an input glycan csv file list for ./code/TreeBuilder3.jar
ls -1 ./data/fully_determined/csv/G*.csv > ./data/fully_determined/csv/files.lst

13. Map the residues in the csv files to the canonical tree
-- The command below works for the most up-to-date model files at the time of this writing ... 
The script ./prepare_N-tree.sh uses the versions found in the directory ./model/

$	java -jar ./code/TreeBuilder3.jar -l ./data/fully_determined/csv/files.lst -s ./model/sugars_V-2.0.csv -c ./model/N-nodes_V-2.2.csv -n 3 -v 1 -m 3 -e 2 -o ./model/ext.csv

14. After TreeBuilder[3] is run with  "-e 2", check which residues remain unassigned:

$	grep "unassigned" ./data/fully_determined/csv/mapped/G* > ./log/unassigned.txt

##### Part C: annotating residues in the canonically mapped csv files with enzymes #####

15. Annotate residues with enzymes using ./code/mkCSVmap.awk
-- The command below works for the most up-to-date enzyme-mappings file at the time of this writing ... 
The script ./prepare_N-tree.sh uses the version found in the directory ./model/
$	awk -f ./code/mkCSVmap.awk ./model/enzyme-mappings_v-2.1.csv ./data/fully_determined/csv/mapped/G*.csv  > ./model/annotated_residues.csv

