// constants
var nodeType = {'R':'residue', 'L':'link', 'LI':'text', 'C':'canvas'};
var greek = {'a': '&alpha;', 'b': '&beta;', 'x': '?'};
// data variables
var acc = [];
var svgPath = [];
var jsonPath = [];
var data = [];
var svgCanvasColor = "rgb(255,255,255)";
var annotated = false;

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
	
/*	
	// the following fails ???
	var s = $(this).parentsUntil("svg"); // returns an array!!!!
	console.log("entered element in " + s[0].getAttribute('id'));
	s[0].setAttributeNS(null, "transform", "scale(1.2)");
*/
	// complex way to get and modify containing svg
	// $(this).parentsUntil("svg") finds an object that cannot be properly accessed
	// apparently, svg object must be an element of an array to be modified ???

	var b = $('#' + ifr).contents().find('body');
	var s = b.find('svg');
	for (var i = 0; i < s.length; i++) {
		var c = $(s[i]).find(this);
		if (c.length == 1) { // this is a descendant of the <svg> object
			if (v > 4) console.log("mouse entered svg " + s[i].getAttribute('id'));
			s[i].setAttributeNS(null, "transform", "scale(1.2, 1.2)");
		}
	}
	

} // end of function enterNode() 
	
	
function exitNode() {
	$('#'+hDiv).html("<br>Move the mouse over a structure");
	var b = $('#' + ifr).contents().find('body');	
	var s = b.find('svg');
	for (var i = 0; i < s.length; i++) {
		s[i].setAttributeNS(null, "transform", "scale(1.0, 1.0)");
	}

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
	if ((resID != '0') && (resID.match(/S/) == null) ) { 
		// the canvas itself was not clicked
		//  and the residue is mappable to a glycoTree object
		var rd = data[accession].residues['#' + resID];
		// ed is enzyme data for residues[resID]
		var ed = rd.enzymes;
		setupResultsTable('clickTable', ed);
	}
} // end of function clickNode()


function setupResultsTable(tableName, tableData) {
	// make this a function with arguments tableName (clickTable) and tableData (ed)
	var table = $('#'+tableName).DataTable( {
		data: tableData,
		paging: false,
		columns: [
			{ 
				"title": "Gene",
				"data": "gene_name",
				"render": function(data, type, row, meta){
					if(type === 'display'){
						data = '<a href="https://www.genecards.org/cgi-bin/carddisp.pl?gene=' 
							+ data + '" target="genecards">' + data + '</a>';
					}
					return data;
				}
			},				{ 
				"title": "GlyGen",
				"data": "uniprot",
				"render": function(data, type, row, meta){
					if(type === 'display'){
						data = '<a href="https://www.glygen.org/protein/' 
							+ data + '" target="glygen">' + data + '</a>';
					}
					return data;
				}
			},
			{ 
				"title": "UniProt",
				"data": "uniprot",
				"render": function(data, type, row, meta){
					if(type === 'display'){
						data = '<a href="https://www.uniprot.org/uniprot/' 
							+ data + '" target="uniprot">' + data + '</a>';
					}
					return data;
				}
			},
			{ 
				"title": "Species",
				"data": "species",
				"render": function(data, type, row, meta){
					if(type === 'display'){
						data = '<a href="https://www.ncbi.nlm.nih.gov/taxonomy/?term=' 
							+ data + '" target="species">' + data + '</a>';
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
						data = '<a href="https://www.ncbi.nlm.nih.gov/gene/' 
							+ data + '" target="dna_refseq">' + data + '</a>';
					}
					return data;
				}
			},
		]
	} );

	$('a.toggle-vis').on( 'click', function (e) {
		e.preventDefault();

		// Get the column API object
		var column = table.column( $(this).attr('data-column') );

		// Toggle the visibility
		column.visible( ! column.visible() );
	} );	
}


