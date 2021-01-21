/*  READ THIS BEFORE MODIFYING:
- iframe is a SEPARATE document
- in SVG, sometimes it is necessary to invoke jquery functions, other times
   it is necessary to invoke vanilla javascript functions
- parentsUntil() returns an ORDERED array, NOT inclusive of the "Until" element
   the order is from closest ancestor to most distant ancestor
- many jquery functions return arrays, not single elements
- most mouse events are triggered from <g> elements with IDs - do NOT navigate
    starting with the actual clicked element, but rather from the <g> element
	containing it
- added annotations are apended to SVG, and as such are direct children of the <svg> element
*/

// constants
var v = 2; // verbosity of console.log
var nodeType = {'R':'residue', 'L':'link', 'LI':'text', 'C':'canvas', 'A':'annotation'};
var greek = {'a': '&alpha;', 'b': '&beta;', 'x': '?'};
// data variables
var acc = [];
var svgPath = [];
var jsonPath = [];
var svgEncoding = [];
var data = [];
var selectedData = [];
var svgCanvasColor = "rgb(255,255,255)";
var annotated = false;
var overNode = false;
var relatedDataExists = false;
var jsonCount = 0;
var svgCount = 0;
var dataAvailable = true;
var unavailable = [];
var allDataRequested = false;
var glycanSelector = "all";
var probeEnd = "";
var probeSubCount = "0";

document.onkeydown = keySet;

function keySet(e) {
	// implement response to keystrokes
	var c = e.keyCode;
	var lc = String.fromCharCode(c).toLowerCase();
	if (/[0-9]/.test(lc) == true) { 
		v = 1 * lc;
		console.log("verbosity changed to " + v);
	}
}


function populateInput(p) {
	if (v > 3) console.log("## Populating arrays for " + p + "##"); // vvv
	acc.push(p);
	// svgPath.push('svg/' + p + '.gTree.svg');
	//  The following paths are hard-coded temporarily to facilitate provisioning
	//     using GitHub/GitHack
	svgPath.push('svg/' + p + '.gTree.svg');
	jsonPath.push('json/' + p + '.json');
}

	
function gNodeLog(gNode) {
	var gKids = gNode.children;
	for (var j = 0; j < gKids.length; j++) {
		var nn = gKids[j].nodeName;
		txt = "Entered <" + nn + ">:";	
		
		switch(nn) {
			case "rect":
				txt += " x " + gKids[j].getAttribute("x") + "; y " + 
  gKids[j].getAttribute("y") + "; height " + 
  gKids[j].getAttribute("height") + "; width " + 
  gKids[j].getAttribute("width");						
				break;
			case "circle":
				txt += " cx " + gKids[j].getAttribute("cx") + "; cy " +
  gKids[j].getAttribute("cy") + "; r " + 
  gKids[j].getAttribute("r");
				break;
			case "polygon":
				txt += " points " + gKids[j].getAttribute("points");
				break;
			case "text":
				txt += " text " + gKids[j].textContent;
				break;
		}
	}
	console.log(txt)
}  // end of function gNodeLog()

	
function enterNode() {
	if (this.style) this.style.cursor = "pointer";
	var id = this.getAttribute("id");
	var parts = parseID(id);
	var t = ', ' + nodeType[parts['type']] + ' ';
	var rid = parts['resID'];
	var txt = "<br>&nbsp; Click now to explore glycan ";
	if (rid == 0) { // mouse over svg canvas
		rid = '';
		t = '';
	}
	txt +=  parts['accession'] + t + rid;
	$('#'+hDiv).html(txt); 
	if (v > 6) gNodeLog(this);

} // end of function enterNode() 
	
	
function exitNode() { 
	$('#'+hDiv).html("<br>Click a structure or residue");
	var id = this.getAttribute("id");
	var parts = parseID(id);
	if (v > 5) console.log("exited node, overNode is " + overNode);

} // end of function exitNode()
	

function clickNode() {
	// this function does not take any arguments - 'this' is the source of an event
	clickResponse(this);
}

function clickResponse(node) {
	// this function takes a node as its argument - no 'this' reference
	//   so it can be called without a click event
	var id = node.getAttribute("id");
	var parts = parseID(id);
	var type = parts["type"];
	var accession = parts["accession"];
	var rd = data[accession].residues;
	
	highlight(accession, node, type);
	var resID = parts["resID"];
	var txt = getInfoText(accession, resID);
	if (v > 5) console.log("##### Info Box content #####\n" + txt + "\n#####");
	$("#"+iDiv).html(txt);
	if ((resID != '0') && (resID.match(/S/) == null) ) { 
		// the canvas itself was not clicked
		//  and the residue is mappable to a glycoTree object
		// ed is enzyme data for residues[resID]
		var ed = rd['#' + resID].enzymes;
		setupEnzymeTable('enzymeTable', ed);
	} else {
		// the canvas itself was clicked
		setupTabs();
		// set up residue table and related glycan table
		//var rg = data[accession]["related_glycans"];
		setupRelatedGlycanTable("relatedTable", selectedData);
		setupResidueTable("residueTable", rd);
		// add event listener for the select element
		$('#glycanSelect').val(glycanSelector);
		$('#glycanSelect').change(function() {
			glycanSelector = $(this).val();
			processFiles();
		});
		// set up ALL enzymes table
		var allEnzymes = getAllEnzymes(rd);
		if (v > 4) console.log("  total number of enzymes is " + allEnzymes.length);
		setupEnzymeTable('enzymeTable', allEnzymes);
	}
} // end of function clickNode()


function getAllEnzymes(residueArray) {
	// generate an array of enzyme objects associated with residueArray
	var allEnzymes = [];
	for (key in residueArray) {
		if (!key.includes("#")) {
			var ed = residueArray[key].enzymes;
			for (key2 in ed) {
				var ok2add = true;
				for (i in allEnzymes) {
					if (ed[key2].gene_name === allEnzymes[i].gene_name) {
						ok2add = false;
					}
				}
				if (ok2add) allEnzymes.push(ed[key2]);				
			}
		}
	}
	return(allEnzymes);
} // end of function getAllEnzymes()


