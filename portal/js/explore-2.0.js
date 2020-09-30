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
var v = 1; // verbosity of console.log
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
var jsonCount = 0;
var svgCount = 0;
var dataReady = false;
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
	if (lc === "j") {
		showData();
	}
	if (lc === "i") {
		processFiles();
	}
	if (lc === "h") {
		$('#' + iDiv).html("<h2>Help Text Goes Here</h2>");
	}
}


function populateInput(p) {
	acc.push(p);
	// svgPath.push('svg/' + p + '.gTree.svg');
	//  The following paths are hard-coded temporarily to facilitate provisioning
	//     using GitHub/GitHack
	svgPath.push('../model/gTree_svg/' + p + '.gTree.svg');
	jsonPath.push('../model/json/complete/' + p + '.json');
}

	
function gNodeLog(gNode) {
	var gKids = gNode.children;
	for (var j = 0; j < gKids.length; j++) {
		var nn = gKids[j].nodeName;
		txt = "Entered <" + nn + ">:";	
		
		switch(nn) {
			case "rect":
				txt += " x " + gKids[j].getAttribute("x");
				txt += "; y " + gKids[j].getAttribute("y");
				txt += "; height " + gKids[j].getAttribute("height");
				txt += "; width " + gKids[j].getAttribute("width");						
				break;
			case "circle":
				txt += " cx " + gKids[j].getAttribute("cx");
				txt += "; cy " + gKids[j].getAttribute("cy");
				txt += "; r " + gKids[j].getAttribute("r");
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
	if (v > 3) gNodeLog(this);
	
	// scale the svg image holding the canvas
	var s = $(this).parentsUntil("body"); // returns an array!!!!
	if (v > 5) { 
		console.log("  entered node type " + parts['type']);
		console.log("    this: " + this);
		for (var i =  0; i < s.length; i++) {
			console.log("    " + i + ": " + s[i]);
		}
	}
	if (parts['type'] == "C") { // mouse entered the canvas
		if (v > 5) console.log("entered canvas, overNode is " + overNode);
		if (overNode == false) { // mouse did not enter from node
			// increase the scale of the canvas
			/* 
			// this long way works, but parentsUntil() is more direct
			var b = $('#' + ifr).contents().find('body');
			var s = b.find('svg');
			for (var i = 0; i < s.length; i++) {
				var c = $(s[i]).find(this);
				if (c.length == 1) { // 'this' is a descendant of the <svg> object
					if (v > 4) console.log("mouse entered svg " + s[i].getAttribute('id'));
					s[i].setAttributeNS(null, "transform", "scale(1.2)");
				}
			}
			*/
			//  parentsUntil returns an array, starting from the closest ancestor 
			//   to the most remote - not inclusinve of the "Until" ancestor
			// q = $(s[0]).removeClass();
			s[1].setAttributeNS(null, "transform", "scale(1.2)");
			// console.log("s[0] is " + s[0] + "  with parent " + s[0].parent);
		}
	} else { // mouse entered a node in the canvas
		overNode = true;
	}
	

} // end of function enterNode() 
	
	
function exitNode() { 
	$('#'+hDiv).html("<br>Move the mouse over a structure or residue");
	var id = this.getAttribute("id");
	var parts = parseID(id);
	if (v > 5) console.log("exited node, overNode is " + overNode);
	setTimeout(function(){ // wait for mouse enter event to be processed
		if ( (parts['type'] == "C") && (overNode == false) ){  // mouse exited the canvas
			// set ALL canvases to their original size
			var b = $('#' + ifr).contents().find('body');	
			var s = b.find('svg');
			for (var i = 0; i < s.length; i++) {
				s[i].setAttributeNS(null, "transform", "scale(1.0)");
			}
		} else { // mouse just exited a node in the canvas (so it's still in the canvas)
			overNode = false;
		}
		
	}, 5);

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
	var rd = data[accession].residues
	
	highlight(accession, node, type);
	var resID = parts["resID"];
	var txt = getInfoText(accession, resID);
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
	}
} // end of function clickNode()


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
				"title": "Symbol",
				"data": "sugar_name",
				render: function(data, type, row, meta) {
					var svgName = data.split("-")[0];
					return '<img src="snfg_images/' + svgName + '.svg">'
				}

			},			{ 
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
			}
		]
	} );
	
} // end of function setupResidueTable()