function getResultTxt(accession, resID) {
	var url = "https://www.glygen.org/glycan/" + accession;
	var txt = "<p class='head1'>Exploring glycan <a href='" + url +
		"' target='glygen_frame'>" + accession + "</a>"; 

	if (resID == '0') {
		txt += ", which has " + data[accession].residues.length + " residues</p>";
	} else {
		// rd is 'residue data'
		if (resID.match(/S/) == null) {
			var rd = data[accession].residues['#' + resID];	
			if (rd.canonical_name == "unassigned") txt += " (unassigned)";
			txt += " residue " + resID + "</p>";
			
			// combine sugar name and ring form to give proper chemcial name
			var sName = rd.sugar_name;
			var nacLoc = sName.indexOf('NAc');
			var ngcLoc = sName.indexOf('NGc');
			var nLoc = Math.max(nacLoc, ngcLoc);
			var rf =  "<i>" + rd.ring_form + "</i>";
			var wholeName = sName + rf;
			if (nLoc > -1) {
				wholeName = sName.substring(0, nLoc) + rf + sName.substring(nLoc);
			} else {
				
			}
			var anom = greek[rd.anomer]; // lookup greek letter
			txt += "<b>" + anom + "-" + rd.absolute_configuration + "-" + wholeName + "</b>";
			txt += " linked to residue " + rd.parent + " at site " + rd.site;
			txt += "<br> <a href='gctMessage.html' target='message'>GlycoCT</a> index " + rd.glycoct_index;
			txt += "<br> <a href='https://pubchem.ncbi.nlm.nih.gov/compound/" + rd.pubchem_id +
				"' target='pubchem'> PubChem compound: " + rd.pubchem_id + "</a>";
			txt += "<br><table id='clickTable' class='display' width='100%'></table>";

			txt += "<br><b>Show/Hide: </b>" +
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
} // end of  function getResultTxt()


function highlight(accession, clickedNode, type) {
	// clickedNode is the <g> element whose child was clicked
	
	// revert all drawn elements to their original colors
	var drawn = getDrawnElements("all");
	recolorElements(drawn, "revert");
	// remove css class "boxHighlight" from all drawn elements
	drawn.removeClass(["boxHighlight"]);

	// highlight the svg canvas holding the clicked node
	// the clickedNode is (actually) <g> whose parent is <g>, whose child[0] is <g>, whose child[0] is <rect> (canvas)
	var cn = $(clickedNode).parent().children()[0].children[0];
	var cnn = $(cn); // convert to jquery object
	cn.style = "";
	cnn.addClass("boxHighlight");
	var thefill = $(cnn).css('fill');
	svgCanvasColor = thefill; // global scope - used by recolorElements
	
	// fade the contents of the svg canvas containing the clicked clickedNode
	drawn = getDrawnElements(accession);
	// if the svg canvas is clicked, do not fade its contents
	if (type != "C") recolorElements(drawn, "fade");
	// reset cnn.style (overwritten by last line)
	cn.style = "";

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
	var canvasH = 55;
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
		// The following lines show how to append text to svg canvas
		//   allows precise positioning !!!
		//    can be used to annotate residues with canonical IDs

		// this annotation has no ID - it cannot be clicked and it is not toggled
		var element = formTextElement((w/2)-40, 0.96*h, 'svgText', "", accession);
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
	var element = document.createElementNS('http://www.w3.org/2000/svg', 'text');
	element. setAttributeNS(null, 'x', x);
	element. setAttributeNS(null, 'y', y);
	element. setAttributeNS(null, 'class', c);
	if (id != "") {
		element. setAttributeNS(null, 'id', id);
	}
	var txt = document.createTextNode(t);
	element. appendChild(txt);
	return(element);
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
			// To avoid resKey conflicts, resKey always begins with "#"
			var resKey = "#" + resIndex;
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
			if (v > 4) {
				console.log("   object key generated for " + glycan + ".residues[" + j + "] -> '" +
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
			fd.write("<br><br><br>" + this.responseText);
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