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
	"sandLink": "<a href='explore.html?@ACCESSION' target='_blank'>Open a new <i>Sandbox</i></a> to explore glycans biosynthetically related to @ACCESSION",
	"enzHead": "Enzymes that directly impact residue @RESID during biosynthesis of @ACCESSION",
	"enzAll": "All enzymes that directly impact residues in @ACCESSION during its biosynthesis"
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
	"tableEnd":	"Only enzymes (e.g., glycosyl transferases) that directly impact (e.g., attach) \
		the residues found in the mature glycan are shown.  Enzymes involved in generating precursors \
		such as lipid-linked intermediates or nucleotide sugars are not shown.<br> \
		To see specific enzymes that directly impact each residue in the glycan, click on that residue \
		in its SNFG representation."
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