function setupResidueTable(tableName, tableData) {
	var table = $('#'+tableName).DataTable( {

		data: tableData,
		order: [[ 3, "asc" ]],
		paging: false,
		"columnDefs": [
			{"className": "dt-center", "targets": "_all"}
		],
		columns: [
			{ 
				"title": "<a href='https://www.ncbi.nlm.nih.gov/glycans/snfg.html' target='_blank'>SNFG Symbol</a>",
				"data": "sugar_name",
				render: function(data, type, row, meta) {
					var svgName = data.split("-")[0];
					return "<a href='https://pubchem.ncbi.nlm.nih.gov/compound/" + svgName +
						"' target='pubchem'><img src='snfg_images/" + svgName + ".svg'></a>"
				}
			},
			{ 
				"title": "Monosaccharide",
				"data": "html_name"
			},
			{ 
				"title": "Residue ID",
				"data": "residue_id"
			},
			{ 
				"title": "Linked to Residue",
				"data": "parent"
			},
			{ 
				"title": "Linkage Site",
				"data": "site"
			},
			{ 
				"title": "Found Only In",
				"data": "limited_to"
			},
			{ 
				"title": "Not Found In",
				"data": "not_found_in"
			},
			{ 
				"title": "Notes",
				"data": "notes"
			}
		]
	} );
	
} // end of function setupResidueTable()


function setupRelatedGlycanTable(tableName, tableData) {
	var nRes = data[acc[0]].residues.length;

	var table = $('#'+tableName).DataTable( {
/* 
// The following (commented) lines work, but the button is rendered in a very strange way 
// I invite anyone who wants to make this work to do so!!
// This will require including extra js and css files from cdn.datatables.net (see explore.html <head>)
		dom: 'Bfrtip',
		buttons: [{
				extend: "csv",
				text: '<span style="color:black; font-size:28px; text-align:left;">Save as CSV</span>'
			}
		],
*/
		data: tableData,
		order: [[ 3, "asc" ]],
		paging: false,
		"columnDefs": [
			{"className": "dt-center", "targets": "_all"}
		],
		columns: [
			{ 
				"title": "New Sandbox",
				"data": "accession",
				"render": function(data, type, row, meta){
					if(type === 'display'){
						data = '<a href="explore.html?' 
							+ data + '" target="_blank">' + data + '</a>';
					}
					return data;
				}
			},	
			
			{ 
				"title": "GNOme",
				"data": "accession",
				"render": function(data, type, row, meta){
					if(type === 'display'){
						data = '<a href="' + URLs["gnome"] + data +   
							'" target="gnome">' + data + '</a>';
					}
					return data;
				}
			},
			
			{ 
				"title": "GlyGen",
				"data": "accession",
				"render": function(data, type, row, meta){
					if(type === 'display'){
						data = '<a href="' + URLs["glygen_glycan"] + data +  
							'" target="glygen">' + data + '</a>';
					}
					return data;
				}
			},
			
			{ 
				"title": "DP",
				"data": "relative_dp",
				"render": function(data, type, row, meta){
					if(type === 'display'){
						data = nRes + (1.0 * data);
					}
					return data;
				}
			},
			
			{ 
				"title": "Match",
				"data": "match"
			},
			
			{ 
				"title": "Substituents",
				"data": "sub_count"
			},
			
			{ 
				"title": "Reducing End",
				"data": "reducing_end"			
			}
		]
	} );

} // end of function setupRelatedGlycanTable


function setupEnzymeTable(tableName, tableData) {
	var table = $('#'+tableName).DataTable( {
		data: tableData,
		paging: false,
		"columnDefs": [
			{"className": "dt-center", "targets": "_all"}
		],
		columns: [
			{ 
				"title": "Gene",
				"data": "gene_name",
				"render": function(data, type, row, meta){
					if(type === 'display'){
						data = '<a href="' + URLs["gene"] + data + 
							'" target="genecards">' + data + '</a>';
					}
					return data;
				}
			},
			{ 
				"title": "GlyGen",
				"data": "uniprot",
				"render": function(data, type, row, meta){
					if(type === 'display'){
						data = '<a href="' + URLs["glygen_protein"] + data + 
							'" target="glygen">' + data + '</a>';
					}
					return data;
				}
			},
			{ 
				"title": "UniProt",
				"data": "uniprot",
				"render": function(data, type, row, meta){
					if(type === 'display'){
						data = '<a href="' + URLs["uniprot"] + data + 
							'" target="uniprot">' + data + '</a>';
					}
					return data;
				}
			},
			{ 
				"title": "Species",
				"data": "species",
				"render": function(data, type, row, meta){
					if(type === 'display'){
						data = '<a href="' + URLs["taxonomy"] + data + 
							'" target="species">' + data + '</a>';
					}
					return data;
				}
			},
			{ 
				"title": "Type",
				"data": "type"
			},
			{ 
				"title": "Gene ID",
				"data": "gene_id",
				"render": function(data, type, row, meta){
					if(type === 'display'){
						data = '<a href="' + URLs["gene_id"] + data + 
							'" target="dna_refseq">' + data + '</a>';
					}
					return data;
				}
			},
		]
	} );

	// Toggle column visibility
	$('a.toggle-vis').on( 'click', function (e) {
		e.preventDefault();
		var column = table.column( $(this).attr('data-column') );
		column.visible( ! column.visible() );
	} );	
}

