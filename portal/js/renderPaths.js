// global variables/functions - top few should be in html

var nodeCount = 0;
var statStr = "not";
var helpOn = false;
var pathArray = new Array();
var stepsInPath = 0;
var startGlycan = "";
var endGlycan = "";
function showStats() {
	$("#results").html(statStr);		
}

function showHelp() {
	if (helpOn) {
		$("#results").html(helpMessage);
	} else {
		$("#results").html("");				
	}
}

// tCount used for logo animation
var tCount = 0;

var images = [];

function conciseReaction(d) {
	var txt = "<center><h4>Click now to open a new page showing<br>biosynthetic details for the reaction you selected</h4>";
	txt += images[d.source] + "<br>" + d.source + "<br>";
	txt += "<span class='rxnArrow'>&darr;</span><br>";
	txt += images[d.target] + "<br>" + d.target + "<br></center>";
	$("#results").html(txt);
} // end function conciseReaction()

		
function showGlycan(d) {
	var rs = $("#results");
	var gStr = "<center>" + images[d.id];
	gStr += "<h1>" + d.id + "</h1>";
	gStr += "Number of paths to " + startGlycan + ": " + d.path_count + "</center>";
	
	rs.html(gStr);
} // end function showGlycan()


function	reactionHTMLtop(d, fromGlycan, toGlycan, multiple) {
	// console.log(d);
	// d is data for a reaction
	// initialize html that shows reaction(s) - add first reactant
	var arrow = " &rarr; ";
	if (multiple) arrow = arrow + arrow + arrow;
	var winName = fromGlycan + arrow + toGlycan;

	var tStr = "<!DOCTYPE html><htm><head><meta charset='utf-8'>";
	tStr += "<title>" + winName + "</title>";
	tStr += "<link rel='stylesheet' type='text/css' href='css/paths.css'></head><body>";
	tStr += "<center><h3>Reaction Details</h3>";

	tStr += "<table>";
	tStr += "<tr><td colspan='3'>" + images[d.source] + "<br>" + d.source + "</td></tr>";
	return tStr;
} // end function reactionHTMLtop()

function	reactionAppend(d) {
	// d is data for a reaction
	// add the arrow, enzymes, and product
	var anomer = d.residue_affected.anomer;
	var anomerStr = "";
	if (anomer === "a") {
		anomerStr = "&#945;"
	} else {
		anomerStr = "&#946;"
	}
	var absolute = d.residue_affected.absolute;
	var formName = d.residue_affected.form_name;
	var fullName = anomerStr + "-" + absolute + "-" + formName;
	var tStr = "<tr>";
	tStr += "	 <td width='35%'>Adds " + fullName + "</td>";
	tStr += "	 <td width='10%'>";
	tStr += "    <span class='rxnArrow'>&darr;</span><br>";
	tStr += "  </td>"
	tStr += "	 <td width='35%'>"; 
	tStr += "    <ul>";
	d.enzymes.forEach(function (enz) {
		var eStr = enz.gene_name + " (" + enz.species + " " + enz.uniprot + ")";
		tStr += "      <li><a href='https://www.glygen.org/protein/" + enz.uniprot +   "' target='_blank'>" + eStr + "</a></li>";
	});
	tStr += "    </ul>";
	tStr += "  </td>"
	tStr += "</tr>"
	tStr += "<tr><td colspan='3'>";
	tStr += images[d.target] + "<br>" + d.target;
	tStr += "</td></tr>"
	return tStr;
} // end function reactionAppend()



function reactionDetails(d) {
	// ### d is data for a REACTION ###
	// build html for visualizing reaction(s) and related data and links
	// initialize - add first reactant
	var txt = reactionHTMLtop(d, d.source, d.target);
	// add the arrow, enzymes and product
	txt += reactionAppend(d);
	txt += "</table></center>";
	txt += "</body>";
	var rxnWindow = window.open("", "");
	rxnWindow.document.write(txt);
	rxnWindow.focus();
} // end function reactionDetails()
	