function setupRelatedGlycanTable(tableName, tableData) {
	var nRes = data[acc[0]].residues.length;
	
	var table = $('#'+tableName).DataTable( {
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
	// NEXT LINE - TEMPORARY EXPLICIT HARD CODING - WTF?
	// mStr["gnomeLink"] = "<a href='https://www.glygen.org/glycan/G71835BN' target='glygen_frame'>G71835BN</a>";
	mStr["sandLink"] = templates["sandLink"].replace(/@ACCESSION/g, accession);
	mStr["enzHead"] = templates["enzHead"].replace(/@ACCESSION/g, accession);
	mStr["enzHead"] = mStr["enzHead"].replace(/@RESID/g, resID);
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
		// rgRef <- glycans related to THE REFERENCE ACCESSION
		var rgRef = data[acc[0]]["related_glycans"];
		var thisSubCount = 0;
		// the background canvas was clicked
		for (i = 0; i < rgRef.length; i++) {
			if (rgRef[i].accession == accession) {
				thisSubCount = rgRef[i]["sub_count"];
			}
		}
		txt += " - " + data[accession].residues.length + " residues, " +
			thisSubCount + " substituent(s)</p>";
		txt += "<p class='head1'>" + mStr["gnomeLink"] + "</p>";
		
		// START OF TABS DIV
		txt += "<div id='tabbox'>" +
			"<ul id='tabs'>" +
			"<li><a href='#glycan_table_div'>Related Glycans</a></li>" +
			"<li><a href='#residue_table_div'>Residues</a></li>" +
			"<li><a href='#enzyme_table_div'>Enzymes</a></li>" +
			"</ul>" +
			"</div>";
		// END OF TABS DIV
		
		// START OF CONTENT BOX
		txt += "<div id='contentbox'>";
		
		// START OF GLYCAN TABLE SECTION
		txt += "<div class='tableHolder' id='glycan_table_div'>"
		// rg <- glycans related to THIS ACCESSION
		var rg = data[accession]["related_glycans"];
		if  (typeof rg != "undefined")  {
			if (accession == acc[0] ) {
				// create related glycan table object
				txt += "<p><b>" + mStr["listHead"] + "</b>";
				// GLYCAN TABLE DROPDOWN (SELECT)
				
				txt += " &emsp; <select class='selectScope' id='glycanSelect'>";
				for (key in selectStrings) {
					 txt += "\n  <option value='" + key + "'>" + selectStrings[key] + "</option>";
				}
				txt += "</select>" ;
				
				
				txt += "<table id='relatedTable' class='display' width='100%'></table>";
			} else {
				txt += "<p><b>" + mStr["sandLink"] + "</b></p>"; 
			}
		} else {
			txt += "<hr><p><b>No data for glycans biosynthetically related to " + accession + 
				" are available</b><br>Reason: " + accession + 
				" <i>cannot be fully mapped to GlycoTree</i></p>";
		}
		txt += "</div>"
		// END OF GLYCAN TABLE SECTION
		
		// START OF RESIDUE TABLE SECTION
		txt += "<div class='tableHolder' id='residue_table_div'>"
		txt += "<b>Residues in " + accession + "</b>";
		txt += "<table id='residueTable' class='display' width='100%'></table>";
		txt += "</div>"
		// END OF RESIDUE TABLE SECTION
		
		// START OF ENZYME TABLE SECTION
		txt += "<div class='tableHolder' id='enzyme_table_div'>"
		txt += "<p>&#128736; <b>Table showing all enzymes involved in the biosynthesis of " + accession +
			" is under development</b> &#128736;</p>";
		txt += "<p>For now, click on each residue of " + accession +
			" to view enzymes directly impacting that residue</p>";
		txt += "</div>";
		// END OF RESIDUE TABLE SECTION
		
		// END OF CONTENT BOX
		txt += "</div>";

	} else {
		var rd = data[accession].residues['#' + resID];
		// rd is 'residue data'
		if (resID.match(/S/) == null) {
			if (rd.canonical_name == "unassigned") txt += " (unassigned)";
			txt += " residue " + resID + "</p>";
			
			var svgName = rd.sugar_name.split("-")[0];
			
			txt += "<br> <a href='https://pubchem.ncbi.nlm.nih.gov/compound/" + svgName +
				"' target='pubchem'><img src='snfg_images/" + svgName + ".svg'></a>";
			
			txt += "&emsp;<b>" + rd.html_name + "</b>";

			txt += " linked to residue " + rd.parent + " at site " + rd.site;
			txt += " (<a href='https://www.glygen.org/glycan/" + accession + "#Dseqence' target='glycoct'>GlycoCT</a> index: " + rd.glycoct_index + ")";
			// txt += "<br> <a href='https://pubchem.ncbi.nlm.nih.gov/compound/" + rd.pubchem_id +
			//	"' target='pubchem'> PubChem compound: " + rd.pubchem_id + "</a>";
			txt += "<hr><p><b>" + mStr["enzHead"] + "</b>";
			txt += "<table id='enzymeTable' class='display' width='100%'></table>";

			txt += "<br> <b>Show/Hide: </b>" +
				"<a class='toggle-vis' data-column='0'>Gene</a>" + 
				"; <a class='toggle-vis' data-column='1'>GlyGen</a>" + 
				"; <a class='toggle-vis' data-column='2'>UniProt</a>" + 
				"; <a class='toggle-vis' data-column='3'>Species</a>" + 
				"; <a class='toggle-vis' data-column='4'>Type</a>" + 
				"; <a class='toggle-vis' data-column='5'>Gene ID</a>";
		} else {
			txt += "</p><p>&#128683; The residue you clicked cannot be mapped to a glycoTree object &#128683;</p>"
		}
	}

	return(txt);
} // end of  function getInfoText()


function addGlycan(accession, single) {
	if (v > 2) console.log("trying to add " + accession);
	if (!acc.includes(accession)) {
		// do not do any of the following unless the glycan is absent from array 'acc'
		$("#progressDiv").css("visibility","visible");
		if (v > 2) console.log("adding " + accession);	
		populateInput(accession);
		if (v > 2) console.log("accession list now has " + acc.length + " structures");
		// if multiple glycans are being added, wait until all input variables are populated before fetching data
		if (single) {
			getNextSVG(jsonCount); 
			processFiles();
		}
	}
} // end of function addGlycan()

function addAll() {
	// get accessions for all related glycans
	console.log("### Adding All Related Glycans ###");
	if ( dataReady == false ) {
		console.log("   - waiting to add all related glycans -");
		window.setTimeout(addAll, 200); 
    } else {
		var probe = acc[0];
		var rg = data[probe]["related_glycans"];
		console.log("  adding " + rg.length + " glycans related to " + probe);
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
			addGlycan(newAccession, false);
		}
		getNextSVG(jsonCount); 
		allDataRequested = true;
		processFiles();
		//  need to render and process all new files@@@@@@@@@@@ 
	}
} // end of function addAll()


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
	drawn = $(drawnDOM).removeClass(); // jquery object
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

	//  DOES NOT WORK below //
	/*
	var zoomIn = document.createElementNS('http://www.w3.org/2000/svg','animate');
	zoomIn.setAttributeNS(null,'attributeName','scale');
	zoomIn.setAttributeNS(null,'from','1.0');
	zoomIn.setAttributeNS(null,'to','1.2');
	zoomIn.setAttribute('dur', '500ms');
	*/
	//  DOES NOT WORK above //
	
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
		
		//  DOES NOT WORK below //
		/*
		var theID = s[i].getAttribute("id");
		var zID = theID + "_zoom";
		console.log("svg zoom ID is " + zID );
		zoomIn.setAttribute('id', zID);
		console.log("zoom: " + zoomIn);
		console.log("zoom to: " + zoomIn.getAttribute('to'));
		s[i].appendChild(zoomIn);
		*/
		//  DOES NOT WORK above - zoomIn is NOT appended to svg encoding//
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

		var ss = $(s[i]).removeClass(); // svg image to jquery object
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