function customStrings(accession, resID) {
	// customize mStr values for this glycan and residue
	mStr["infoHead"] = templates["infoHead"].replace("@GLYGEN", URLs["glygen_glycan"]);
	mStr["infoHead"] = mStr["infoHead"].replace(/@ACCESSION/g, accession);	
	mStr["gnomeLink"] = templates["gnomeLink"].replace("@GNOME", URLs["gnome"]);
	mStr["gnomeLink"] = mStr["gnomeLink"].replace(/@ACCESSION/g, accession);
	mStr["sandLink"] = templates["sandLink"].replace(/@ACCESSION/g, accession);
	mStr["enzHead"] = templates["enzHead"].replace(/@ACCESSION/g, accession);
	mStr["enzHead"] = mStr["enzHead"].replace(/@RESID/g, resID);
	mStr["enzAll"] = templates["enzAll"].replace(/@ACCESSION/g, accession);
	
} // end of function customStrings()


function setupTabs() {
	$('#tabs li a:not(:first)').addClass('inactive');
	$('.tableHolder').hide();
	$('.tableHolder:first').show();
	$('#tabs li a').click(function(){
		var t = $(this).attr('href');
		$('#tabs li a').addClass('inactive');        
		$(this).removeClass('inactive');
		$('.tableHolder').hide();
		$(t).fadeIn('slow');
		return false;
	})

	if($(this).hasClass('inactive')){ 
		$('#tabs li a').addClass('inactive');         
		$(this).removeClass('inactive');
		$('.tableHolder').hide();
		$(t).fadeIn('slow');    
	}
} // end of function setupTabs()


function getInfoText(accession, resID) {
	customStrings(accession, resID);
	var txt = "<p class='head1'>" + mStr["infoHead"]; 
	if (resID == '0') {
		// the background canvas was clicked
		var thisSubCount = countElements(getSubstituents(accession));
		txt += " - " + data[accession].residues.length + " residues, " +
			thisSubCount + " substituent(s)</p> \n";
		txt += "<p class='head1'>" + mStr["gnomeLink"] + "</p>\n";
		
		// START OF TABS DIV
		txt += "<div id='tabbox'> \n\
<ul id='tabs'> \n\
	<li><a href='#glycan_table_div'>Related Glycans</a></li> \n\
	<li><a href='#residue_table_div'>Residues</a></li> \n\
	<li><a href='#enzyme_table_div'>Enzymes</a></li> \n\
	</ul> \n\
</div> \n";
		// END OF TABS DIV
		
		// START OF CONTENT BOX
		txt += "<div id='contentbox'> \n";
		
		// START OF GLYCAN TABLE SECTION
		txt += "<div class='tableHolder' id='glycan_table_div'> \n"
		// rg <- glycans related to THIS ACCESSION
		var rg = data[accession]["related_glycans"];
		if  (typeof rg != "undefined")  {
			if (accession == acc[0] ) {
				// create related glycan table object
				txt += "<p><b>" + mStr["listHead"] + "</b> \n";
				// GLYCAN TABLE DROPDOWN (SELECT)
				
				txt += " &emsp; <select class='selectScope' id='glycanSelect'> \n";
				for (key in selectStrings) {
					 txt += "  <option value='" + key + "'>" + selectStrings[key] + "</option> \n";
				}
				txt += "</select> \n" ;
				
				
				txt += "<table id='relatedTable' class='display' width='100%'></table> \n";
			} else {
				txt += "<p><b>" + mStr["sandLink"] + "</b></p> \n"; 
			}
		} else {
			txt += "<hr><p><b>No data for glycans biosynthetically related to " + accession + 
				" are available</b><br>Reason: " + accession + 
				" <i>cannot be fully mapped to GlycoTree</i></p> \n";
		}
		txt += "</div> \n"
		// END OF GLYCAN TABLE SECTION
		
		// START OF RESIDUE TABLE SECTION
		txt += "<div class='tableHolder' id='residue_table_div'> \n\
  <b>Residues in " + accession + "</b> \n\
  <table id='residueTable' class='display' width='100%'></table> \n\
</div> \n";
		// END OF RESIDUE TABLE SECTION
		
		// START OF ENZYME TABLE SECTION
		txt += "<div class='tableHolder' id='enzyme_table_div'> \n\
	<b>" + mStr["enzAll"] + 
	"<a href=\"javascript: document.getElementById('table_end').scrollIntoView();\" class='no_und'> \
	<sup>&#135;</sup></a></b></p> \n\
	<table id='enzymeTable' class='display' width='100%'></table> \n\
	<p id='table_end'> \n\
		<sup>&#135;</sup>" + dStr["tableEnd"] +
	"</p> \n\
</div> \n";
		// END OF RESIDUE TABLE SECTION
		
		// END OF CONTENT BOX
		txt += "</div>\ \n";

	} else {
		var rd = data[accession].residues['#' + resID];
		// rd is 'residue data'
		if (resID.match(/S/) == null) {
			if (rd.canonical_name == "unassigned") txt += " (unassigned)";
			txt += " residue " + resID + "</p> \n";
			if (rd.limited_to.length > 0) txt += "This residue has been found <b>only</b> in " + rd.limited_to + "<br>";
			if (rd.not_found_in.length > 0) txt += "This residue has <b>not</b> been found in " + rd.not_found_in + "<br>";
			if (rd.notes.length > 0) txt += "This canonical residue is " + rd.notes + "<br>";
			
			var svgName = rd.sugar_name.split("-")[0];
			
			txt += "<br> <a href='https://pubchem.ncbi.nlm.nih.gov/compound/" + svgName +
"' target='pubchem'><img src='snfg_images/" + svgName + ".svg'></a> \n\
&emsp;<b>" + rd.html_name + "</b> \n\
linked to residue " + rd.parent + " at site " + rd.site +
" (<a href='https://www.glygen.org/glycan/" + accession + 
"#Dseqence' target='glycoct'>GlycoCT</a> index: " + rd.glycoct_index + ") \n\
<hr><p><b>" + mStr["enzHead"] + "</b> \n\
<table id='enzymeTable' class='display' width='100%'></table> \n\
<br> <b>Show/Hide Column: </b> \n\
  <a class='toggle-vis' data-column='0'>Gene</a> | \n\
  <a class='toggle-vis' data-column='1'>GlyGen</a> | \n\
  <a class='toggle-vis' data-column='2'>UniProt</a> | \n\
  <a class='toggle-vis' data-column='3'>Species</a> | \n\
  <a class='toggle-vis' data-column='4'>Type</a> | \n\
  <a class='toggle-vis' data-column='5'>Gene ID</a>";
		} else {
			txt += "</p><p>&#128683; The residue you clicked cannot be mapped to a glycoTree object &#128683;</p>"
		}
	}

	return(txt);
} // end of  function getInfoText()


