// constants
var nodeType = {'R':'residue', 'L':'link', 'LI':'text', 'C':'canvas'};
// data variables
var acc = [];
var svgPath = [];
var jsonPath = [];
var data = [];

function populateInput(p) {
	acc.push(p);
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

} // end of function enterNode()
	
	
function exitNode() {
	$('#'+hDiv).html("<br>Move the mouse over a structure");
} // end of function enterNode()
	

function clickNode() {
	var id = this.getAttribute("id");
	var str = "&nbsp; clicked SVG object with id  " + id;
	var parts = parseID(id);
	var type = parts["type"];
	var accession = parts["accession"];
	// temporary
	highlight(accession, this, type);
	var resID = parts["resID"];
	var txt = getResultTxt(accession, resID, rd);
	$("#"+iDiv).html(txt);
	if (resID != '0') {
		var rd = data[accession].residues['_' + resID];
		// ed is enzyme data for residues[resID]
		var ed = rd.enzymes;
		var tData = [];
		for (var i in ed) {
			tData[i] = [ed[i].gene_name, ed[i].uniprot, ed[i].uniprot, ed[i].species, ed[i].type,
					   ed[i].dna_refseq, ed[i].protein_refseq];
		}

		var table = $('#clickTable').DataTable( {
			data: tData,
			paging: false,
			columns: [
				
				{ 
					title: "Gene",
					"render": function(data, type, row, meta){
						if(type === 'display'){
							data = '<a href="https://www.genecards.org/cgi-bin/carddisp.pl?gene=' 
								+ data + '" target="genecards">' + data + '</a>';
						}
						return data;
					}
				},				{ 
					title: "GlyGen",
					"render": function(data, type, row, meta){
						if(type === 'display'){
							data = '<a href="https://glygen.org/protein_detail.html?uniprot_canonical_ac=' 
								+ data + '" target="glygen">' + data + '</a>';
						}
						return data;
					}
				},
				{ 
					title: "uniProt",
					"render": function(data, type, row, meta){
						if(type === 'display'){
							data = '<a href="https://www.uniprot.org/uniprot/' 
								+ data + '" target="uniprot">' + data + '</a>';
						}
						return data;
					}
				},
				{ 
					title: "Species",
					"render": function(data, type, row, meta){
						if(type === 'display'){
							data = '<a href="https://www.ncbi.nlm.nih.gov/taxonomy/?term=' 
								+ data + '" target="species">' + data + '</a>';
						}
						return data;
					}
				},
				{ title: "Type" },
				{ title: "DNA RefSeq" },
				{ title: "Protein RefSeq" }
			]
		} );
	} 

} // end of function clickNode()


function getResultTxt(accession, resID) {
	var url = "https://www.glygen.org/glycan_detail.html?glytoucan_ac=" + accession;
	var txt = "<p class='head1'>Exploring glycan <a href='" + url +
		"' target='glygen_frame'>" + accession + "</a>"; 

	if (resID == '0') {
		txt += ", which has " + data[accession].residues.length + " residues</p>";
	} else {
		txt += " residue " + resID + "</p>";
		// rd is 'residue data'
		var rd = data[accession].residues['_' + resID];	
		txt += rd.canonical_name + 
		" (GlycoCT index " + rd.glycoct_index +
		")<br> linked to residue " + rd.parent + " at site " + rd.site +
		"<p class='head1'> Enzymes involved in biosynthesis of this residue";
		txt += "<table id='clickTable' class='display' width='100%'></table></p>";
	}

	return(txt);
} // end of  function getResultTxt()


