Preparing the N-glycan canonical tree


This workflow is partially automated using the bash script "prepare_N-tree.sh"
Only steps 1 - 4 (collecting input files) are required as prerequisites fo the automation
All commands assume the active directory is the one holding this readme file
Shell commands are on lines starting with the command prompt ($)

##### Part A: preparing file lists of biologically relevant GlycoCT files #####

1. Generate a csv list of mammalian N-glycans from GlyGen, using the glycan Advanced Search page with the following parameters:
	- Glycan Type: N-glycan
	- Organism: Homo Sapiens OR Mus musculus OR Rattus norvegicus

2. Download the resulting glycan_list csv file and save the results in the directory holding this readme file. The downloaded file will have a long name, like glycan_list_b18bcd2099e0c23295d54860b0ae93b4.csv
Move the glycan_list file to directory ./data and change its name to mammal_N-glycans.csv mammal_N-glycans.csv, like this ...

$	mkdir ./data	
$	mv glycan_list_b18bcd2099e0c23295d54860b0ae93b4.csv ./data/mammal_N-glycans.csv
		
3. Download the GlycoCT files specifying structures of all fully-defined glycans in GlyGen from:

	https://github.com/glygen-glycan-data/PyGly/blob/master/smw/glycandata/export/fully_determined.zip
	
4. Save the resulting file (fully_determined.zip) in the "./data" directory.
	
		Note that steps 1 - 5 are NOT AUTOMATED.

!!!!! AUTOMATION STARTS HERE !!!!!
	You can ignore the rest of this file if you automate the remaining steps by invoking 
$	./prepare_N-tree.sh

5. Unpack the zip file, creating directory called ".data/fully_determined".

$	mkdir ./data/fully_determined
$	tar -xf ./data/fully_determined.zip -C ./data/fully_determined


6. Extract the GlyTouCan accessions and generate file names for the mammalian N-glycans using data in the csv file ...

$	awk -f ./code/extractFilenames.awk ./data/mammal_N-glycans.csv > ./data/mammal_N-glycans.lst

7. Make a list of all GlycoCT files for fully-determined structures.
	Note: files.lst is removed first so it will not be included (self referentially) in the list

$    rm data/fully_determined/files.lst
$	ls -1 ./data/fully_determined/ > ./data/fully_determined/files.lst
	
8. Generate a file list corresponding to the intersection of fully-determined.lst and mammal_N-glycans.lst:

$	awk -f ./code/intersect.awk data/mammal_N-glycans.lst ./data/fully_determined/files.lst > ./data/complete.lst 


9. The application "GCT2csv.jar" uses a list of GlycoCT files including their path names.  In the context of this workflow, relative path names work, although complete path names will also work. So, generate the file data/complete-paths.lst from complete.lst ...

$	awk -v d="./data/fully_determined/" '{printf("%s%s\n", d, $1);}' ./data/complete.lst > ./data/complete_paths.lst

##### Part B: converting GLycoCT files to csv files #####

10. The file data/complete-paths.lst can be used as input by GCT3csv.java.  First, a place to put the csv files is required:

$	mkdir ./data/fully_determined/csv

11. Generate csv files - the file GCT2csv.jar (must be present in the directory ./code/)
$	java -jar ./code/GCT2csv.jar ./data/complete_paths.lst list 0

##### Part C: mapping residues in the csv files to the canonical tree #####

12. Generate an input glycan csv file list for ./code/TreeBuilder3.jar
ls -1 ./data/fully_determined/csv/G*.csv > ./data/fully_determined/csv/files.lst

13. Map the residues in the csv files to the canonical tree
-- The command below works for the most up-to-date model files at the time of this writing ... 
The script ./prepare_N-tree.sh uses the versions found in the directory .model/

$	java -jar TreeBuilder3.jar -l ./data/fully_determined/csv/files.lst -s ./model/sugars_V-2.0.csv -c ./model/N-nodes_V-2.2.csv -n 3 -v 1 -m 3 -e 2 -o ./model/ext.csv

14. After TreeBuilder[3] is run with  "-e 2", check which residues remain unassigned:

$	grep "unassigned" ./data/fully_determined/csv/mapped/G* > ./log/unassigned.txt

##### Part C: annotating residues in the canonically mapped csv files with enzymes #####

15. Annotate residues with enzymes ./code/mkCSVmap.awk
-- The command below works for the most up-to-date enzyme-mappings file at the time of this writing ... 
The script ./prepare_N-tree.sh uses the version found in the directory .model/
$	awk -f ./code/mkCSVmap.awk ./model/enzyme-mappings_v-2.1.csv ./data/fully_determined/csv/mapped/G*.csv  > ./model/annotated_residues.csv

