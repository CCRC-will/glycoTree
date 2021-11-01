/********************* json2svg_v1.3.js ********************************
* Generates a String containing the svg encoding of a glycan           *
*   using the glycotree json representation of the glycan              *
*   along with the json representation of the drawing configuration.   *
* The configuration file conforms to a standard such as SNFG, where,   *
*   for example, a GlcNAc node is represented as a blue square.        *
* This code should be embedded in an HTML page that does the following:     *
*   - loads this script from a file                                    *
*   - reads the json data for a structure from a file                  *
*   - parses json data to generate a tree object in json2svg format    *
*   - reads a configuration file (parsed herein) to guide drawing      *
*   - invokes the layout method (herein) to generate svgString         *
*   - puts svgString into a div for visualization                      *
************************************************************************/

// TODO: do not draw edges for substituents
// global variables
var leaves = new Array();
var rootNode = null;

var fontSize = 14;
var spacer = 2; // grid coordinates
var margin = 1; // grid coordinates
var xScale = 50; // canvas coordinates
var yScale = xScale / 2; // canvas coordinates
var nodeRadius = 11; // canvas coordinates
var labelOffset = 8; // canvas coordinates
var labelFraction  = 0.36; 
var canvasHeight = 900; // (tentative) canvas coordinates
var canvasWidth = 900; // (tentative) canvas coordinates
var defaultCanvasColor = "#FFFFFF";
var highlightColor = "#EAEFF3";

const svgHead = "<?xml version='1.0'?>\
<!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.0//EN' 'http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd'>\n\
<svg xmlns:xlink='http://www.w3.org/1999/xlink'  xmlns='http://www.w3.org/2000/svg' style='stroke:black; fill:black; stroke-width:1; font-style:normal; stroke-linejoin:miter; font-size:12px;'";


const svgTail = "\n</svg>";


var accession = null;
var nodes = null;
var rangeTable = null;
var distTable = null;
var roots = new Array();; // an array of arrays
var rootKey = null;
var rootIndex = null;
var rootNode = null;
var conf = null; // object describing shapes, etc for sugars
var innerSpace = new Array();
var outerSpace = new Array();

function drawSVG() {
	// reset canvas dimensions
	
	canvasHeight = yScale * 
		(4 * margin + Math.max(outerSpace['height'], innerSpace['height']));
	
	// em is extra margin between inner and outer spaces
	var em = (outerSpace['exists'] == true) ? margin : 0;
	canvasWidth = xScale * 
		(2 * margin + em + innerSpace['width'] + outerSpace['width']);
	
	if (v > 1) {
		console.log("### Generating SVG string ###");
		console.log("  Canvas dimensions: " + canvasWidth +
						", " + canvasHeight);
	}
	// if (v > 4) console.log(confJSON.toString());
	
	var svgStr = svgHead;
	svgStr += " viewBox='0 0 " + canvasWidth + " " + canvasHeight + "' ";
	svgStr += " height='" + canvasHeight + "' ";
	svgStr += " width='" + canvasWidth + "' ";
	svgStr += " id='svg-" + accession + "' >";

	svgStr += drawCanvas();
	// since edges are drawn first, edge masking is optional
	// svgStr += drawAllEdges("mask"); // draw masks for all edges
	svgStr += drawAllEdges("visible"); // draw the edges
	svgStr += drawAllNodes("mask"); // draw masks for all nodes
	svgStr += drawAllNodes("visible"); // draw the nodes
	if (outerSpace['exists']) svgStr += drawBracket();
	svgStr += svgTail;
	if (v > 3) console.log(svgStr);
	return(svgStr);
} // end of function drawSVG()

function getCoords(node) {
	var coords = new Array();
	coords.x = xScale * node.x;
	coords.y = yScale * node.y;

	if (v > 5) {
		console.log("  grid coords for node " + node.node_id +
					  ": [" + node.x + "," + node.y + "]");
		console.log("  canvas coords for node " + node.node_id + 
					  ": [" + coords.x + "," + coords.y + "]");
	}
	return coords;	
} // end of function getCoords()


function drawCanvas() {
	if (v > 5) console.log("## Drawing canvas for " + accession + " ##");
	var classStr = accession + "_mask";
	var idStr = "C-" + accession + ":0";
	var canvasStr = "\n<g class='" + classStr + "' >";
	canvasStr += "\n  <g id='" + idStr +
		"' style='fill:" + defaultCanvasColor +
		"; stroke:none;'> " +
		"\n    <rect x='0' y='0' width='" + canvasWidth +
		"' height='" + canvasHeight +
		"' />"
	canvasStr += "\n  </g>\n</g>";
		
	return(canvasStr);
} // end of function drawCanvas()