function barGraph(dArray, c) {
	// dArray is an array of integers, c is the graph's class name
	// this function is general and can be used in diverse contexts
	
	// activate the class 'c' in the DOM so it can be accessed
	var dummy = "<div class='" + c + "' id='dummy'></div>";
	$(document.body).append(dummy);
	
	var svgStr = "<!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.0//EN' \ 'http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd'> \
<svg xmlns:xlink='http://www.w3.org/1999/xlink' \ xmlns='http://www.w3.org/2000/svg' class='" + c + "'>";
	svgStr += "\n  <g text-anchor='middle'>";
	var w = parseInt($(".bargraph1").css("width"));
	var h = parseInt($(".bargraph1").css("height"));
	var tMargin = parseInt($(".bargraph1").css("margin-top"));
	var bMargin = parseInt($(".bargraph1").css("margin-bottom"));
	var lMargin = parseInt($(".bargraph1").css("margin-left"));	
	var rMargin = parseInt($(".bargraph1").css("margin-right"));
	var barWidth = (w - lMargin - rMargin) / Object.keys(dArray).length;
	var textY = h - bMargin / 2;
	var maxCount = 1;
	var minDP = 10000;
	for (var i in dArray) {
		maxCount = Math.max(maxCount, dArray[i]);
		minDP = Math.min(minDP, i);
	}
	var barScaleY = (h - tMargin - bMargin) / maxCount;
	// for each element of data array, draw and label a bar
	for (var i in dArray) {
		// range of i does not necessarily start with 0 or 1
		var barHeight = barScaleY * dArray[i];
		var j = i - minDP;
		var barX = lMargin + barWidth * j;
		var barY = h - barHeight - tMargin;
		// draw the bar
		svgStr += "\n    <rect height='" + barHeight.toFixed(2) +
			"' width='" + barWidth.toFixed(2) +
			"' x='" + barX.toFixed(2) +
			"' y='" + barY.toFixed(2) + "'/>";
		// label the category (i in this case)
		var textX = barX + barWidth / 2;
		svgStr += "\n    <text x='" + textX.toFixed(2) +
			"' y='" + textY.toFixed(4) + "' stroke='none'>" +
			i + "</text>";
		// label the value
		var labelY = barY - 5;
		svgStr += "\n    <text x='" + textX.toFixed(2) +
			"' y='" + labelY.toFixed(2) + "' stroke='none'>" +
			dArray[i] + "</text>";
	}
	svgStr += "\n  </g>\n</svg>\n</center>";
	// no longer any need to activate class c
	$( "#dummy" ).remove();
	return svgStr;
} // end of function barGraph()