function addGlycan(accession) {
	if (!acc.includes(accession)) {
		// do not do any of the following unless the glycan is absent from array 'acc'
		 // $("#progressDiv").css("visibility","visible");
		if (v > 2) console.log("adding " + accession);	
		populateInput(accession);
		if (v > 2) console.log("accession list now has " + acc.length + " structures");
	}
} // end of function addGlycan()

function getRelatedAccessions() {
	// add data for all related glycans
	console.log("### Adding Data for All Related Glycans ### ");
	var probe = acc[0];

	var rg = data[probe]["related_glycans"];
	if ( (dataAvailable == true) && (typeof rg != "undefined") ) {
		if (v > 2) console.log("  adding " + rg.length + " glycans related to " + probe);
		var rgCopy = rg.slice();

		// sort rgCopy by relative_dp -> same order as sorted table
		rgCopy.sort(function(a, b) {
			var nameA = a.relative_dp;
			var nameB = b.relative_dp;
			if (nameA < nameB) {
				return 1;
			}
			if (nameA > nameB) {
				return -1;
			}
			// equal relative_dp
			return 0;
		});

		for (var i = 0; i < rgCopy.length; i++) {
			var newAccession = rgCopy[i].accession;
			// false -> wait until all input variables are populated before fetching data
			addGlycan(newAccession);
		}
		allDataRequested = true;
	}

} // end of function getRelatedAccessions()


function htmlFormatName(residueData) {
			var sName = residueData.sugar_name;
			// place ring form before "NAc" or "NGc" or "-", whichever comes first
			var nacLoc = sName.indexOf('NAc');
			var ngcLoc = sName.indexOf('NGc');
			var dashLoc = sName.indexOf('-');
			var nLoc = Math.max(nacLoc, ngcLoc);
			if (dashLoc > -1) { // there is a '-' in the name
				if (nLoc == -1) {  // there is no Nx in the name
					nLoc = dashLoc;
				}
			}
			var rf =  "<i>" + residueData.ring_form + "</i>";
			var wholeName = sName + rf;
			if (nLoc > -1) {
				wholeName = sName.substring(0, nLoc) + rf + sName.substring(nLoc);
			} else {
				
			}
			var anom = greek[residueData.anomer]; // lookup greek letter
			var cName = anom + "-" + residueData.absolute_configuration + "-" + wholeName;
			return(cName);
} // end or function htmlFormatName()


function highlight(accession, clickedNode, type) {
	// clickedNode is the <g> element whose child was clicked
	
	// revert all drawn elements to their original colors
	var drawn = getDrawnElements("all");
	recolorElements(drawn, "revert");
	// remove css class "boxHighlight" from all drawn elements
	drawn.removeClass(["boxHighlight"]);

	// highlight the <rect> serving as the svg canvas that surrounds the clicked node
	// var g holds the <g> element holding other <g> elements in the clicked svg image
	// when node inside of g is clicked ...
	var g = $(clickedNode).parentsUntil('svg');  // NOT INCLUSIVE OF 'svg'!!!! stops at <g>]
	// clicked text annotation is  is NOT inside of g
	//   must traverse all the way to <body> (not inclusive) then get <g> from ancestor <svg>
	if (type == "A") {
		var s = $(clickedNode).parentsUntil('body'); 
		g = s.children();
	}
		
	// the zeroth element of g is the <g> element holding other <g> elements
	var g0 = g[0];
	// WEIRD - must use mixed jquery and vanilla javascript 
	//   jquery 'children()' returns an array of vanilla javascript elements, 
	//      whose children are fetched by 'children'  (NO parentheses)
	var c = $(g0).children()[0].children[0]; // the <rect> serving as canvas
	// console.log("g0 is " + g0.nodeName + "    c is " + c);
	
	var cj = $(c); // convert to jquery object
	cj.style = "";
	cj.addClass("boxHighlight");
	var thefill = $(cj).css('fill');
	svgCanvasColor = thefill; // global scope - used by recolorElements
	
	// fade the contents of the svg canvas containing the clicked clickedNode
	drawn = getDrawnElements(accession);
	// if the svg canvas is clicked, do not fade its contents
	if (type != "C") recolorElements(drawn, "fade");
	// reset canvas style (overwritten by next line)
	c.style = "";

	// revert the clicked clickedNode to its original color(s)
	// inside <svg> - must retrieve children of clickable <g> element 
	//   (which has an id) as DOM object then convert to jquery object
	//     also remove any DOM class attributes from these children
	var drawnDOM = clickedNode.children; // DOM object
	drawn = $(drawnDOM); // drawn -> jquery object
	// reset fill and stroke of clicked object
	recolorElements(drawn, "revert"); 
	// if svg canvas is clicked, invoke class boxHighlight
	if (type == "C") {
		// !!! to effectuate css class, first remove style from the canvas !!!
		drawn[0].style = "";
		drawn.addClass("boxHighlight");
	}
}
	
	
function fadeColor(cStr, bg, fp) {
	// returns a String!!!
	// bg is canvas background color (RGB)
	// cStr is current color-style of object (e.g., fill="rgb(255,255,0))
	var rgb = cStr.split(/[\\(\\)]/)[1]; // regex parentheses start/end
	if (cStr.localeCompare("black") == 0) rgb = "0,0,0";
	if (cStr.localeCompare("white") == 0) rgb = "255,255,255";
	if (!cStr.includes(",")) rgb = "0,0,0";
	var rgbC = rgb.split(",");
	// reuse rgb variable
	rgb = bg.split(/[\\(\\)]/)[1]; // regular expression
	var rgbB = rgb.split(",");
	var faded = ["255", "255", "255"];  // default white
	for (var i = 0; i < 3; i++){
		faded[i] = Math.round((fp * rgbB[i]) + ((1 - fp) * rgbC[i]));
	}
	var result = "rgb(" + faded.toString() + ")";
	if (v > 5) console.log("      calculated color: " + result);
	return(result);
}  // end of function fade()
	