function drawBracket() {
	var classStr = accession + "_bracket";
	var bracketStr = "\n<g  class='" + classStr + "'>";
	var horizPos = xScale * (outerSpace['width'] + margin * 1.5);
	// TODO: calculate y-coordinates of endpoints

	var top = yScale * margin;
	var bottom = top + 
		 yScale * (2 * margin + roots[rootKey]['yMax'] -
					  roots[rootKey]['yMin']);

	var width = 6;
	bracketStr += "\n  <polyline  points='" + (horizPos + width) +
		" " + top + " " + horizPos + " " + top + " " + horizPos +
		" " + bottom + " " + (horizPos + width) + " " + bottom +
		" ' style='fill: none; stroke:black;' />"
	bracketStr += "\n</g>";
		
	return(bracketStr);
} // end of function drawBracket()

	
	
	
function drawAllEdges(type) {
	if (v > 1) {
		console.log("## Drawing all edges of TYPE '" +
					  type + "' ##");
	}
	var classStr = accession + "_edge";
	var stroke = "black";
	if (type == 'mask') {
		classStr = accession + "_mask";
		stroke = defaultCanvasColor;
	}
	var AllEdgeStr = "\n<g class='" + classStr + "' >";
	
	for (i in nodes) {
		var node = nodes[i];
		if (v > 3){
			console.log("## Attempting to draw edge from node[" + i +
				"] " + node.node_id + " ##");
		}
		// idStr may be an empty string (for mask elements)
		var idStr = (type == 'mask') ? "" :
			" id='L-" + accession + ":" + node.node_id +  "' ";
		var pNode = getParentNode(node);
		var c1 = getCoords(node);
		var c2 = new Array();
		
		var OKtoDraw  = true;
		// substituents are nodes to which no edges are drawn 
		if (node.anomer == "n") OKtoDraw = false;
		if (pNode === null) {
			if ((node['anomer'] == "") || (node['site'] == "") ||
				 (node.anomer == "o") || (node.ring == "ol")) {
				// no information regarding the 'implied' edge is available
				//  or no edge can be implied
				OKtoDraw  = false;
			} else {
				// some information regarding the 'implied' edge is available
				c2['x'] = c1['x'] + xScale * 1;
				c2['y'] = c1['y'];			}
		} else {
			c2 = getCoords(pNode);
		}
		if (OKtoDraw) {
			AllEdgeStr += "\n  <g  " + idStr +
				 " fill='none' stroke='" + stroke + "' >";
			AllEdgeStr += drawEdge(c1.x, c1.y, c2.x, c2.y);
			AllEdgeStr += "\n  </g>";
			// draw edge labels ... first change idStr
			idStr = (type == 'mask') ? "" :
				" id='LI-" + accession + ":" + node.node_id + "' ";
			// NOTE: for text, use stroke value for fill
			AllEdgeStr += "\n  <g  " + idStr +
				 " stroke='none' fill='" + stroke + "' >";
			AllEdgeStr += drawEdgeLabel(c1.x, c1.y, c2.x, c2.y, node);
			AllEdgeStr += "\n  </g>";
		}
	}
	AllEdgeStr += "\n</g>";
		
	return(AllEdgeStr);
} // end of function drawAllEdges()


function drawEdge(x1, y1, x2, y2, stroke) {
	var edgeStr = "\n    <polygon  points=' " + x1 + " " + y1 +
		 " " + x2 + " " + y2 + " ' />";
	return(edgeStr);
} // end of function drawEdge()


function drawEdgeLabel(x1, y1, x2, y2, node) {
	var labelStr = "";
	var anomer = "";
	// map anomer string to ascii character
	switch(node.anomer) {
		case "a":
			anomer = "&#x03B1;"
			break;
		case "b":
			anomer = "&#x03B2;"
			break;
		case "x":
			anomer = "?"
			break;
		default:
			break;
	}
	
	var site = "";
	switch(node.site) {
		case "x":
			site = "?";
			break;
		case "0":
			site = "";
			break;
		default:
			site = node.site;
			break;
	}

	var theta = -Math.atan2(y2 - y1, x2 - x1);
	var start = {x:x1, y:y1};
	var end = {x:x2, y:y2};
	// console.log("    initial points:\n      start = [" +
	//	start['x'].toFixed(1) + ", " +
	//	start['y'].toFixed(1) + "]\n      end = [" +
	//	end['x'].toFixed(1) + ", " + end['y'].toFixed(1) + "]");
	
	var dd = Math.sqrt(Math.pow((start['x'] - end['x']), 2) +
							 Math.pow((start['y'] - end['y']), 2) );
	// console.log("distance: " + dd.toFixed(2));
	// rotate so 'imaginary' edge is horizontal
	start = rotateIt(start, theta);
	end = rotateIt(end, theta);
	dd = Math.sqrt(Math.pow((start['x'] - end['x']), 2) +
							 Math.pow((start['y'] - end['y']), 2) );
	// console.log("rotated distance : " + dd.toFixed(2));
	
	if (v > 5) {
		var t = 180 * theta / Math.PI;
		console.log("    theta is " + t.toFixed(1) + " degrees");
		console.log("    rotated points:\n      start = [" +
			start['x'].toFixed(1) + ", " +
			start['y'].toFixed(1) + "]\n      end = [" +
			end['x'].toFixed(1) + ", " + end['y'].toFixed(1) + "]");
	}
	
	// calculate position of labels for 'imaginary' horizonal edge
	var label1 = new Array();
	// labelFraction is a fraction of the start to end distance 
	//   at which the labels will be placed
	label1['x'] = start['x'] + labelFraction * (end['x'] - start['x']);
	label1['y'] = start['y'] + labelOffset;
	var label2 = new Array();
	label2['x'] = end['x'] - labelFraction * (end['x'] - start['x']);
	label2['y'] = end['y'] + labelOffset;
	var ddl = Math.sqrt(Math.pow((label1['x'] - label2['x']), 2) +
							 Math.pow((label1['y'] - label2['y']), 2) );
	// console.log(" label distance: " + ddl.toFixed(2));
	// rotate labels back to original orientation
	label1 = rotateIt(label1, -theta);
	label2 = rotateIt(label2, -theta);
	var ddl = Math.sqrt(Math.pow((label1['x'] - label2['x']), 2) +
							 Math.pow((label1['y'] - label2['y']), 2) );
	// console.log(" rotated label distance: " + ddl.toFixed(2));
	if (v > 5) console.log("    label points:\n      start = [" +
					label1['x'].toFixed(1) + ", " +
					label1['y'].toFixed(1) + "]\n      end = [" +
					label2['x'].toFixed(1) + ", " +
					label2['y'].toFixed(1) + "]");
	
	labelStr += "\n    <text text-anchor='middle' " +
		"dominant-baseline='middle' x='" + 
		label1['x'].toFixed(2) + "' y='" +
		label1['y'].toFixed(2) + "' >" + anomer + "</text>";
	labelStr += "\n    <text text-anchor='middle' " +
		"dominant-baseline='middle' x='" +
		label2['x'].toFixed(2) + "' y='" +
		label2['y'].toFixed(2) + "' >" + site + "</text>";

	return(labelStr);
} // end of drawEdgeLabel()



