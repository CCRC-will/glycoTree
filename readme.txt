glycoTree is a system to support semantic annotation of glycan structures, based on a canonical representation of those structures.

This representation is based on concepts originally introduced by Takahashi and Kato (https://doi.org/10.4052/tigg.15.235),
and extended by implementing a description logics approach that facilitates semantic annotation of glycan structure.	See:
York, W.S., A. Sheth, K. Kochut, J.A. Miller, C. Thomas, K. Gomadam, X. Yi, and M. Nagarajan.  2004.
"Semantic integration of glycomics data and information."  Invited lecture, The Human Disease Glycomics/Proteome Initiative 1st Workshop, Osaka, Japan, August 23-24. 

An extensive and rigorous implementation of glycoTree was developed in the form of the GlycO ontology. See:
https://bioportal.bioontology.org/ontologies/GLYCO

Semantics defined in the GlycO ontology was leveraged to enable curation of
glycan structure records by implementing the Qrator software (Eavenson, et al., 2015, PMID: 25165068).

The software in this GitHub repository is a further extension of the concepts described above, developed as part of
the GlyGen initiative (York, et al, 2020, PMID: 31616925), financially supported by the NIH Common Fund:
https://projectreporter.nih.gov/project_info_description.cfm?aid=9391499

The glycoTree project includes several different software packages, including:
- GenerateCSV - a java class that takes GlycoCT files as input and generated csv files in "glycoTree" format
- TreeBuilder -a java class that semantially annotates the glycoTree files by mapping the sugar residues they specify to residues in the canonical glycoTree
- several awk and shell scripts that collect files, invoke the java classes, and make inferential assertions, which are saved in other files
- SVGflatten - a java class that transforms svg encodings of glycan structure images by removing unnecessary layers, incorporating semantic id attributes to the svg drawing elements, and adding an image element showing the anomeric configuration of the reducing residue (which is missing in the original svg files).  The semantic id's specify an image element type (residue, link, or link annotation), the GlyTouCan accession of the rendered glycan, and the canonical index of each residue in the structure, like this: "R-G40194MN:NC".

The  glycoTree model has been initially developed for N-glycans, and its extension to include O-glycans is in progress. The model comprises several files:
- the glycoTree itself is defined in a "nodes" file (currently "N-nodes.csv" for N-glycans).  This file is based on the tree initially specified in the GlycO ontology. Extension of the tree with the incorporation of new structures is semiautomatic; new nodes are suggested by TreeBuilder, and those deemed biochemcially consistent are manually added to the tree by a human curator.  Once a residue has been added to the canonical tree, it should be immutable.  This does not imply any biological relevance of the residue; its relevance is specified only by mapping it to a specific biological process (e.g., biosynthesis of N-glycans).
- mappings of canonical residues to biological processes are held in manually generated mapping files, which are highly curated.  The file "enzyme-mappings.csv" currently holds "glycoenzymes" mapped to specific residues in the canonical N-glycan tree.  For example, the enzyme ALG1 (which catalyzes the addition of the core beta-mannosyl residue to the growing N-glycan lipid-linked precusor) is mapped to "N-glycan_core_b-D-Manp" (the core beta-mannosyl residue).
- assertions for individual N-glycan structures (indexed using GlyTouCan accessions) are inferred from these mappings and held in a summary file model/annotated_glycans.csv.  For example, this file asserts that in humans, biosynthesis of a SPECIFIC glycan (e.g., G00176HZ) involves the addition of the core beta-mannose by the glycosyltransferase (GT) with UniProt accession Q9BT22.  These assertions are also held in model/annotated_glycans.json and in the individual files in model/json/

Preparation of the N-glycan canonical tree data is partially automated using the bash script "populate_N-tree.sh" Only step 1 (collecting input file specifying the structures of mamallian N-glycans) is required as a prerequisites for the automation.

The N-glycan structures can be retrieved using the following query:

https://api.glygen.org/directsearch/glycan/?query={"operation":"AND","query_type":"search_glycan","glytoucan_ac":"","organism":{"organism_list":[{"name":"Rattus norvegicus","id":10116},{"name":"Homo sapiens","id":9606},{"name":"Mus musculus","id":10090}],"operation":"or"},"glycan_type":"N-glycan"}

The populate_N-tree.sh script generates a glycoTree csv file for each glycan in the source data directory and populates the "annotated_glycans.csv" file.

Transformation of svg files is performed by the script populate_N-tree.sh, which invokes the SVGflatten class. This process can also be performed independently by convertSVG.sh. Transformed svg files are held in subfolders of the model/ folder.  Mappings of the original svg element id's with the new, semantic id's are held in the map_xxx files in the model/ folder.

Original svg files that correspond to the annotated glycan .csv files can be imported from a local directory by appending an argument, specifying the source svg directory, to the ./populate_N-tree.sh in the command line.  If no argument is used, the svg files already present in data/svg/ are processed.

Please examine these scripts (especially populate_N-tree.sh) and read the javadocs or comment lines in the programs they invoke for more insight regarding the usage of these programs in other contexts.