function setRelatedReducingStructures(probe) {
	if (v > 2) console.log("## Setting reducing structures ##");
	// get related_glycans for probe
	var related = data[probe].related_glycans;
	for (var i in related) {
		// for each related_glycan [i]
		var key = related[i].accession;
		// get reducing end and substituents of related glycan [i]
		var relatedGlycanResidues = data[key].residues;
		var subCount = 0;
		var reducingEnd = "null";
		var substituents = [];
		for (j in relatedGlycanResidues) {
			// for each residue [j] in related_glycan [i]
			if (/[A-Z]/.test(j) == false) { 
				// only check numerically indexed residues
				
				if (relatedGlycanResidues[j].parent == 0) {
					reducingEnd = relatedGlycanResidues[j].html_name;
				}
				var thisSubstituent = {};
				var sugarName = relatedGlycanResidues[j].sugar_name;
				if (sugarName.includes("-")) {
					if (v > 4) console.log(i + "," + j + ": found substituent " + sugarName +
						 " in " + key );
					var sugarParts = sugarName.split("-");
					var id = relatedGlycanResidues[j].residue_id;
					thisSubstituent[id] = sugarParts[1];
					substituents.push(thisSubstituent);
					subCount++;
				}
			}
		}
		related[i].reducing_end = reducingEnd;
		related[i].sub_count = subCount;
		related[i].substituents = substituents;
		if (v > 3) {
			console.log("  Set reducing end for " + key +
				" (" + relatedGlycanResidues.length + " residues): " + related[i].reducing_end);
			console.log("  Set number of substituents in " + key + ": " + subCount);
		}
	}
} // end of function setRelatedReducingStructures()

	
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

	
function getJSON(theURL, c, accession) {
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			data[accession] =  JSON.parse(this.responseText);
			if (v > 2) console.log("Retrieved JSON file #" + jsonCount + " - " + accession);
			jsonCount++;
		}
	};
	xhttp.onerror = function() {
		alert("JSON file request failed");
	};
	xhttp.open("GET", theURL, true);
	xhttp.send();
} // end of function getJSON()
		
	
function getSVG(theURL, c, accession) {
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			svgEncoding[accession] = this.responseText;
			if (v > 2) console.log("# Retrieved SVG file #" + svgCount + " - " + accession);
			svgCount ++;
		}
	};
	xhttp.onerror = function() {
		alert("SVG file request failed");
	};
	xhttp.open("GET", theURL, true);
	xhttp.send();
} // end of function getSVG()
	
		
function getNextSVG(c) {
	while (c < svgPath.length) {
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
	if ( (svgCount < acc.length) || (jsonCount < acc.length) ) {
		if (v > 0) console.log("  - waiting to process data from files -");
		window.setTimeout(processFiles, 500); 
    } else {
		if (v > 0) console.log("  - processing data from files -");
		setResidueKeys();  // convert json 'residues' to associative array
		if (allDataRequested == true) setRelatedReducingStructures(acc[0]);
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
		// fd.close();
		// set up graphics and data
		setupFrames();  // calculate required <element> sizes and locations
		saveColors(); // saves original colors in svg <elements>
		addSVGevents();
		setupCSSiframe(ifr, iframeCSS);
		if (v > 2) console.log("##### Finished Setup #####");
		$("#progressDiv").css("visibility","hidden");
		dataReady = true;
		if (allDataRequested == true)  {
			// simulate click of probe glycan canvas 
			var topCanvas = $('#' + ifr).contents().find("g")[1];
			clickResponse(topCanvas);
		}
    }
}


function initialize() {
	$("#progressDiv").css("visibility","visible");
	if (v > 2) console.log("##### Initializing #####");
	setupAnimation('logo_svg', 'header');
	var args = window.location.search.substring(1).split("&");
	// setup arrays with input parameters
	if (args) args.forEach(populateInput);	
	// fetch and process the images and data
	dataReady = false;
	getNextSVG(0);
	mStr["listHead"] = templates["listHead"].replace(/@ACCESSION/g, acc[0]);
	processFiles();
	addAll(); 
	$("#verbosity").val(v);
} // end of function initialize()

	
function changeB() {
	var bg = $("#bgColor").val();
	$("#"+ifr).css("background-color", bg);
	if (v > 2) console.log("background changed to " + bg);
}