function rotateIt(coords, theta) {
	// coords is a 'coordinate' object with elements indexed using 'x' and 'y'
	rotated = new Array();
	rotated['x'] = coords['x'] * Math.cos(theta) -
		coords['y'] * Math.sin(theta);
	rotated['y'] = coords['x'] * Math.sin(theta) +
		coords['y'] * Math.cos(theta);
	return(rotated);
}


function getNodeConfig(name) {
	if (v > 8) console.log("  Looking for sugar with name " + name);
	var sugars = conf.sugars;
	for (i in sugars) {
		if (v > 8) console.log("  Probing sugars[" + i + "]: " +
						  sugars[i].name);
		if (sugars[i].name == name) {
			return(sugars[i]);
		}
	 }
	if (v > 1) console.log("  Failed to find sugar with name " + name);
	return(null);
}


function drawAllNodes(type) {
	if (v > 1) console.log("### Drawing all nodes of TYPE '" +
				  type + "' ###");
	var classStr = (type == 'mask') ? accession + "_mask": accession + "_node";
	var AllNodeStr = "\n<g class='" + classStr + "'>";
	for (i in nodes) {
		var node = nodes[i];
		var nodeID = node.node_id;
		var site = node.site;
		var c = getCoords(node);
		var nodeConfig = getNodeConfig(node.name);
		if (v > 4) {
			var msgTop = "    Retrieved "
			if (nodeConfig == null) {
				msgTop = "    Could not retrieve  "
			}
			console.log(msgTop + "sugar configuration for " +
				node.node_id + " (" + node.name + ")");
		}
		var fill = nodeConfig.color;
		var stroke = "black";
		// idStr may be an empty string (for mask elements)
		var idStr = (type == 'mask') ? "" :
			" id='R-" + accession + ":" + nodeID +  "' ";
		var gStr = "\n  <g" + idStr + " fill='" +
			fill + "' stroke='" + stroke +  "' >";

		if (type == 'mask') {
			fill = defaultCanvasColor;
			stroke = defaultCanvasColor;
			gStr = "\n  <g stroke='" + stroke +  "' fill='" + fill + "' >";
		}
		
		// put enclosing <g> outside of node
		AllNodeStr += gStr;

		var nodeShape = nodeConfig.shape;
		var nodeText = nodeConfig.text;
		// drawNode places image CENTER at c.x, c.y
		var bothColors = true;
		if (type === 'mask') bothColors = false;
		AllNodeStr += drawNode(c.x, c.y, nodeShape, site, node, nodeText, bothColors);
		
		var stdAbsolute = nodeConfig['stdAbsolute'];
		var absolute = node['absolute'];
		if (absolute != stdAbsolute) {
			AllNodeStr += annotateNode(c.x, c.y, absolute);
		}

		var ring = node['ring'];
		var stdRing = nodeConfig['stdRing'];
		if (ring != stdRing) {
			AllNodeStr += annotateNode(c.x, c.y, ring.charAt(0));
		}


		AllNodeStr += "\n  </g>";

		// include any substituents of each node
		var subName = node.substituent; // a string
		if (subName != "") {
			idStr = (type == 'mask') ? "" :
				" id='S-" + accession + ":" + nodeID +  "' ";
			gStr = "\n  <g" + idStr + " stroke='none' fill='black' >";
			var subY = c.y - yScale * node.sub_relative_y;
			var baseline = (node.sub_relative_y < 0) ? "text-top":
						"hanging";
			if (type == 'mask') {
				// no idStr in <g>
				gStr = "\n  <g stroke='none' fill='" + fill + "' >";
			}
			AllNodeStr += gStr;
			AllNodeStr += drawSubstituent(c.x, subY, subName, baseline);
			AllNodeStr += "\n  </g>";
		}
	}
	AllNodeStr += "\n</g>";
		
	return(AllNodeStr);
} // end of function drawAllNodes()


function drawSubstituent(x, y, name, baseline) {
	console.log(" draw substituent: x=" + x + " y=" + y + " text=" + name);

	var subStr = "\n    <text  " + "x='" + x + "' y='" + y +
		 "' text-anchor='middle' dominant-baseline='" +
		 baseline + "' font-size='" + fontSize + "' >" +
		 name + "</text>";
	return(subStr);
}


function annotateNode(x, y, annotation) {
	if (v > 3) console.log("   found non-standard annotation: " +
								 annotation);
	
	var annotationStr = "\n    <text  " + "x='" + x + "' y='" + y +
		 "' text-anchor='middle' dominant-baseline='middle' font-size='" + (fontSize - 2) + "' >" +
		 annotation + "</text>";
	return(annotationStr);
} // end of function annotateNode()