function highlight(accession, node, type) {
	// node is the particular element that was clicked
	
	// revert all drawn elements to their original colors
	var drawn = getDrawnElements("all");
	recolorElements(drawn, "revert");
	// remove css class "boxHighlight" from all drawn elements
	drawn.removeClass(["boxHighlight"]);

	// fade the contents of the svg canvas containing the clicked node
	drawn = getDrawnElements(accession);
	// if the svg canvas is clicked, do not fade its contents
	if (type != "C") recolorElements(drawn, "fade");

	// revert the clicked node to its original color(s)
	// inside <svg> - must retrieve children of clickable <g> element 
	//   (which has an id) as DOM object then convert to jquery object
	//     also remove any DOM class attributes from these children
	var drawnDOM = node.children; // DOM object
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
	var canvasH = 55;
	var canvasW = 25;
	var b = $('#' + ifr).contents().find('body');
	b.css('text-align', 'right');
	
	var s = b.find('svg');
	// USE VANILLA JAVASCRIPT TO GET/SET ATTRIBUTES of SVG elements!!
	for (var i = 0; i < s.length; i++) {
		var w = 1.0 * s[i].getAttribute('width');
		var h = 1.0 * s[i].getAttribute('height');
		var id = s[i].getAttribute('id').split('_')[0];
		if (v > 4) console.log("  svg[" + i + "] height: " + h + "; width: " + w );
		canvasH +=  40 + h;
		canvasW = Math.max(canvasW, w + 20);
		// The following lines show how to append text to svg canvas
		//   allows precise positioning !!!
		//    can be used to annotate residues with canonical IDs

		var element = document.createElementNS('http://www.w3.org/2000/svg', 'text');
		element. setAttributeNS(null, 'x', (w/2)-40);
		element. setAttributeNS(null, 'y', 0.96*h);
		// element. setAttributeNS(null, 'style', "font-size:18px; stroke: none;");
		element. setAttributeNS(null, 'class', 'svgText');
		var txt = document.createTextNode(id);
		element. appendChild(txt);
		s[i].appendChild(element);
	}
	
	var newLeft = canvasW + 45;

	// setup the iframe
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
} // end of function setupFrames()

	
	
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
	var fp = fadePercent;
	var bg = $('#' + ifr).css('background-color'); 
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
		// the following line may produce unwanted results: "none" has a meaning
		// if (!(fill.length > 0)) fill = "none";
		drawn[j].setAttribute("origFill", fill);
		stroke = drawn[j].style.stroke;
		// elements drawn with no specified stroke use black stroke
		if (stroke.localeCompare("") == 0) stroke = "black"; 
		drawn[j].setAttribute("origStroke", stroke);
		if (v > 4) {
			console.log("  " + j + ": <" + drawn[j].nodeName +
				"> fill: " + drawn[j].getAttribute('origFill') +
				";  stroke: " + drawn[j].getAttribute('origStroke'));
		}
	}
}



function addSVGevents() {
	// adds event listeners to svg objects and saves their original 'fill' and 'stroke' values
	if (v > 2) {
		console.log("##### Adding Event Listeners to SVG Elements #####");
	}

	var b = $('#' + ifr).contents().find('body');
	var g = b.find('g[id]');

	for (var i = 0; i < g.length; i++) {

		// USE VANILLA JAVASCRIPT for attributes
		var theID = g[i].getAttribute("id");

		// add event listeners for objects that have an id
		g[i].addEventListener("mouseout", exitNode);
		g[i].addEventListener("mouseover", enterNode);
		g[i].addEventListener("click", clickNode);

		// the following is for testing - may be useful later for mapping
		//   svg elements to json elements

		// from svg
		var idParts  = parseID(theID);
		var resIndex = idParts['resID'];  
		var accession = idParts['accession'];
		var type = idParts['type'];

		// from json 
		var glycan = data[accession];
		var residues = glycan.residues;
		// resIndex cannot be 0 (-> canvas) or contain "S" (-> unmapped node)
		if ( (resIndex != 0) && (!resIndex.includes("S") ) ) {
			// To avoid resKey conflicts, resKey always begins with "_"
			var resKey = "_" + resIndex;
			var res = residues[resKey]; 

			if (v > 4) {
				console.log("  svg <g> element[" + i + "] ->  type: " + type +
					";  accession: " + accession +
					";  resKey " + resKey);
				canon = res.canonical_name;
				console.log("       data 'data[" + accession + "].residues[" + resKey + "]':  name is '" + canon + "'");
			}
		}
	}
		
} // end of function addSVGevents()