function parseID(id) {
	var parts = new Array();
	var dashSplit = id.split("-");
	parts["type"] = dashSplit[0];
	var colonSplit = dashSplit[1].split(":");
	parts["accession"] = colonSplit[0];
	parts["resID"] = colonSplit[1];
	return(parts);
}  // end of function parseID()
	
	
function setupFrames() {
	// resize iframe and information div's
	if (v > 2) console.log("##### Resizing Frames #####");
	var canvasH = 155;
	var canvasW = 25;
	var b = $('#' + ifr).contents().find('body');
	b.css('text-align', 'right');
	
	var s = b.find('svg');
	
	// USE VANILLA JAVASCRIPT TO GET/SET ATTRIBUTES of SVG elements!!
	for (var i = 0; i < s.length; i++) {
		var w = 1.0 * s[i].getAttribute('width');
		var h = 1.0 * s[i].getAttribute('height');
		var accession = s[i].getAttribute('id').split('_')[0];
		if (v > 4) console.log("  svg[" + i + "] height: " + h + "; width: " + w );
		canvasH +=  40 + h;
		canvasW = Math.max(canvasW, w + 120);
		// annotate canvas with accession by appending text element
		// this annotation has no ID - it cannot be clicked and it is not toggled
		var textElement = formTextElement((w/2)-40, 0.96*h, 'svgText', "", accession);
		s[i].appendChild(textElement);
	}
	// animate zoom with controlled speed - needs work

	var newLeft = canvasW + 45;

	// `setup` the iframe
	var elem = $('#' + ifr);
	elem.css("width", canvasW + "px");
	elem.css("height", canvasH + "px");
	
	// setup the helpDiv
	elem = $('#' + hDiv);
	elem.css("width", canvasW + "px");
	
	// setup the control div (div2)
	elem = $('#div2');
	elem.css('left', newLeft + 'px');
	
	// setup the infoDiv
	elem = $('#' + iDiv);
	elem.css('left', newLeft + 'px');
	
	if (v > 4) {
		console.log("  canvas -> height: " + canvasH + "; width: " + canvasW );
		console.log("  div2 -> left: " + newLeft + "; height: " + canvasH );
	}
	
	annotateResidues();
	annotated = true;
	toggleResidueAnnotations();
} // end of function setupFrames()


function toggleResidueAnnotations() {
	var b = $('#' + ifr).contents().find('body');
	var s = b.find("svg"); // all <svg> elements in iframe body
	var t = s.find('text[id]');  // <text> elements with 'id' attribute

	if (!annotated) {
		if (v > 4) console.log("Showing annotations");
		t.removeClass(["annotationHidden"]);
		t.addClass(["annotationShown"]);
	} else {
		if (v > 4) console.log("Hiding annotations");
		t.removeClass(["annotationShown"]);
		t.addClass(["annotationHidden"]);
	}
	annotated = !annotated;
}	


function annotateResidues() {
	var b = $('#' + ifr).contents().find('body');
	var s = b.find("svg"); // all <svg> elements in iframe body

	for (var i = 0 ; i < s.length; i++) { // for each svg image
		var accession = s[i].id.split("_")[0];
		if (v > 3) console.log("##### annotating glycan " + accession + " #####");

		var ss = $(s[i]);//.removeClass(); // svg image to jquery object
		var g = ss.find('g[id]');  // <g> elements with 'id' attribute

		g.each(function( index2 ) { // each descendant <g> element having 'id'

			var parts = parseID(this.id);
			var type =  parts['type'];
			var resID = parts['resID'];
			if (type == "R") { // annotate residues only
				var x = 0;
				var y = 0;
				var d = this.children[0]; // first child of the <g> element having 'id'
				if (v > 4) console.log("    annotating node " + index2 + ": type " + type + "; id " + resID);
				var nn = d.nodeName;
				switch(nn) {
					case "circle":
						x = 1 * d.getAttribute('cx');
						y = 1 * d.getAttribute('cy');
						if (v > 4) console.log("         <circle> at " + x + "," + y);
						break;
					case "rect":
						var h = 1 * d.getAttribute('height')
						x = 1 * d.getAttribute('x') + h/2;
						var w = 1 * d.getAttribute('width')
						y = 1 * d.getAttribute('y') + w/2;
						if (v > 4) console.log("         <rect> at " + x + "," + y);
						break;
					case "polygon":
						var p = d.getAttribute("points").trim();
						var pa = p.split(' ');
						var maxEven = 0;
						var minEven = 1000;
						var maxOdd = 0;
						var minOdd = 1000;
						for (var q = 0; q < pa.length; q++) {
							if (q%2 == 0) {
								minEven = Math.min(minEven, pa[q]);
								maxEven = Math.max(maxEven, pa[q]);
							} else {
								minOdd = Math.min(minOdd, pa[q]);
								maxOdd = Math.max(maxOdd, pa[q]);									
							}
						}
						y = (minOdd + maxOdd) / 2;
						x = (minEven + maxEven) / 2;
						if (v > 4) console.log("         <polygon> at " + x + "," + y);
						break;
				}
				var elemID = "A-" + accession + ":" + resID;
				var element = formTextElement(x, y, 'annotationShown', elemID, resID);
				s[i].appendChild(element);
			}

		});

	};

} // end of function annotateResidues()