function drawNode(x, y, shape, site, node, text, bothColors) {
	//  simply draws the node 
	//   the node's colors and id are specified in enclosing <g>
	//     nodeRadius is a global drawing variable
	var nodeStr = "";
	switch(shape) {
	 case "circle":
		nodeStr = "\n    <circle r='" +
			nodeRadius + "' cx='" + x +
			"' cy='" + y + "'  />"; 
		break;
			
	 case "square":
		nodeStr = "\n    <rect x='" + (x-nodeRadius) +
			"' y='" + (y-nodeRadius) + "' width='" +
			(2*nodeRadius) + "' height='" + (2*nodeRadius) +
			"' />";
		break;
			
	  case "triangle":
		  // up or down, depending on linkage
		  x1 = x - nodeRadius;
		  y1 = y + nodeRadius;
		  x2 = x1 + (2 * nodeRadius);
		  y2 = y1;
		  x3 = x1 + nodeRadius;
		  y3 = y1 - (2 * nodeRadius);
		  if (site > 3) {
			 y1 = y - nodeRadius;
			 y2 = y1;
			 y3 = y1 + (2 * nodeRadius);
		  }
		  nodeStr = "\n    <polygon points='" + x1 + " "  + y1 + " "  +
			   x2 + " "  + y2 + " " + x3 + " " + y3 +
			  "' />";
		  break;
			
		case "splitdiamond":
			var x1 = x,
			y1 = y - nodeRadius;
			x2 = x1 + nodeRadius;
			y2 = y1 + nodeRadius;
			x3 = x1;
			y3 = y1 + (2 * nodeRadius);
			x4 = x1 - nodeRadius;
			y4 = y1 + nodeRadius;
			nodeStr = "\n    <polygon points='" + x1 + " "  + y1 +
				" "  + x2 + " "  + y2 + " "  + x3 + " " + 
				y3 + " " + x4 + " " + y4 + "' />";
			// mask for multi-colored residues is just one color, but node is both
			if (bothColors) 
				nodeStr += "\n    <polygon points='"  +
					x3 + " " + y3 + " " +
					x2 + " " + y2 + " " +
					x4 + " " + y4 + " " +
					"' stroke='black' fill='white'/>";
			break;
			
		case "diamond":
			var x1 = x,
			y1 = y - nodeRadius;
			x2 = x1 + nodeRadius;
			y2 = y1 + nodeRadius;
			x3 = x1;
			y3 = y1 + (2 * nodeRadius);
			x4 = x1 - nodeRadius;
			y4 = y1 + nodeRadius;
			nodeStr = "\n    <polygon points='" + x1 + " "  + y1 +
				" "  + x2 + " "  + y2 + " "  + x3 + " " + 
				y3 + " " + x4 + " " + y4 + "' />";
			break;
			
		case "star":
			// TODO: fix image of star
			var x1 = x,
			y1 = y - 1 * nodeRadius;
			x2 = x + 0.95 * nodeRadius;
			y2 = y - 0.31 * nodeRadius;
			x3 = x + 0.59 * nodeRadius;
			y3 = y + 0.81 * nodeRadius;
			x4 = x - 0.59 * nodeRadius;
			y4 = y + 0.81 * nodeRadius;
			x5 = x - 0.95 * nodeRadius;
			y5 = y - 0.31 * nodeRadius;
			nodeStr = "\n    <polygon points='" +
				x1 + "," + y1 + " " + x3 + "," + y3 + " " +
				x5 + "," + y5 + " " + x2 + "," + y2 + " " +
				x4 + "," + y4 + "' />";
			nodeStr += "\n    <polygon points='" +
				x1 + "," + y1 + " " + x3 + "," + y3 + " " +
				x5 + "," + y5 + " " + x2 + "," + y2 + " " +
				x4 + "," + y4 + "' stroke='none'/>";
			break;
			
		case "text":
			var subSite = (site == "x") ? "?" : site;
			var subText = subSite + text;
			console.log("      writing text for: " + node.name + 
						  "(" + subText + ")");
			var baseline = "text-top";
			if ((site > 3) || (site == "x")) baseline = "hanging";
			nodeStr = drawSubstituent(x, y, subText, baseline);
			break;
			
		default:
			console.log("shape (" + shape + ") not supported");
			nodeStr = "\n    <circle r='" +
				nodeRadius/2 + "' cx='" + x +
				"' cy='" + y + "' />";
			break;
	}
	return(nodeStr);
} // end of function drawNode()


// logTree is a debugging tool to test the format and content of any tree
//   that is passed to sjon2svg or processed for rendering
function logTree(tree) {
	var accession = tree["accession"];
	var nodes = tree.nodes;
	var treeStr = accession + " contains " + nodes.length + " nodes\n";
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		treeStr += "  Node[" + i + "]:\n";
		for (k in node) {
			treeStr += "\t" + k + ": " + node[k] + "\n";
		}
	}
	console.log(treeStr);
}	

function layout(tree) {
	console.log("### Generating SVG - verbacity is " + v + " ###");
	var svgStr = "This is the svg string returned from layout()!"

	nodes = tree.nodes;
	// reinitialize global variables for this structure
	rootIndex = null;
	rootKey = null;
	rootNode = null;
	leaves = new Array();  
	roots = new Array(); 
	innerSpace = new Array();
	innerSpace['width'] = 0;
	innerSpace['height'] = 0;
	outerSpace = new Array();
	outerSpace['width'] = 0;
	outerSpace['height'] = 0;
	outerSpace['exists'] = false;
	
	
	for (i in nodes) { // initialize root(s) of inner and outer trees
		var pID = nodes[i].parent_id;
		// assign root of main tree (in innerSpace)
		if (pID == 0) {
			// found primary root
			rootKey = nodes[i].node_id;
			rootIndex = i;
			rootNode = nodes[i];
			if (v > 2) console.log("@@ Found primary root " + rootKey + " (" +
				nodes[i].name + ") @@");
			roots[rootKey] = new Array();
			roots[rootKey]['type'] = 'root';
			roots[rootKey]['node'] = rootNode;
		}
		// assign 'pseudo-root' for each unattached tree (in outerSpace);
		if ( (pID == 'x') || (pID.includes('|') ) ) {
			outerSpace['exists'] = true;
			// found pseudo-root of subtree with unknown attachment point
			var pseudoRootNode = nodes[i];
			var pseudoRootKey = nodes[i].node_id;
			if (v > 2) console.log("@@ Found 'unattached pseudo-root' " +
							pseudoRootKey + " (" +
							nodes[i].name + ") @@");
			roots[pseudoRootKey] = new Array();
			roots[pseudoRootKey]['type'] = 'pseudo_root';
			roots[pseudoRootKey]['node'] = pseudoRootNode;
		}
	}
	
	// call recursive function setChildren() initially using 
	//   the root or pseudo-root node index 
	for (key in roots) setChildren(roots[key]['node']);
	
	if (v > 1) {
		console.log("@@ Root index is " + rootIndex + " @@");
		logTree(tree);
		console.log(Object.keys(leaves).length +
			" leaves were identified: " + leaves.toString());
		console.log("Traversing from leaves to the root - this modifies the tree");
	}
	
	for (i in leaves) {
		// all leaf nodes
		if (v > 3) console.log("!! processing leaf node " + leaves[i].node_id);
		traverseToBranch(leaves[i]);
	}
	
	if (v > 3) { 
		var rootsStr = "@@ All roots and pseudo-roots are set: @@\n";
		for (i in roots) rootsStr += "\n  " + i + ": " +
		showObject(roots[i]);
		console.log(rootsStr);
		console.log("  rootKey is " + rootKey);
	}
	
	
	// allot innerSpace (main tree) and outerSpace (unattached subtrees)
	allotSpace();
	
	// reposition origins of all roots (grid coordnates)
	repositionAllTrees();
	
	if (v > 1) logTree(tree);
	svgStr = drawSVG();
	return(svgStr);
} // end of function layout()



