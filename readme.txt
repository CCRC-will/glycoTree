glycoTree is a system to support semantic annotation of glycan structures, based on a canonical representation of those structures.

This representation is based on concepts originally introduced by Takahashi and Kato (https://doi.org/10.4052/tigg.15.235),
and extended by implementing a description logics approach that facilitates semantic annotation of glycan structure.	See:
York, W.S., A. Sheth, K. Kochut, J.A. Miller, C. Thomas, K. Gomadam, X. Yi, and M. Nagarajan.  2004.
"Semantic integration of glycomics data and information."  Invited lecture, The Human Disease Glycomics/Proteome Initiative 1st Workshop, Osaka, Japan, August 23-24. 

An extensive and rigorous implementation was developed in the form of the GlycO ontology. See:
https://bioportal.bioontology.org/ontologies/GLYCO

Semantics defined in the GlycO ontology was leveraged to enable curation of
glycan structure records by implementing the Qrator software (Eavenson, et al., 2015, PMID: 25165068).

The software in this GitHub repository is a further extension of the concepts described above, developed as part of
the GlyGen initiative (York, et al, 2020, PMID: 31616925), financially supported by the NIH Common Fund:
https://projectreporter.nih.gov/project_info_description.cfm?aid=9391499



Preparing the N-glycan canonical tree


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
The script ./populate_N-tree.sh uses the current versions found in the directory ./model/

$	java -jar ./code/TreeBuilder3.jar -l ./data/def/csv/files.lst -s ./model/sugars_V-2.0.csv -c ./model/N-nodes_V-2.2.csv -n 3 -v 1 -m 3 -e 2 -o ./model/ext.csv > ./log/csv_map.log

** After TreeBuilder[3] is run with  "-e 2", check which residues remain unassigned:

$	grep -h "unassigned" ./data/def/csv/mapped/G* > ./model/unassigned.csv

##### Part C: annotating residues in the canonically mapped csv files with enzymes #####

** Annotate residues with enzymes using ./code/mkCSVmap.awk
-- The command below works for the most up-to-date enzyme-mappings file at the time of this writing ... 
The script ./populate_N-tree.sh uses the current version found in the directory ./model/
$	awk -f ./code/mkCSVmap.awk ./model/enzyme-mappings_v-2.1.csv ./data/def/csv/mapped/G*.csv  > ./model/annotated_residues.csv