function setResidueKeys() {
	// converts residues of each glycan from array[0,1,2,...] to associative array
	if (v > 1) console.log("#### Setting Up Associative Arrays for Residues ####");
	for (var key in data) {
		var glycan = "glycan[" + key + "]";
		var residues = data[key].residues;
		for (var j = 0; j < residues.length; j++ ) {
			//console.log("j is " + j);
			// FAILS WHEN resID == j - so need prefix "_"
			var key2 = "_" + residues[j].residue_id;
			residues[key2] = residues[j];
			if (v > 4) {
				console.log("   associative key generated for " + glycan + ".residues[" + j + "] -> '" +
							key2 + "'");
				console.log("   data['" + key + "'].residues['" + key2 + "'].canonical_name is " + 
							data[key].residues[key2].canonical_name);
			}
		}
	}
} // end of function setResidueKeys()


	
function showData() {
	// show json data
	// TODO: make txt depend on v
	var txt = "<pre>";
	for (var key in data) {
		var glycan = data[key];
		txt += "\nglycan: " + key + "";
		var residues = glycan.residues;
		for (var j = 0; j < residues.length; j++ ) {
			var res =residues[j];  // reused for all v > 1
			if (v > 1) {
				var resID = res.residue_id;
				var canon = res.canonical_name;
				txt += "\n  residue: " + resID + "; canonical_name: " + canon + ";";
				txt += " linked to  " + res.site + "' of " + res.parent;
			}
			if (v > 2) {
				//var anomer = res.anomer;
				txt += "\n    anomer: " + res.anomer;
				txt += "; absolute_configuration: " + res.absolute_configuration;
				txt += "; sugar_name: " + res.sugar_name;
				txt += "; ring_form: " + res.ring_form;
				txt += "; parent: " + res.parent;
				txt += "; linkage site: " + res.site;
				txt += ";";
			}
			if (v > 3) {
				var enzymes = res.enzymes;
				txt += "\n    enzymes:"
				for (var k = 0; k < enzymes.length; k++) {
					enz = enzymes[k];
					txt += "\n      gene_name: " + enz.gene_name;
					txt += "; species: " + enz.species;
					txt += "; type: " + enz.type;
					txt += "; uniprot: " + enz.uniprot;
					txt += "\n        orthology_group: " + enz.orthology_group;
					txt += "; gene_id: " + enz.gene_id;
					txt += "; dna_refseq: " + enz.dna_refseq;
					txt += "; protein_refseq: " + enz.protein_refseq;
				}
			}
		}
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
			// when done loading, get the next json file
			c++;
			getNextJSON(c);
		}
	};
	xhttp.open("GET", theURL, true);
	xhttp.send();
} // end of function getJSON()
	
function getNextJSON(c) {
	if (c < jsonPath.length) {
		if (v > 2) console.log("getting next json: " + jsonPath[c]);
		getJSON(jsonPath[c], c, acc[c]);
	} else {
		// after all are loaded, set up graphics and data
		setupFrames();  // calculate required <element> sizes and locations
		setResidueKeys();  // convert json 'residues' to associative array
		saveColors(); // saves original colors in svg <elements>
		addSVGevents();
		setupCSSiframe(ifr, iframeCSS);
		if (v > 2) console.log("##### Finished Setup #####");
	}
} // end of function getNextJSON()
	
	
	
function getSVG(theURL, c, accession, frameID) {
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			// USING VANILLA JAVASCRIPT (jquery fails inside <svg> without converting objects)
			//   try something like the following:
			//     var fd = $('#'+ frameID).removeClass(); // convert html object to jquery object
			//     fd.html(this.responseText);  // use jquery to populate iframe
			var fd = document.getElementById(frameID).contentWindow.document;
			fd.write(this.responseText + '<br><br><br>');
			// when done loading svg image, get the next one
			c++;
			getNextSVG(c);
		}
	};
	xhttp.open("GET", theURL, true);
	xhttp.send();
} // end of function getSVG()
	
	
		
function getNextSVG(c) {
	if (c < svgPath.length) {
		if (v > 2) console.log("getting next SVG: " + svgPath[c] );
		getSVG(svgPath[c], c, acc[c], ifr);
	} else {
		getNextJSON(0);
	}
} // end of function getNextSVG()
	


	
function initialize() {
	if (v > 2) console.log("##### Initializing #####");
	setupAnimation('logo_svg', 'header');
	var args = window.location.search.substring(1).split("&");
	// setup arrays with input parameters
	if (args) args.forEach(populateInput);	
	// fetch and process the images and data
	getNextSVG(0);
	$("#verbosity").val(v);
} // end of function initialize()


function changeV() {
	v = $("#verbosity").val();
	console.log("verbosity changed to " + v);
}
	
function changeB() {
	var bg = $("#bgColor").val();
	$("#"+ifr).css("background-color", bg);
	console.log("background changed to " + bg);
}