//  function accounts for other objects on canvas to place subtrees
function repositionAllTrees() {
	var lastYoffset = 0;  // this changes within the 'for' loop
	
	for (i in roots) {
		var root = roots[i];
		var node = root['node'];
		
		// xm is extra margin for xOffset when outerSpace exists
		var xm = (outerSpace['exists'] == true) ? margin: 0; 
		var xOffset = (root['type'] == "root") ?
			 outerSpace['width'] + xm + margin: margin; 
		
		var yOffset = (root['type'] == "root") ?
			 2 * margin : lastYoffset + 2 * margin;


		node.x = -root['xMin'] + xOffset;
		node.y = -root['yMin'] + yOffset;

		if (v > 5) console.log("$$$ reposition root node " + node.node_id +
				"\n   root xMin: " + root['xMin'] +
				"\n   root yMin: " + root['yMin'] +
				"\n   outerSpace['width']: " + outerSpace['width'] +
				"\n   margin: " + margin +
				"\n   xOffset: " + xOffset +
				"\n   yOffset: " + yOffset +
				"\n   x: " + node.x +
				"\n   y: " + node.y);
		
		if (root['type'] != "root") {
			lastYoffset += root['yMax'] - root['yMin'] + 2 * margin;
		}
		
		placeDescendants(node);
	}
} // end of function repositionAllTrees()



//  function allotSpace() loops through array 'roots'
//   checks if pseudo, allots space for main tree and unattached trees
function allotSpace() {
	// s accounts for vertical space BETWEEN subtrees
	var s = 0;
	for (i in roots) {
		var thisSpace = innerSpace;
		var h = 0;
		var w = 0;

		if (roots[i]['type'] != "root") {
			// outerSpace for unattached subtrees is modified
			thisSpace = outerSpace;
			//  set h and w to account for previously processed pseudo-roots
			// outerSpace height is additive
			h = outerSpace ['height'] + s;
			// outerSpace width is maximum
			w = outerSpace ['width'];
			// after  first unattached subtree, start adding spacer
			s  = spacer;
		}
		
		// outerSpace height is additive
		thisSpace['height'] = h + roots[i]['yMax'] - roots[i]['yMin'];
		
		// outerSpace width is maximum
		thisSpace['width'] = 
			Math.max(w, 1 + roots[i]['xMax'] - roots[i]['xMin']);
	}
	if (v > 5) {
		console.log("@@ innerSpace: @@\n" + showObject(innerSpace));
		console.log("@@ outerSpace: @@\n" + showObject(outerSpace));
	}
}  // end of function allotSpace()



function showObject(object) {
	var objectStr = "";
	for (key in object) {
		objectStr += "\n    " + key + ": " + object[key];
	}
	return(objectStr);
}


function getParentNode(node) {
	// node is an object, not an index
	var pID = node['parent_id'];
	// return another object - node_id is an externally meaningful id,
	//   it is not an array index
	for (k in nodes) {
		if (nodes[k]['node_id'] == pID) {
			// return a node, not an index
			return nodes[k];
		}
	}
	return null;
}