function formTextElement(x, y, c, id, t) {
	var te = document.createElementNS('http://www.w3.org/2000/svg', 'text');
	te. setAttributeNS(null, 'x', x);
	te. setAttributeNS(null, 'y', y);
	te. setAttributeNS(null, 'class', c);
	if (id != "") {
		te. setAttributeNS(null, 'id', id);
	}
	var txt = document.createTextNode(t);
	te. appendChild(txt);
	return(te);
} // end of function formTextElement()


// write function getGelements(accession) to get elements with semantic IDs, can then just set/unset
//    css opacity property
function getDrawnElements(accession) {
	var b = $('#' + ifr).contents().find('body');
	var select = "#" + accession + "_svg";
	if (accession.localeCompare("all") == 0) select = "svg";
	var s = b.find(select);

	// get the  drawing-element great- grandchildren of the image
	// child is <g>; grandchildren are also <g>; great-grandchildren are <circle>, <rect> etc
	var g = s.find('g');
	var drawnElements = g.children().not('g');
	if (v > 5) {
		console.log("Retrieved " + s.length + " svg image(s) selected as " + select);
		console.log("  " + g.length + " child <g> elements");
		console.log("    " + drawnElements.length + " child drawn elements");
	}
	return(drawnElements);
}
	
	
function recolorElements(drawn, mode) {
	// mode 'revert' reverts back to original colors; 'fade' fades colors
	// the following two variables have global scope - these should be changed globally
	//   svgCanvasColor is set dynamically, e.g., by fetching the fill color of a canvas
	var fp = fadePercent;
	var bg = svgCanvasColor; 
	if (v > 2) console.log("### Recoloring " + drawn.length + " Element(s) ###");
	drawn.each(function( index ) {
		if (v > 4) {
			// could get parent <g> node id and display it as well, but ...
			//   var id = this.parent().attr('id');
			console.log( index + ": <" + this.nodeName + "> recolor mode " + mode);
		}
		// change fill of element
		
		if (this.hasAttribute("origFill")) {
			var fill = this.getAttribute("origFill");
			// change fill only if it has an actual original value
			if (fill.localeCompare("none") != 0) {
				if (mode.localeCompare("revert") == 0) {
					this.style.fill = fill;
				} else {
					var faded = fadeColor(fill, bg, fp);
					this.style.fill = faded;
				}
				if (v > 5) console.log("      fill changed to " + this.style.fill);
			} 
		}
		
	
		// change stroke of element
		if (this.hasAttribute("origStroke")) {
		// var stroke = window.getComputedStyle(this, null).getPropertyValue("stroke");
			var stroke = this.getAttribute("origStroke");
			if ( (stroke != null) && (stroke.localeCompare("none") != 0) ) {
				if (mode.localeCompare("revert") == 0) {
					this.style.stroke = stroke;
				} else {
					faded = fadeColor(stroke, bg, fp);
					this.style.stroke = faded;
				}
				if (v > 5) console.log("      stroke changed to " + this.style.stroke);
			}
		}
		
	});
}  // end of function recolorElements()
	
	
function saveColors() {
	// saves original 'fill' and 'stroke' values of svg <elements>
	if (v > 2) {
		console.log("##### Saving SVG Colors #####");
	}
	var drawn = getDrawnElements("all"); 
	var fill = "";
	var stroke = "";
	for (var j = 0; j < drawn.length; j++) {
		fill = drawn[j].style.fill;
		stroke = drawn[j].style.stroke;
		// elements drawn with no specified stroke use black stroke
		if (stroke.localeCompare("") == 0) stroke = "black"; 
		
		// do NOT reset origiFill and origStroke to CURRENT values
		if (drawn[j].hasAttribute("origFill") == false)
			drawn[j].setAttribute("origFill", fill);
		if (drawn[j].hasAttribute("origStroke") == false)
			drawn[j].setAttribute("origStroke", stroke);
		if (v > 4) {
			console.log("  " + j + ": <" + drawn[j].nodeName +
				"> fill: " + drawn[j].getAttribute('origFill') +
				";  stroke: " + drawn[j].getAttribute('origStroke'));
		}
	}
} // end of function saveColors()


function addSVGevents() {
	// adds event listeners to svg objects and saves their original 'fill' and 'stroke' values
	if (v > 2) {
		console.log("##### Adding Event Listeners to SVG Elements #####");
	}

	var b = $('#' + ifr).contents().find('body');
	var g = b.find('g[id], text[id]');

	for (var i = 0; i < g.length; i++) {

		// USE VANILLA JAVASCRIPT for attributes
		// add event listeners for objects that have an id
		g[i].addEventListener("mouseout", exitNode);
		g[i].addEventListener("mouseover", enterNode);
		g[i].addEventListener("click", clickNode);
	}

} // end of function addSVGevents()

function setResidueKeys() {
	// converts residues of each glycan from array[val0,val1,val2,...] to Object {'key': 'value'}
	if (v > 1) console.log("##### Assigning Keys to Residues #####");
	for (var key in data) {
		var glycan = "glycan[" + key + "]";
		var residues = data[key].residues;
		for (var j = 0; j < residues.length; j++ ) {
			//console.log("j is " + j);
			// FAILS WHEN resID == j - so need prefix "#"
			var key2 = "#" + residues[j].residue_id;
			residues[key2] = residues[j];
			var htmlName = htmlFormatName(residues[key2]);
			residues[key2].html_name = htmlName;
			if (v > 4) {
				console.log("   object key generated for " + glycan + ".residues[" 
							+ j + "]  -> '" + key2 + "'");
				console.log("   data['" + key + "'].residues['" + key2 + "']: html name is '" + 
							residues[key2].html_name +  "'");
			}
		}
	}
} // end of function setResidueKeys()


