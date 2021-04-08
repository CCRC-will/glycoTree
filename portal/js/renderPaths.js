function initialize() { 
	
	// should put this variable in the html file ...
	var dataPath = "api/paths/getpathD3v4.php";
	var arg = window.location.search.substring(1);
	var a = arg.split("&");
	var theURL = dataPath + "?start=" + a[1] + "&end=" +a[0];
	var globalData;
	var focalPoint = "none";

	var images = [];

	var vSpacing = 20;
	
	var shading = ['#FFFFFF', '#EAF0FA'];
	var mouse_hl = '#25c';
	
	var helpMessage = "<p>Mouse Over or Click on a Graphical Element</p><ul>" +
		 "<li>See a structure: mouse over its accession</li>" +
		 "<li>See a reaction: mouse over an arc</li>" +
		 "<li>Focus on a structure: click its accession</li>" +
		 "<li>Unset focus: click the accession that is in focus</li>" +
		 "<li>See reaction details: click an arc</li>" +
		 "<li>Get more information about a structure: click an icon</li>" +
		 "<ul>";
	 
	var subURL = "https://gnome.glyomics.org/restrictions/GlyGen.StructureBrowser.html?focus";
	// as arcScale increases, horizontal size of arc dereases
	var arcScale = 10;
	var margin = {top: 20, right: 20, bottom: 20, left: 20};
	var width = 600 - margin.left - margin.right;
	var height = 3000 - margin.top - margin.bottom;
	var check_x = 8;
	var label_x = 70;
	var logo_x = 130;
	var sand_x = 155;
	var sub_x = 195;
	var node_x = 300;

	// append the svg object to the body of the page
	var svg = d3.select("#pathgraph")
		.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


	function conciseReaction(d) {
		var txt = "<center><h4>Click now to open a new page showing biosynthetic details for the reaction you selected</h4>";
		txt += images[d.source] + "<br>" + d.source + "<br>";
		txt += "<span class='rxnArrow'>&darr;</span><br>";
		txt += images[d.target] + "<br>" + d.target + "<br></center>";
		$("#results").html(txt);
	}

	function reactionDetails(d) {
		// build html for visualizing a reaction and related data and links
		// maybe good to separate content (txt) and destination (rxnWindow)
		//    less advantageous: add destination as an argument
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
		var winName = d.source + " &rarr; " + d.target;

		var txt = "<!DOCTYPE html><htm><head><meta charset='utf-8'>";
		txt += "<title>" + winName + "</title>";
		txt += "<link rel='stylesheet' type='text/css' href='css/paths.css'></head><body>" 
		txt += "<center><h3>Reaction Details</h3>";
		txt += images[d.source] + "<br>" + d.source + "<br>+ " + fullName + "<br>";
		txt += "<span><ul>";
		d.enzymes.forEach(function (enz) {
			var eStr = enz.gene_name + " (" + enz.species + " " + enz.uniprot + ")";
			txt += "<li><a href='https://www.glygen.org/protein/" + enz.uniprot +   "' target='_blank'>" + eStr + "</a></li>";
		});
		txt += "</span></ul>";
		txt += "<span class='rxnArrow'>&darr;</span><br>";
		txt += images[d.target] + "<br>" + d.target + "<br></center>";
		txt += "</body>";
		var rxnWindow = window.open("", "");
		rxnWindow.document.write(txt);
		rxnWindow.focus();
	}
	
		
	function showGlycan(d) {
		// implemented outside of D3, no direct access to 'data'
		//   data is in arrays 'globalData' and 'images'
		var rs = $("#results");
		rs.html("<center>" + images[d.id] + "<h1>" + d.id + "</h1></center>");
	}

 // USE D3 to process data from API 
 d3.json(theURL, function( data) {		
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
			console.log("Focal Point is " + focalPoint);
		}

	

		// provide access to data to functions outside of D3
		globalData = data;
		
		document.getElementById("headerDiv").innerHTML = "<h2>Pathways from " + a[1] + " to " + a[0] + "</h2>"; 

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
		var nodeCount = 0;
		data.nodes.forEach(function( d, i ) {
			// fetch all the svg images
			$.get("svg/" + d.id + ".gTree.svg", function( response ) {
				var result = (new XMLSerializer()).serializeToString(response);
				images[d.id] = result;
			});
			nodeCount++;
			d.cc = pal[d.dp]; // color of the node, depends on dp
			d.sh = shading[nodeCount % 2]; // shading of the node's 'strip'
			d.y = vSpacing * nodeCount; // vertical spacing of nodes
			d.url = "https://www.glygen.org/glycan/" + d.id;
			d.isSelected = false;
		});
		

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

		document.getElementById("headerDiv").innerHTML += "Number of nodes: " +  nodeCount + "; Number of links: " +  edgeCount + "; Number of unique paths: " + pc;

		function nodeOver(d) {
			showGlycan(d);
			// Highlight the connections to/from the node
			if ((focalPoint == "none") || (focalPoint == d.id)) {
				links
					.classed('arcHot', function (link_d) {
					  return link_d.source === d.id || link_d.target === d.id ? true : false;					
					})
					.classed('arcPale', function (link_d) {
					  return link_d.source !== d.id && link_d.target !== d.id ? true : false;					
					})

				labels
					.classed('labelHot', function (label_d) {
						return label_d.id === d.id ? true : false;
					})
				dpLabels
					.classed('labelHot', function (label_d) {
						return label_d.id === d.id ? true : false;
					})
			}
		}
		
	   function linkOut(d) {
			$("#results").html(helpMessage);
			links
				.classed('arcVeryHot', false);
	   }
	 
		function nodeOut(d) {
			$("#results").html(helpMessage);
			if (focalPoint == "none") {
				links
					.classed('arcHot', false)
					.classed('arcPale', false);
				labels
					.classed('labelHot', false);
				dpLabels
					.classed('labelHot', false);
			}
		}
		
		

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
				$("#results").html(helpMessage);
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
			.classed('labelDefault', true)
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
				d.isSelected = d.isSelected === true ? false : true;
				console.log(d.id + " isSelected: " + d.isSelected);
				// if isSelected, box is checked, class is "checkT" - transparent
				// if !isSelected, default class is "checkX" - opaque
				//  checkX is default class
				d3.selectAll("rect.checkX")
					.classed('checkT', function(box_d) {
						return (box_d.isSelected);	
					})
			})
		// append the "X" in the box, initially hidden by white rectangle
	   checks.append('path')
			.attr('d', function (d) {
				check_y = d.y-6
				return [
					'M',check_x,check_y,'l',12,12,'m',0,-12,
					'l',-12,12
				]
				.join(' ')
			})
			.classed("checkX", true)
		// append a rectangle, initially white to hide the "X"
		checks.append('rect')
	 		.attr("x", check_x)
			.attr("y", function(d){ return(d.y-6)})
			.attr("width", 12)
			.attr("height", 12)
			.classed("checkX", true) 

	 
		var sandboxes = svg
			.selectAll()
			.data(data.nodes)
			.enter()
			.append('g')
			.on("click", function(d) { 
				window.open("explore.html?" + d.id); 
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
				window.open("https://www.glygen.org/glycan/" + d.id);
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
				window.open(subURL + "=" + d.id);
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

	})
	
	// Headers
	svg
		.append("text")
		.attr("x", 50)
		.attr("y", 0)
		.classed('header', true)
		.html("Accession")
	
	svg
		.append("text")
		.attr("x", width)
		.attr("y", 0)
		.classed('header', true)
		.html("DP")
	
}