function initialize() { 
	setupAnimation('logo_svg', 'headerDiv');
	var arg = window.location.search.substring(1);
	var a = arg.split("&");
	startGlycan = a[1];
	endGlycan = a[0];
	var theURL = dataPath + "?start=" + startGlycan + "&end=" + endGlycan;
	var focalPoint = "none";

	var vSpacing = 20;	
	// as arcScale increases, horizontal size of arc dereases
	var arcScale = 10;
	var topMargin = 40;
	var leftMargin = 50;
	var width = 600;
	var height = 500;
	var check_x = 8;
	var label_x = 70;
	var logo_x = 130;
	var sand_x = 155;
	var sub_x = 195;
	var node_x = 300;

	// append the svg object to the body of the page
	var svg = d3.select("#pathgraph")
		.append("svg")
		.attr("width", width + leftMargin)
		.attr("height", height + 3 * topMargin)
		.append("g")
		.attr("transform", "translate(0," + topMargin + ")");
	
/******** USE D3 to process data from API ********/

 d3.json(theURL, function( data) {

	 // The following functions require access to D3 variables
	 function focusNode(d) {
		var txt = "";
		if (focalPoint === d.id) {
			focalPoint = "none";
			txt += "<center><b>Focus is not set<br>Click any accession to focus on it</b></center>";
		} else {
			focalPoint = d.id;
			nodeOver(d);
			txt += "<center><b>Focus is now on " + focalPoint + "<br>Click " + focalPoint + " again to clear the focus, or click another accession to focus on it</b></center>";
			txt += "<center>" + images[focalPoint] + "<br><h1>" + focalPoint + "</h1></center>";	
		}
		$("#results").html(txt);
		// console.log("Focal Point is " + focalPoint);
	} // end function focusNode()
	 
	function nodeOver(d) {
		showGlycan(d);
		// set all nodes inactive
		data.nodes.forEach(function (node_d) {
			node_d["active"] = false;
		})
		// Highlight the connections to/from the node
		if ((focalPoint == "none") || (focalPoint == d.id)) {
			// console.log("focal Point: " + d.id);
			data.links.forEach(function (link_d) {
				//console.log(" - Testing link " + link_d.source + " -> " + link_d.target);
				link_d["active"] = ((link_d.source === d.id) || (link_d.target === d.id)) ? true: false;
				if (link_d.active) {
					// console.log("## ACTIVE LINK ## " + link_d.source + " -> " + link_d.target);
					data.nodes.forEach(function (node_d) {
						// console.log(" - Testing node " + node_d.id);				
						// do not unset node active inappropriately
						node_d["active"] = ( (link_d.source === node_d.id) ||
						  (link_d.target === node_d.id) ||
							(node_d["active"]) ) ? true: false; 
						if (node_d.active) {
							// console.log("*** ACTIVE NODE *** " + node_d.id);
						} else {
							// console.log("*** INACTIVE NODE *** " + node_d.id);
						}
					});
				}
			});
			
			links
				.classed('arcHot', function (link_d) {
				  return link_d.source === d.id || link_d.target === d.id ? true : false;					
				})
				.classed('arcPale', function (link_d) {
				  return link_d.source !== d.id && link_d.target !== d.id ? true : false;					
				})

			labels
				.classed('labelLinked', function (label_d) {
				// data for labels = data for nodes
				  return label_d.active;
				})
				.classed('labelHot', function (label_d) {
					return label_d.id === d.id ? true : false;
				})
			dpLabels
				.classed('labelHot', function (label_d) {
					return label_d.id === d.id ? true : false;
				})
		}
	} // end function nodeOver()
		
	function linkOut(d) {
		// This shows a message when the mouse is not over any data
		showHelp();
		links
			.classed('arcVeryHot', false);
	} // end function linkOut()
	 
	function nodeOut(d) {
		showHelp();
		if (focalPoint == "none") {
			links
				.classed('arcHot', false)
				.classed('arcPale', false);
			labels
				.classed('labelHot', false);
			dpLabels
				.classed('labelHot', false);
		}
	}  // end function nodeOut()
	 
	/**** respond to html events ****/
	 
	function traverseUnique(node) {
		// console.log("### recursion: traversing path at " + node.id);
		// node having node.id must have isSelected = true
		data.links.every(function (d) {
			// console.log("** testing link " + d.source + " to " + d.target);
			var targetNode = id_to_node[d.target];
			if ( (d.source === node.id) && (targetNode.isSelected) ) {
				// console.log("  !!! success: " + d.source + " to " + d.target);
				pathArray[stepsInPath] = d;
				stepsInPath++;
				traverseUnique(targetNode);
				return false;
			}
			return true;
		})
	}

	 
	function pathwayDetails(d) {
		// ### d is data for the first REACTION ###
		// build html for visualizing a pathway and related data and links
		// initialize - add first reactant
		var pathStart = pathArray[0].source;
		var pathEnd = pathArray[stepsInPath - 1].target;
		var txt = reactionHTMLtop(d, pathStart, pathEnd, true);
		// add the arrow, enzymes and product
		for (var i = 0; i < stepsInPath; i++) {
			txt += reactionAppend(pathArray[i]);
		}
		txt += "</table></center>";
		txt += "</body>";
		// console.log("Generated Code:\n" + txt);
		var rxnWindow = window.open("", "");
		rxnWindow.document.write(txt);
		rxnWindow.focus();
	} // end function pathwayDetails()
	 
	d3.select("#pathButton").on("click", function() {
		pathArray = new Array();
		stepsInPath = 0;
		var firstNode = "";
		data.nodes.every(function (d) {
			if (d.isSelected) {
				firstNode = d;
				return false;
			}
			return true;
		})
		
		traverseUnique(firstNode);
		
		var pathStr = "<ul>";
		pathStr += "<li><i>You must select structures that are 'linked' to each other; the pathway is truncated at any selected structure that is not linked to the next selected structure.</i></li>";
		pathStr += "<li>Pathways start with first selected structure, so you must select all structures you want in the path.</li>";
		pathStr += "<li>Pathways are drawn on a new page.</li>";
		pathStr += "<li>In future vesions, '<i>smart pathway selection</i>' will be implemented to automatically select structures that best fit biochemical rules.  The user will be able to manually override these automatic selections using the checkboxes.";
		pathStr += "</ul><b>Currently selected reactions</b><ul>";
		
		for( var i = 0; i < stepsInPath; i++ ) {
			var from = pathArray[i].source;
			var to = pathArray[i].target;
  			pathStr += "<li>" + from + " &rarr; " + to + "</li>";
		}
		pathStr += "</ul>";
		
		$("#results").html("<center><b>Reactions involving selected structures <br>are combined to generate a unique pathway</b></center><br>" + pathStr);
		pathwayDetails(pathArray[0]);
	});
	 
	d3.select("#toggleHelp").on("click", function() {
		var hStr = "<center><h3>";
		helpOn = (helpOn) ? false: true;
		if (helpOn) {
			hStr += "Help is now on.";
		} else {
			hStr += "Help is now off.";
	   }
		hStr += "</h3></center>";
		hStr += helpMessage;
		$("#results").html(hStr);
	});
	 
	 
	/**** begin processing data ****/
	 
	var headerStr = "<span class='headPath'>" + a[1] + " &rarr; &rarr; &rarr; " + a[0] + "</span>";

	$("#headerDiv").append(headerStr); 
	$("#results").html(helpMessage)

	// map each node to its id so given link source or target, node can be retrieved
	var id_to_node = {};
	data.nodes.forEach(function (n) {
		id_to_node[n.id] = n;
	});

	// path_count value
	var pc = data.path_count;

	// add drawing variables and data to each node in data.nodes
	var cc;
	var sh;

	data.nodes.forEach(function( d, i ) {
		// fetch all the svg images
		$.get("svg/" + d.id + ".gTree.svg", function( response ) {
			var result = (new XMLSerializer()).serializeToString(response);
			images[d.id] = result;
		});
		d.isSelected = false;
		nodeCount++;
		d.cc = nodeShading[d.dp % 2]; // color of the node, depends on dp
		d.sh = rowShading[nodeCount % 2]; // shading of the node's 'strip'
		d.y = vSpacing * nodeCount; // vertical spacing of nodes
		d.url = "https://www.glygen.org/glycan/" + d.id;
	});
	
	// resize graph to fit data
	 var graphHeight = 3 * topMargin + nodeCount * vSpacing;
	 d3.select("#pathgraph").select("svg").attr("height", graphHeight);

	// add drawing parameters for arcs
	var edgeCount = 0;
	var maxSpan = 1; // the maximum vertical distance spanned by an arc
	data.links.forEach(function (d) {
		edgeCount++;
		var soy = id_to_node[d.source].y 
		var tay = id_to_node[d.target].y
		maxSpan = Math.max(maxSpan, Math.abs(tay - soy));
		// arcScale defines how 'wide' each arc is
		arcScale = Math.min(20, 1800 / maxSpan);
	});

	statStr = "<center><h3>Pathway Statistics<br>" +
		a[1] + " &rarr; &rarr; &rarr; " + a[0] + "</h3>";
	statStr += "<ul><li>Number of unique pathways: " + pc + "</li>";
	statStr += "<li>Number of structures: " +  nodeCount + "</li>";
	statStr += "<li>Number of reactions: " +  edgeCount + "</li></ul>";
	statStr += "<b>Size Distribution for Structures in the Pathways</b>"
	// barGraph takes an array of integers and a css class name
	statStr += barGraph(data.dp_distribution, "bargraph1");

	 
	$("#progressDiv").hide();
	 
	 
	 
	// draw alternate shading first (background)
	var shade = svg
		.selectAll()
		.data(data.nodes)
		.enter()
		.append("rect")
		.attr("x", 5)
		.attr("y", function(d){ return(d.y-10)})
		.attr("width", width+10)
		.attr("height", 20)
		.style("fill", function(d){ return(d.sh)})

	// draw links before nodes so links are in background
	//  for technical details about svg paths used here, see
	//   https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
	var links = svg
		.selectAll()
		.data(data.links)
		.enter()
		.append('path')
		.attr('d', function (d) {
			arcStart = id_to_node[d.source].y 
			arcEnd = id_to_node[d.target].y
			return [
				'M',
				// the x-coordinate for arcStart of each arc is static (node_x)
				node_x,
				// the arc starts (y-coordinate) at the starting node
				arcStart,    
				'A', 
				// nodes that are far apart are connected by 'tall' arcs
				//  arc size is controlled by arcScale
				// radius x (rx)
				arcScale * (arcStart - arcEnd),     
				// radius y (ry)
				(arcStart - arcEnd),
				// no x-axis-rotation
				0,
				// no large-arc-flag
				0,
				// sweep-flag
				//   value of 1 always makes arc clockwise from start to end
				//   if start is 'below' end, then arc will be on the left
				1, 
				// x- and y-coordinates of arc end
				node_x,
				arcEnd
			]
			.join(' ');
		})
		.classed('arcDefault', true)
		.on('mouseover', function (d) {
			// check whether the arc is 'greyed out'; if not, show reaction
			var cli = d3.select(this).attr("class").indexOf("arcPale");
			if (cli < 1) {
				conciseReaction(d);
				links
					.classed('arcVeryHot', function (link_d) {
					return link_d.source === d.source && link_d.target === d.target ? true : false;					
				})	
			}
		})
		.on('mouseout', function (d) {
			showHelp();
			linkOut(d);
		})
		.on("click", function(d) {
			reactionDetails(d);
		});

	// draw nodes
	var nodes = svg
		.selectAll()
		.data(data.nodes)
		.enter()
		.append("circle")
		.attr("cx", node_x)
		.attr("cy", function(d){ return(d.y)})
		.attr("r", 5)
		.classed('nodeDefault', true)
		// cannot use css for fill, as (d.cc) depends on the dp
		.style("fill", function(d){ return(d.cc)})
		.on("click", function(d) {
			focusNode(d);
		})
		
	// label dps	
	var dpLabels = svg
		.selectAll()
		.data(data.nodes)
		.enter()
		.append("text")
		.attr("x", width)
		.attr("y", function(d){ return(d.y+5)})
		.classed('dp', true)
		.style("stroke", function(d){ return(d.cc)})
		.text(function(d){ return(d.dp)})

	// label nodes	
	var labels = svg
		.selectAll()
		.data(data.nodes)
		.enter()
		.append("text")
		.attr("x", label_x)
		.attr("y", function(d){ return(d.y+5)})
		.classed('labelDefault', true)
		.text(function(d){ return(d.id)})
		.on('mouseover', function (d) {
			nodeOver(d);
		})
		.on('mouseout', function (d) {
			nodeOut(d);
		})
		.on("click", function(d) {
			focusNode(d);
		})	

	// d3.svg implementation of check boxes
	var checks = svg
		.selectAll()
		.data(data.nodes)
		.enter()
		.append('g')
		.on("click", function(d) {
			toggle = !d.isSelected;
			data.nodes.forEach(function (n) {	
				if (n.dp === d.dp) n.isSelected = false;
			})
			d.isSelected = toggle;
			d3.selectAll("path.checkI")
				.classed('checkV', function(box_d) {
					return (box_d.isSelected);	
				})
			d3.selectAll("path.checkV")
				.classed('checkI', function(box_d) {
					return (!box_d.isSelected);	
				})
		})
	// append a rectangle, visible (class checkV) to be clickable
	checks.append('rect')
		.attr("x", check_x)
		.attr("y", function(d){ return(d.y-6)})
		.attr("width", 12)
		.attr("height", 12)
		.classed("checkV", true)
		.style("stroke", function(d){ return(d.cc)})
	// append the "X" in the box, initially invisible (class checkI) => false
	checks.append('path')
		.attr('d', function (d) {
			check_y = d.y-6
			return [
				'M',check_x,check_y,'l',12,12,'m',0,-12,
				'l',-12,12
			]
			.join(' ')
		})
		.classed("checkI", true)
	 
	var sandboxes = svg
		.selectAll()
		.data(data.nodes)
		.enter()
		.append('g')
		.on("click", function(d) {
			sandtips.classed('tipsHidden', true);
			window.open(exploreURL + d.id); 
		})
		.on("mouseover", function(d) {
			 sandtips.classed('tipsHidden', function (tip_d) {
				 return tip_d.id === d.id ? false : true;
			 })
		})
		.on("mouseout", function(d) {
			 sandtips.classed('tipsHidden', true)
		})
	// separately append graphic elements to 'sandboxes'
	sandboxes.append('rect')
		.attr("x", sand_x)
		.attr("y", function(d){ return(d.y-9)})
		.attr("width", 20)
		.attr("height", 18)
		.style("fill", function(d){ return(d.sh)})
		.classed('linkbox', true)
	 
	sandboxes.append('path')
		.attr('d', function (d) {
			sand_y = d.y
			return [
				'M',sand_x,sand_y,'l',15.20,4.40,'l',4.00,-5.60,
				'm',-19.20,1.20,'l',4.40,-5.60,'l',14.80,4.40,
				'm',-4.00,8.40,'l',-15.20,-4.40
			]
			.join(' ')
		})
		.classed('logo', true)
	

		
	var logos = svg
		.selectAll()
		.data(data.nodes)
		.enter()
		.append("g")
		.on("click", function(d) {
			logotips.classed('tipsHidden', true);
			window.open(glygenURL + d.id);
		})
		.on("mouseover", function(d) {
			 logotips.classed('tipsHidden', function (tip_d) {
				 return tip_d.id === d.id ? false : true;
			 })
		})
		.on("mouseout", function(d) {
			 logotips.classed('tipsHidden', true)
		})
	
	logos.append('rect')
		.attr("x", logo_x - 7)
		.attr("y", function(d){ return(d.y-9)})
		.attr("width", 25)
		.attr("height", 18)
		.style("fill", function(d){ return(d.sh)})
		.classed('linkbox', true)

	logos.append('path')
		.attr('d', function (d) {
			logo_y = d.y - 4
			return [
				'M',logo_x,logo_y,'l',12.65,3.65,'l',4.2,-4.85,	
				'm',-24.5,10.35,'l',4,-4.65,'l',12.6,3.8,
				'm',1.85,-2.3,'l',-12.7,-3.7
			]
			.join(' ')
		})
		.classed('logo', true)	
		 

	 
	var subbrows = svg
		.selectAll()
		.data(data.nodes)
		.enter()
		.append("g")
		.on("click", function(d) {
			subtips.classed('tipsHidden', true);
			window.open(subURL + "=" + d.id);
		})
		.on("mouseover", function(d) {
			 subtips.classed('tipsHidden', function (tip_d) {
				 return tip_d.id === d.id ? false : true;
			 })
		})
		.on("mouseout", function(d) {
			 subtips.classed('tipsHidden', true)
		})
		
	 
	subbrows.append('rect')
		.attr("x", sub_x - 10)
		.attr("y", function(d){ return(d.y-9)})
		.attr("width", 20)
		.attr("height", 18)
		.style("fill", function(d){ return(d.sh)})
		.classed('linkbox', true)

	subbrows.append('path')
		.attr('d', function (d) {
			sub_y = d.y - 7.5
			return [
				'M',sub_x,sub_y,'a',1.8,1.8,1,1,0,0.001,0,
				'm',0,3.6,'l',0,2.7,
				'a',1.8,1.8,1,1,0,0.001,0,
				'm',1.35,2.700,'l',2.7,2.7,
				'm',1.8,0,'a',1.8,1.8,0,1,0,0.001,0,
				'm',-5.85,0,'a',1.8,1.8,0,1,0,0.001,0,
				'm',-5.85,0,'a',1.8,1.8,0,1,0,0.001,0,
				'm',0.45,1.35,'l',4.5,-4.5,
				'm',0.9,0.9,'l',0,1.8,
			]
			.join(' ')
		})
		.classed('logo', true)

	 	
	var logotips = svg
		.selectAll()
		.data(data.nodes)
		.enter()
		.append("g")
		.classed('tips', true)
		.classed('tipsHidden' , true)
	 
	logotips.append('rect')
		.attr("x", logo_x + 20)
		.attr("y", function(d){ return(d.y-16)})
		.attr("rx", 4)
		.attr("width", 190)
		.attr("height", 24)
		.classed("tipBox", true)
	
	logotips.append('text')
		.attr('x', logo_x + 26)
		.attr('y', function(d){ return(d.y)})
		.text(function(d){ return('View ' + d.id + ' in GlyGen')});
	 
	var sandtips = svg
		.selectAll()
		.data(data.nodes)
		.enter()
		.append("g")
		.classed('tips', true)
		.classed('tipsHidden' , true)
	 
	sandtips.append('rect')
		.attr("x", sand_x + 22)
		.attr("y", function(d){ return(d.y-16)})
		.attr("rx", 4)
		.attr("width", 200)
		.attr("height", 24)
		.classed("tipBox", true)
	
	sandtips.append('text')
		.attr('x', sand_x + 28)
		.attr('y', function(d){ return(d.y)})
		.text(function(d){ return('View ' + d.id + ' in Sandbox')});
	 
	var subtips = svg
		.selectAll()
		.data(data.nodes)
		.enter()
		.append("g")
		.classed('tips', true)
		.classed('tipsHidden' , true)
	 
	subtips.append('rect')
		.attr("x", sub_x + 14)
		.attr("y", function(d){ return(d.y-16)})
		.attr("rx", 4)
		.attr("width", 265)
		.attr("height", 24)
		.classed("tipBox", true)
	
	subtips.append('text')
		.attr('x', sub_x + 20)
		.attr('y', function(d){ return(d.y)})
		.text(function(d){ return('View ' + d.id + ' in GNOme Navigator')});
	 

	}) // end function d3.json
	
	// Headers
	svg
		.append("text")
		.attr("x", label_x)
		.attr("y", 0)
		.classed('tableHeader', true)
		.html("Accession")
	
	svg
		.append("text")
		.attr("x", width)
		.attr("y", 0)
		.classed('tableHeader', true)
		.html("DP")
	
} // end function initialize()