function setRelatedParams(probe) {
	if (v > 2) console.log("## Setting reducing-end structure and substituents for related glycans ##");
	// get related_glycans for probe
	var related = data[probe].related_glycans;
	for (var i in related) {
		// for each related_glycan [i]
		// get the accession of the related glycan
		var key = related[i].accession;
		related[i].reducing_end = getReducingEndStructure(key);
		related[i].substituents = getSubstituents(key);
		related[i].sub_count = countElements(related[i].substituents);
		if (v > 3) {
			console.log("  Set reducing end for " + key +
				" (" + data[key].residues.length + " residues): " + related[i].reducing_end);
			console.log("  Set number of substituents in " + key + ": " + related[i].sub_count);
		}
	}
} // end of function setRelatedParams()

function getSubstituents(accession) {
	var residues = data[accession].residues;
	var substituents = [];
	for (j in residues) {
		// only check numerically indexed residues
		if (/[A-Z]/.test(j) == false) { 
			var thisSubstituent = {};
			var sugarName = residues[j].sugar_name;
			if (sugarName.includes("-")) {
				if (v > 4) console.log(i + "," + j + ": found substituent " + sugarName +
					 " in " + key );
				var sugarParts = sugarName.split("-");
				var id = residues[j].residue_id;
				thisSubstituent[id] = sugarParts[1];
				substituents.push(thisSubstituent);
			}
		}
	}
	return(substituents);
} // end of function getSubstituents()


function getReducingEndStructure(accession) {
	var residues = data[accession].residues;
	for (j in residues) {
		// only check numerically indexed residues
		if (residues[j].parent == 0) {
			return(residues[j].html_name);
		}
	}
} // end of function getReducingEndStructure()

function showData() {
	// show json data
	// TODO: make txt depend on v
	var txt = "<pre>";
	
	var count = 0;
	var sep = "";
	for (var key in data) {
		var glycan = data[key];
		var total = JSON.stringify(glycan, undefined, 2);
		if (count++ > 0) sep = ",\n\n";
		txt += sep + total;
	}
	txt += "</pre>";
	$('#' + iDiv).html(txt);
}  // end of function showData()


function setupCSSiframe(ifrID, cssSrc) {
	// The iframe cannot use css files imported into the main document
	//    It is a SEPARATE document
	var ifrHead = $('#' + ifr).contents().find('head');
	var cssLink = document.createElement("link");
	cssLink.href = cssSrc; 
	cssLink.rel = "stylesheet"; 
	cssLink.type = "text/css"; 
	ifrHead[0].appendChild(cssLink);
} // end of function setupCSSiframe()
		
	
function fetchData(theURL, accession, dest, isJSON) {
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			if (isJSON) {
				dest[accession] = JSON.parse(this.responseText);
			} else {
				dest[accession] = this.responseText;
			}
			if (v > 2) console.log(" ... Retrieved a file for " + accession);
		}
		if (this.readyState == 4 && this.status == 404) {
			if (isJSON) {
				unavailable.push("JSON data for " + accession);
			} else {
				unavailable.push("SVG Encoding for " + accession);
			}
			if (v > 0) console.log("File " + theURL + " not found" + dest);
			dataAvailable = false;
		}
	};
	xhttp.onerror = function() {
		alert("File request failed: " + theURL);
	};
	xhttp.open("GET", theURL, true);
	xhttp.send();
} // end of function fetchData()
	
		
function getNextSVG(c) {
	while ((c < svgPath.length) && (dataOK == true) ){
		getSVG(svgPath[c], c, acc[c]);
		if (v > 2) {
			console.log("getting next SVG: " + svgPath[c]);
			console.log("getting next json: " + jsonPath[c]);
		}
		getJSON(jsonPath[c], c, acc[c]);
		c++;
	} 
} // end of function getNextSVG()


function simXOR(x, y) {
	// NO XOR IN JAVASCRIPT - SO SIMULATE IT
	return( x || y ) && !( x && y );
}


function getSelectedData(selector) {
	console.log("glycan selector is " + selector);
	// returns an edited array of related_glycans objects for rendering and listing
	var probeData = data[acc[0]];
	var rg = probeData["related_glycans"];

	for (i in rg) {
		if (rg[i].accession == acc[0]) {
			probeEnd = rg[i].reducing_end;
			probeSubCount = rg[i].sub_count;
		}
	}
	if (v > 2) {
		console.log("   probe is " + acc[0]);
		console.log("   probeEnd is " + probeEnd);
	}
	var rgEdited = [];
	switch(selector) {
		case "all":
			for (i in rg) {
				if (rg[i].accession != acc[0]) {
					rgEdited.push(rg[i]);
				}
			}
			break;
		case "precursors":
			for (i in rg) {
				var endOK = (rg[i].reducing_end == probeEnd);
				var dpOK = ( (rg[i].sub_count == probeSubCount) && (rg[i].relative_dp < 0));
				var subOK = ( (rg[i].sub_count < probeSubCount) && (rg[i].relative_dp == 0) );
				if (endOK) if( simXOR(dpOK, subOK) ) {
					rgEdited.push(rg[i]);
				}
			}
			break;
		case "products":
			for (i in rg) {
				var endOK = (rg[i].reducing_end == probeEnd);
				var dpOK = ( (rg[i].sub_count == probeSubCount) && (rg[i].relative_dp > 0));
				var subOK = ( (rg[i].sub_count > probeSubCount)  && (rg[i].relative_dp == 0) );
				if (endOK) if( simXOR(dpOK, subOK) ) {
					rgEdited.push(rg[i]);
				}
			}
			break;
		case "anomers":
			for (i in rg) {
				if ((rg[i].relative_dp == 0) && 
					( (rg[i].reducing_end != probeEnd) || (rg[i].sub_count != probeSubCount) ) ) {
						rgEdited.push(rg[i]);
				}
			}
			break;
		case "match":
			for (i in rg) {
				if ((rg[i].accession != acc[0]) && (rg[i].reducing_end == probeEnd) ) {
					rgEdited.push(rg[i]);
				}
			}
			break;
		case "specified":
			for (i in rg) {
				//if (rg[i].accession != acc[0]) {
				if ((rg[i].accession != acc[0]) && (rg[i].reducing_end.includes("?") == false) ) {
					rgEdited.push(rg[i]);
				}
			}
			break;
	}
	
	// sort rgEdited by relative_dp -> same order as sorted table
	rgEdited.sort(function(a, b) {
		var valA = a.relative_dp;
		var valB = b.relative_dp;
		if (valA < valB) {
			return 1;
		}
		if (valA > valB) {
			return -1;
		}
		// equal relative_dp
		return 0;
	});
	return(rgEdited);
} // end of function getSelectedData()


