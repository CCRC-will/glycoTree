glycoTree is a system to support semantic annotation of glycan structures, based on a canonical representation of those structures.

This representation is based on concepts originally introduced by Takahashi and Kato (https://doi.org/10.4052/tigg.15.235),
and extended by implementing a description logics approach that facilitates semantic annotation of glycan structure.	See:
York, W.S., A. Sheth, K. Kochut, J.A. Miller, C. Thomas, K. Gomadam, X. Yi, and M. Nagarajan.  2004.
"Semantic integration of glycomics data and information."  The Human Disease Glycomics/Proteome Initiative 1st Workshop, Osaka, Japan, August 23-24. (https://unit.aist.go.jp/brd/jp/GTRC/HGPI/ws1/pro.html) 

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
- SVGflatten (DEPRECATED)  - a java class that transforms svg encodings of glycan structure images by removing unnecessary layers, incorporating semantic id attributes to the svg drawing elements, and adding an image element showing the anomeric configuration of the reducing residue (which is missing in the original svg files).  

The  glycoTree model has been initially developed for N-glycans, and its extension to include O-glycans is in progress. The model is implemeted using mySQL as the data repository.

Preparation of the N-glycan canonical tree data is partially automated using the bash script "build_N-tree.sh" 
   A collection of GlycoCT files is required as a prerequisites for the automation.

N-glycan structures can be downloaded from GlyGen:
	GlyGen.org > Explore > Glycans > Advanced Search > Glycan Type 
	Then select, e.g., "N-glycans"

Please examine these scripts (especially build_N-tree.sh) and read the javadocs or comment lines in the programs they invoke for more insight regarding the usage of these programs in other contexts.