function traverseToBranch(node) {
	//  This is the core traversal method generating 'grid' coordinates
	//  Recursive function to traverse from a leaf (or 'pseudo-leaf') until 
	//    the first branched node is encountered
	//  set x-y coordinates of the direct children of the branched node, so that 
	//    the y-coordinate of each descendant of the branched node can be adjusted
	//  The branched node is then converted to a 'pseudo-leaf', initiating
	//    another traversal via recursion
	
	// node is an object, not an index
	node.touched = true;
	if (v > 3) {
		console.log("*****************************\ntraversing from " + node['node_id'] +
		  " with parent_id " + node['parent_id']);
	}
	
	var pNode = getParentNode(node);
	var pID = "";
	
	if (pNode == null) {
		// reached root node or 'pseudo-root' node (unconnected subtree)
		var rootKey = node.node_id;
		if (v > 4) console.log("### node " + rootKey +
			" has no parent node; placing its descendants ###");
		// put node at the origin
		node.x = 0;
		node.y = 0;
		placeDescendants(node);
		
		// setBoundaries is recursive - on primary call, pass argument 'true'
		if (v > 3) console.log("## Setting boundaries for tree rooted at " +
						rootKey + " ##");
		setBoundaries(node, node.node_id, true); 
		
		var bStr = "@@ Bounds for 'root' node " + rootKey + " @@";
		for (k in roots[rootKey]) 
			bStr += "\n" + k + " = " + roots[rootKey][k];
		if (v > 3) console.log(bStr);

	} else {
		pID = pNode.node_id;
		if (v > 3) console.log("traversing to parent node " + 
			  pID + ", whose child set has " + 
			  pNode['all_children'].length + " element(s)");
		// various classes of the parent node's children
		var pAC = pNode['all_children'];
		var pNXC = pNode['non_exceptional_children'];
		var pXC = pNode['exceptional_children'];
		
		// place Fuc node above or below its parent node
		//  initial relative x,y of fucose (child of pNode)
		if (node.name == "Fuc") {
			node['relative_x'] = 0;
			if (node.site > 3) {
				node['relative_y'] = -spacer;
			} else {
				node['relative_y'] = spacer;					
			}
			if (v > 5) console.log("Set relative coords for Fuc " +
					node.node_id + " (" + node['relative_x'] + ", " +
					node['relative_y'] + ")");
		}
		
		if (node.anomer == "n") {
			node['relative_x'] = 0;
			if ( (node.site > 3) || (node.site === "x") ) {
				node['relative_y'] = -spacer/2;
			} else {
				node['relative_y'] = spacer/2;					
			}
			if (v > 5) 
				console.log("Set relative coords for substituent " +
					node.name + " (" + node['relative_x'] + ", " +
					node['relative_y'] + ")");
		}
		
		// place substituent string for node
		if (node.substituent.length > 0) {
			node['subSite'] = node.substituent.substring(0,1);
			if (v > 5) console.log("Found substituent " + node.substituent +
				 " at position " + node['subSite'] + " of node " + node.node_id);
			var subOffset = spacer / 2;
			if (node['subSite'] < 4 ) {
				 subOffset = -subOffset;				
			}
			if (v > 5) console.log("     substituent offset is " + subOffset);
			node['sub_relative_y'] = subOffset;
		}
		
		
		if (pAC.length == 1) {
			// the parent of this node has only one child - that is, this node
			//   continue traversal by recursion
			if ((node.name != "Fuc") && (node.anomer != "n") ) {
				// relative coordinates of Fuc  and substituent nodes
				//    already set above
				node['relative_x'] = -1;
				// y of parent = y of this node
				node['relative_y'] = 0; 
			}
			if (v > 3)
				console.log("traversal recursion: unbranched node " +
										  pID);
			traverseToBranch(pNode);
		} else {
			// calculate grid coordinates of branched node iff all its  
			//  children have been assigned relative_x (satisfied == true)
			var satisfied = true; // initialize
			if (v > 3) console.log("checking children of " + pNode['node_id'] +
				  " for boolean 'touched'");
			for (k in pAC) {
				// indices k for all children (pAC) of the parent node (pNode)
				// if any child has no relative_x attribute,
				//  wait to assign grid coordinates or other children
				if (v > 3) console.log("   child node " +
						nodes[pAC[k]].node_id + ": touched is " +
						nodes[pAC[k]].touched);
				if (nodes[pAC[k]].touched == false) {
					// no 'relative_y' attribute for child node
					satisfied = false;
					if (v > 3) console.log(pNode['node_id'] + " has a child " +
					"that has NOT been touched, and will be processed later");
				}
			}
			if (satisfied) {
				if (v > 3) console.log("All children of " + pNode['node_id'] +
						" have been touched: assigning their coordinates and y-ranges"); 
							
				//  initial relative x,y  of fucose children already assigned
				//  assign initial relative x,y of non-fucose children of pNode
				var startY = (spacer / 2) * (pNXC.length - 1);
				for (var i = 0; i < pNXC.length; i++) {
					if (nodes[pNXC[i]]['anomer'] != "n") {
						//  initial relative x,y  of substituents already assigned 
						nodes[pNXC[i]]['relative_x'] = -1;
						nodes[pNXC[i]]['relative_y'] = startY - spacer * i;
						if (v > 5) console.log("@@  placed branch root " +
								nodes[pNXC[i]].node_id + " @@" +
								"\n    startY: " + startY +
								";   spacer: " + spacer +
								";   i: " + i +
								";   relative_y: " + nodes[pNXC[i]]['relative_y']);
					} else {
						if (v > 5) 
							console.log("@@  relative coordinates for " +
								nodes[pNXC[i]]['name'] + " already set");
					}	 
				}
				
				// put pNode at the origin
				pNode.x = 0;
				pNode.y = 0;
				
				var clashes = true;  // initially assume clashes exist
				var count = 0;
				var maxloop = 10;
				while ((count < maxloop) && (clashes == true) ) {
					if (v > 5) console.log("## executing loop " + count +
						  " for children of node " + pID + " ##");
					count++;
					//	assign coordinates (relative to pNode) of all descendants	
					placeDescendants(pNode);

					// instantiate and populate rangeTable;
					if (v > 3) 
						console.log("New rangeTable for children of " + pID);
					rangeTable = new Array();
					// c is an array of indices of children of pNode

					for (var i = 0; i < pNXC.length; i++) { // explicit order for i
						var child = nodes[pNXC[i]];
						var rangeArray = new Array();  // a new row in rangeTable;
						if (v > 3) 
							console.log("   New row in rangeTable for " +
								child.node_id + ", a child of " + pID);
						populateRangeArray(child, rangeArray);
						rangeTable.push(rangeArray);
					}
					if (v > 3) showRangeTable(pNode);
					setDistTable();
					if (v > 3) showDistTable(pNode);
					clashes = fixClashes(pNode);
				}

				traverseToBranch(pNode);
			}
		}
	}

}  // end of recursive function traverseToBranch()

function setBoundaries(node, key, isRoot) {
	// recursive function:
	//   sets boundaries of subtree rooted at 'node'
	//   key is node_id of root of subtree
	if (isRoot) {
		if (v > 1) 
			console.log(" ## Setting initial boundaries ##");
		// initialize max/min with improbably large values
		roots[key]['xMax'] = -1024;
		roots[key]['xMin'] = 1024;
		roots[key]['yMax'] = -1024;
		roots[key]['yMin'] = 1024;
	} // else {
		if (v > 3) console.log("   checking node " + node.node_id);		
	// }
	

	roots[key]['yMin'] = Math.min(roots[key]['yMin'], node.y);
	roots[key]['yMax'] = Math.max(roots[key]['yMax'], node.y);
	roots[key]['xMin'] = Math.min(roots[key]['xMin'], node.x);
	roots[key]['xMax'] = Math.max(roots[key]['xMax'], node.x);

	
	if (v > 3) {
		console.log("   grid coordinates: " + node.x + " " + node.y);
		console.log("   xMin: " + roots[key]['xMin']);
		console.log("   xMax: " + roots[key]['xMax']);
		console.log("   yMin: " + roots[key]['yMin']);
		console.log("   yMax: " + roots[key]['yMax']);
	}
	
	var children = node['all_children'];
	for (k in children) {
		var child = nodes[children[k]];
		// on recursion, pass argument 'false'
		setBoundaries(child, key, false);
	}
}



