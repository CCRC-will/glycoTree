// These data could be easily converted to json objects and consumed as such

// strings used in 'select' tag
var selectStrings = {
	"all": "All Biosynthetically Related Glycans",
	"precursors": "Possible Precursors",
	"products": "Possible Products",
	"anomers": "Modified Substituent(s) and/or Reducing End",
	"match": "Matching Reducing End",
	"specified": "Fully Specified Reducing End"
};

// template strings modified during runtime
var templates = {
	"infoHead": "Exploring glycan <a href='@GLYGEN@ACCESSION' target='glygen_frame'>@ACCESSION</a>",
	"listHead": "Glycans Biosynthetically Related to @ACCESSION",
	"gnomeLink": "Explore accessions related to <a href='@GNOME@ACCESSION' target='_blank'>@ACCESSION</a> using the <i>GNOme Subsumption Browser</i>",
	"sandLink": "You must <a href='explore.html?@ACCESSION' target='_blank'>open a new <i>Sandbox</i></a> to explore glycans biosynthetically related to @ACCESSION",
	"enzHead": "Enzymes that directly impact residue @RESID during biosynthesis of @ACCESSION",
	"enzAll": "Enzymes that directly impact residues in @ACCESSION during its biosynthesis"
};

// modified versions of template strings
var mStr = {
	"null": "null"
}

// constant strings
var dStr = {
	"resTable": "Go to the Residue Table",
	"glyTable": "Go to the Glycan Table",
	"imgHead": "Reference Glycan",
	"tableEnd":	"These data were compiled by \
<a href='https://www.ccrc.uga.edu/personnel/index.php?uid=79&personnel=Non%20Tenure-Track%20Faculty' \
target='_blank'>Alison Nairn</a>, and reflect knowledge developed by \
Dr. Kelley Moremen, Dr. Nairn, and other members of his laboratory.  These data are published in a different \
format on this <a href='https://www.ccrc.uga.edu/~moremen/glycomics/' target='_blank'><b>web site</b></a>.<br> \
The proteins in this list are limited to those enzymes  \
(e.g., glycosyl transferases) that <i>directly impact</i> (e.g., attach) \
<b>residues that are mapped to GlycoTree <i>and</i> that are found in the mature glycan</b>. \
<br>Enzymes involved in generating precursors \
such as lipid-linked intermediates or nucleotide sugars are <b>not shown</b>.<br> \
Software to generate and display full biosynthetic pathways for each glycan is currently under development. <br>\
To see specific enzymes that directly impact each residue in the glycan, <b>click on that residue</b> \
in its <a href='https://www.ncbi.nlm.nih.gov/glycans/snfg.html' target='_blank'>SNFG</a> \
representation on the left."
}

var URLs = {
	"gnome": "https://gnome.glyomics.org/restrictions/GlyGen.StructureBrowser.html?focus=",
	"glygen_glycan": "https://www.glygen.org/glycan/",
	"gene": "https://www.genecards.org/cgi-bin/carddisp.pl?gene=",
	"glygen_protein": "https://www.glygen.org/protein/",
	"uniprot": "https://www.uniprot.org/uniprot/",
	"taxonomy": "https://www.ncbi.nlm.nih.gov/taxonomy/?term=",
	"gene_id": "https://www.ncbi.nlm.nih.gov/gene/"
}