function processFiles() {
	if (v > 0) console.log("### Processing Data From Files ###");

		setResidueKeys();  // convert json 'residues' to associative array
		var related = data[acc[0]].related_glycans;
		relatedDataExists = (typeof related != "undefined");
		if ( allDataRequested && relatedDataExists ) 
			setRelatedParams(acc[0]);
		var fd = document.getElementById(ifr).contentWindow.document;
		// render the probe structure - write html as text then add to iframe
		var htmlEncoding = "&emsp; <br><center><h3>" + dStr["imgHead"] + "</h3></center>";
		htmlEncoding += "<p>" + svgEncoding[acc[0]] + "&emsp; <br></p><hr>";
		htmlEncoding += "<center><b>" + mStr["listHead"] + "<br>" + selectStrings[glycanSelector] + "</b></center>";
		
		if (acc.length > 1) {
			// selected data does NOT include the reference structure - only related structures
			selectedData = getSelectedData(glycanSelector);
			console.log("selectedData is ");
			console.log(selectedData);
			var sep = "";
			for (i = 0; i < selectedData.length; i++) {
				var key = selectedData[i].accession;
				htmlEncoding += sep + "<p>" + svgEncoding[key];
				sep = "&emsp; <br>";
			}
			htmlEncoding += "<br></p>"
		}
		
		fd.open();
		fd.write(htmlEncoding);
		var b = $('#' + ifr).contents().find('body');
		var s = b.find("svg"); // all <svg> elements in iframe body
		// s.css("opacity", "0.6");
		s.addClass("zoomer"); 
		// fd.close();
		// set up graphics and data
		setupFrames();  // calculate required <element> sizes and locations
		saveColors(); // saves original colors in svg <elements>
		addSVGevents();
		setupCSSiframe(ifr, iframeCSS);
		if (v > 2) console.log("##### Finished Setup #####");
		$("#progressDiv").css("visibility","hidden");
		if (allDataRequested == true)  {
			// simulate click of probe glycan canvas 
			var topCanvas = $('#' + ifr).contents().find("g")[1];
			clickResponse(topCanvas);
		}
}


function getFiles(i) {
	fetchData(svgPath[i], acc[i], svgEncoding, false);
	fetchData(jsonPath[i], acc[i], data, true);
} // end of function getData()


function countElements(object) {
	var count = 0;
	for(var key in object) {
		if(object.hasOwnProperty(key)) ++count;
	}
	return count;
}


function dataReady() {
	var n1 = acc.length;
	var n2 = countElements(svgEncoding);
	var n3 = countElements(data);
	var ready = ((n1 > 0) && (n2 === n1) && (n3 === n2))
	return(ready);
} // end of function dataReady()


function wait2add() {
	if (dataReady() == false) {
		if (v > 2) console.log("  ready is " + dataReady() + " - waiting to add accessions");
		if (dataAvailable) {
			window.setTimeout(wait2add, 200); 
		} else {
			terminate("Reference Glycan");
		}
    } else {
		getRelatedAccessions();
		if (allDataRequested)
			for (i = 1; i < acc.length; i++) {
				getFiles(i);
			}
		if (acc.length > 1) {
			wait2process();
		} else {
			processFiles();
		}
	}
}


function wait2process () {
	if (dataReady() == false) {
		if (v > 2) console.log("  ready is " + dataReady() + " - waiting to process accessions");
		if (dataAvailable) {
			window.setTimeout(wait2process, 200); 
		} else {
			terminate("Related Glycan");
		}
    } else {
		if (v > 4) console.log("... ready to process data ");
		processFiles();
	}
}


function terminate(which) {
	var termStr = "<br><br><br><br><br><br><h1>" + which + " Data for " + acc[0] + " Is Not Available</h1>";
	termStr += "<h3>Missing: </h3>";
	for (i = 0; i < unavailable.length; i++) {
		termStr += "<h3>" + unavailable[i] + "</h3>";
	}
	$("#" + hDiv).html(termStr);
	$("#" + iDiv).html("");
	$("#progressDiv").css("visibility","hidden");
}


function initialize() {
	$("#progressDiv").css("visibility","visible");
	if (v > 1) console.log("##### Initializing #####");
	setupAnimation('logo_svg', 'header');
	var arg = window.location.search.substring(1).split("&")[0];
	// setup arrays with input parameters
	// account for http requests from html <form> (GET method)
	var a = arg.split("=");
	a = a[a.length - 1];
	populateInput(a);	
	mStr["listHead"] = templates["listHead"].replace(/@ACCESSION/g, a);
	// fetch and process the images and data
	getFiles(0);
	wait2add();

} // end of function initialize()