function fixClashes(pNode) {  
	// adjusts relative y values of root nodes of branches to avoid clashes
	var pID = pNode.node_id;
	var pNXC = pNode['non_exceptional_children']; // indices map to distTable indices
	var clashes = false;
	for (var i = 0; i < distTable.length; i++) {
		var distance = distTable[i];
		var nodeI = nodes[pNXC[i]];
		var idI = nodeI.node_id;
		for (var j = (i+1); j < distTable[i].length; j++) {
			var nodeJ = nodes[pNXC[j]];
			var idJ = nodeJ.node_id;
			if (v > 4) console.log("  ## checking " + idI +
				"[" + i + "] and " + idJ + "[" + j + "] for clash: " +
				" distance is " + distance[j] + "  ##");
			if (distance[j] < spacer) {
				clashes = true; // after changes are made, clashes may still exist
				if (v > 1) console.log("   found clash - distance is " +
											  distance[j]);
				var shiftI = spacer - distance[j];
				var shiftJ = 0;
				var opposite = (nodeI.y * nodeJ.y >= 0) ? false: true;
				if (opposite) {
					shiftI = shiftI / 2;
					shiftJ = -shiftI;
				}
				if (v > 5) console.log("     opposite is " + opposite +
						";  shiftI is " + shiftI + ";  shiftJ is " + shiftJ);

				// move nodeI
				moveNode(nodeI, shiftI);
				moveNode(nodeJ, shiftJ);
				if (v > 1) console.log("    Fixed clash rooted at nodes " +
						idI + " and " + idJ);
				return(clashes); // bail so clashes can be recalculated & fixed
			}
		}
	}
	
	if (v > 1) 
		console.log(" $$ No clashes found for descendants of node " +
					pID + " $$");
	return(false); // no clashes found
} // end of function fixClashes()


function moveNode(node, shift) {
	if (v > 4) console.log("      moving node " + node.node_id +
			" from " + node.relative_y + " to " +
					(node.relative_y + shift) );
	node.relative_y += shift;
} // end of function moveNode()



function setDistTable() {
	distTable = new Array();
	for (var i = 0; i < (rangeTable.length - 1); i++) { // first branch
		var row = new Array(); // a row in the distTable
		for (var j = (i+1); j < rangeTable.length; j++) { // second branch
			// xOverlap: alignment of x-coordinates of nodes in two branches 
			var xOverlap = Math.min(rangeTable[i].length, rangeTable[j].length);
			// to calculate dist, start with an improbably large positive value
			var dist = 1024 * spacer; // distance between first and second branch
			for (var k = 1; k < xOverlap; k++) { // x in branch (x >= 1)
				var d = rangeTable[i][k]['minY'] - rangeTable[j][k]['maxY'];
				if (v > 8) console.log("   distance at x=" + k + ":   " + d);
				dist = Math.min(d, dist);
			}
			if (v > 5) console.log("distance [" + i + ", " + j + "]: " + dist);
			row[j] = dist;
		}
		distTable[i] = row;
	}
} // end of function setDistTable()



function showDistTable(pNode) {
	var pID = pNode.node_id;
	var pNXC = pNode['non_exceptional_children'];
	if (pNXC.length > 1) {
		if (v > 3) console.log("\n$$$ Distance Table for descendants of " + pID + " $$$");
		for (var i in distTable) {
			var row = distTable[i];
			var nodeI = nodes[pNXC[i]].node_id;
			rowStr = "";
			var sep = "    ";
			for (var j in row) {
				var nodeJ = nodes[pNXC[j]].node_id;
				rowStr += sep + "(" + nodeI + "[" + i + "], " + nodeJ +
					"[" + j + "]): " + row[j]
				sep = ";    ";
			}
			if (v > 3) console.log(rowStr);
		}
	}
} // end of function showDistTable()



function showRangeTable(pNode) {
	var pID = pNode.node_id;
	var pNXC = pNode['non_exceptional_children'];
	if (v > 3) {
		console.log("rangeTable for " + pID + " describes " +
			rangeTable.length + " subtree(s):");
		console.log("root   x     min    max");
	}
	for (var i = 0; i < rangeTable.length; i++) {
		var rangeRow = rangeTable[i];
		var rowNodeID = nodes[pNXC[i]]['node_id'];
		var rowStr = "";
		for (j in rangeRow) {
			rowStr += rowNodeID + "     " + j + "    " + rangeRow[j]['minY'] +
				"      " + rangeRow[j]['maxY'] + "\n";
		}
		if (v > 3) console.log(rowStr);
	}
} // end of function showRangeTable()

