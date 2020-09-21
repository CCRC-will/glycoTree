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
	"gnomeLink": "Explore incompletely defined representations of <a href='@GNOME@ACCESSION' target='_blank'>@ACCESSION</a> using the <i>GNOme Ontology</i>",
	"sandLink": "Open a new <i>Sandbox</i> to explore glycans biosynthetically related to <a href='explore.html?@ACCESSION' target='_blank'>@ACCESSION</a>",
	"enzHead": "Enzymes directly impacting residue @RESID during biosynthesis of @ACCESSION"
};

// modified versions of template strings
var mStr = {
	"null": "null"
}

// constant strings
var dStr = {
	"resTable": "Go to the Residue Table",
	"glyTable": "Go to the Glycan Table",
	"imgHead": "Reference Glycan"
}

var URLs = {
	"gnome": "https://gnome.glyomics.org/restrictions/GlyGen.StructureBrowser.html?focus=",
	"glygen": "https://www.glygen.org/glycan/"
}