// recursive function: 
//   affects node-set containing {node AND all of its descendants}
//    calculate  minY and Maxy at each x-coordinate
//  rangeArray is a row in rangeTable
//  x,y coordinates must be previously set (e.g., by placeDescendants() )
function populateRangeArray(node, rangeArray) {
	var x = -node['x']; // x must be a negative integer, so x is positive
	var y = node['y'];
	if (v > 4) console.log("     working on node " +
		  node.node_id + " at (" + x + "," + y +")");
	var i = x; // x <= 0, i is an index >= 0;
	if (typeof rangeArray[i] === 'undefined') {
		if (v > 4) console.log("      initiating row element[" + i + "]");
		rangeArray[i] = new Array();
		// start comparison with improbably large positive value  for minY
		rangeArray[i]['minY'] = Math.min(1024 * spacer, y); 
		// start comparison with improbably large negative value for maxY
		rangeArray[i]['maxY'] = Math.max(-1024 * spacer, y); 
	} else {
		if (v > 4) console.log("      re-assigning row element [" +
									  i + "]");
		rangeArray[i]['minY'] = Math.min(rangeArray[i]['minY'], y);
		rangeArray[i]['maxY'] = Math.max(rangeArray[i]['maxY'], y);
	}
	
	// report values BEFORE checking for substituents
	if (v > 4) console.log("         minY = " + rangeArray[i]['minY'] +
				  ";  maxY = " + rangeArray[i]['maxY'])
	
	if (typeof node.sub_relative_y !== 'undefined') {
		var subY = y - node.sub_relative_y;

		rangeArray[i]['minY'] = Math.min(rangeArray[i]['minY'], subY);
		rangeArray[i]['maxY'] = Math.max(rangeArray[i]['maxY'], subY);
		if (v > 4) {
			console.log("      found a sub_relative_y value for node " +
				node.node_id);
			console.log("      re-assigning row element [" + i + "]");
			// report values AFTER finding substituents
			console.log("             minY = " + rangeArray[i]['minY'] +
				  ";  maxY = " + rangeArray[i]['maxY']);
		}
	}
	
	var c = node.all_children // c is an array of indices
	for (var j in c) {
		var child = nodes[c[j]];
		populateRangeArray(child, rangeArray)
	}
} // end of function populateRangeArray()
	

// recursive function: 
//   for each descendant of node, assign x,y coordinates
//   does NOT set coordinates of node itself
//   RELATIVE x,y of each DESCENDANT must be previously set
//   x,y coordinates of this node must be previously set
function placeDescendants(node) {
	if (v > 3) console.log("  Placing descendants of node " +
								  node.node_id);
	if (typeof node.x === 'undefined') {
		if (v > 3) console.log("!!!! Cannot assign coordinates to descendants of node " + node.node_id + " !!!!");
	} else {
		var c = node.all_children // c is an array of indices
		if (c.length == 0) {
			if (v > 3) console.log("         node " + node.node_id +
										  " has no children");
		}
		for (i in c) {
			// i is an index, child is the corresponding node
			var child = nodes[c[i]];
			
			if (v > 5) console.log("    child node " + child.node_id +
				  " has relative x,y at (" + child['relative_x'] + "," + 
					child['relative_y'] + ")");
			
			if (typeof child['relative_x'] === 'undefined') {
				if (v > 5) console.log("    !!! child node " + child.node_id + 
								" cannot be placed !!!");
			} else {
				child.x = node.x + child['relative_x'];
				child.y = node.y + child['relative_y'];
				if (v > 3) console.log("    Placed child node " +
					child.node_id + " at (" + child.x + "," + child.y + ")");
				placeDescendants(child);
			}
		}
	}
} // end of function placeDescendants()



// recursive function
function setChildren(thisNode) {
	var nID = thisNode.node_id;
	if (v > 3) console.log("  # setChildren(" + nID + ") #");
	var children = new Array(); // all children
	var nxc = new Array(); // non-exceptional children
	var xc = new Array(); // exceptional children
	
	// depth-first traversal
	for (i in nodes) {
		// assign children of this node
		if (nodes[i].parent_id == nID) {
			var cID = nodes[i].node_id;
			if (v > 5) console.log("    node[" + cID +
					  "] is child of node " + nID);
			children.push(i);
			if ( (nodes[i].name === "Fuc") || (nodes[i].anomer === "n") ) {
				// fucose and substituents (with no anomeric configuration) are 'exceptional')
				if (v > 5) console.log("      " + cID + " is an exceptional child");
				xc.push(i);
			} else {
				if (v > 5) console.log("      " + cID + " is a non-exceptional child");
				nxc.push(i);
			}
			setChildren(nodes[i]);
		}
	}

	// presort the children arrays according to their node_id
	//  to produce a more consistent arrangement, even when node.site == 'x' 
	children.sort(function(a, b) {
		return (nodes[b].node_id - nodes[a].node_id);
	});
	nxc.sort(function(a, b) {
		return (nodes[b].node_id - nodes[a].node_id);
	});
	xc.sort(function(a, b) {
		return (nodes[b].node_id - nodes[a].node_id);
	});
	
	
	// sort the children arrays according to their attachment sites
	children.sort(function(a, b) {
		return (nodes[a].site.charAt(0) - nodes[b].site.charAt(0));
	});
	nxc.sort(function(a, b) {
		return (nodes[a].site.charAt(0) - nodes[b].site.charAt(0));
	});
	xc.sort(function(a, b) {
		return (nodes[a].site.charAt(0) - nodes[b].site.charAt(0));
	});
	
	if (v > 3) {
		console.log("     " + nID + " has " +
				children.length + " child(ren):");
		for (var j = 0; j < children.length; j++) 
			console.log("       " + nodes[children[j]].node_id +
					" at site " + nodes[children[j]].site);
		
		console.log("     " + nID + " has " +
				nxc.length + " non-exceptional child(ren):");
		for (var j = 0; j < nxc.length; j++) 
			console.log("       " + nodes[nxc[j]].node_id +
					" at site " + nodes[nxc[j]].site);
		
		console.log("     " + nID + " has " +
				xc.length + " exceptional child(ren):");
		for (var j = 0; j < xc.length; j++) 
			console.log("       " + nodes[xc[j]].node_id + " at site " +
				nodes[xc[j]].site);
	}
	
	if (children.length == 0) {
		// append node to leaves, which is an array of nodes
		leaves[nID] = thisNode;
		if (v > 3) console.log("  ##  Appended node " + nID +
						" to array 'leaves', which has  " +
						Object.keys(leaves).length + " elements ##");
	}
	
	// add child annotations to thisNode - 3 types
	//   these hold indices, not nodes
	thisNode['all_children'] = children;
	thisNode['non_exceptional_children'] = nxc;
	thisNode['exceptional_children'] = xc;
} // end of function setChildren()
