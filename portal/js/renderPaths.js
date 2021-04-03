function initialize() { 
	// TODO: convert all d3 style attributes to css
	
	var globalData;
	var dataPath = "api/paths/getpathD3v3.php";
	var arg = window.location.search.substring(1);
	var a = arg.split("&");
	var theURL = dataPath + "?start=" + a[1] + "&end=" +a[0];
	// alert(theURL);

	var vSpacing = 20;
	
	var shading = ['#FFFFFF', '#EAF0FA'];
	var mouse_hl = '#25c';
	
	var helpMessage = "<p>Mouse Over or Click on a Graphical Element</p>";
	var subURL = "https://gnome.glyomics.org/restrictions/GlyGen.StructureBrowser.html?focus";
	// as arcScale increases, horizontal size of arc dereases
	var arcScale = 10;
	var margin = {top: 20, right: 20, bottom: 20, left: 20};
	var width = 600 - margin.left - margin.right;
	var height = 3000 - margin.top - margin.bottom;
	var node_x = 300;
	var label_x = 50;
	var logo_x = 110;
	var sand_x = 135;
	var sub_x = 175;

	// append the svg object to the body of the page
	var svg = d3.select("#pathgraph")
		.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	
	function showNode(d) {
		var txt = "You clicked node " + d.name;
		$("#results").html(txt);
	}

	function conciseReaction(d) {
		var txt = "<h2>Click now to open a new page containing more details about the reaction shown below</h2>";
		txt += "<p>" + d.source + " &rarr; " + d.target + "</p>";
		txt += "<p>" + d.residue_added + " is added or removed</p>";
		txt += "<p>" + d.enzymes.length + " (GT or GH) enzymes (listed below) catalyze this reaction, </p>";
		txt += " <ul>";
		d.enzymes.forEach(function (enz) {
			txt += "<li>" + enz.gene_name + "</li>";
		});
		txt += "</ul>";
		$("#results").html(txt);
	}

	function showReaction(d) {
		// build html for visualizing a reaction and related data and links
		// maybe good to separate content (txt) and destination (rxnWindow)
		//    less advantageous: add destination as an argument
		var txt = "<center><h3>Reaction Details Page</h3></center>";
		txt += "<p>This page will contain a graphical representation of extensive details for the reaction <br> " + d.source + " &rarr;  " + d.target + "</p>";
		txt += "<p>This will include svg images of the glycans along with information about the " + d.enzymes.length + " (GT or GH) enzymes that directly affect <b>residue " + d.residue_added + "</b>, which is added or removed during the reaction.</p><p>This requires additional queries to the database API.</p>";
		txt += "<p>Here are the enzymes</p>  <ul>";
		d.enzymes.forEach(function (enz) {
			txt += "<li>" + enz.gene_name + " (" + enz.species + " " + enz.uniprot + ")</li>";
		});
		var rxnWindow = window.open("", "_new");
		rxnWindow.document.write(txt);
		rxnWindow.focus();
	}

	function showGlycan(d) {
		// implemented outside of D3, no direct access to 'data', us globalData
		// alert(globalData.path_count);
		var rs = $("#results");
		$.get("svg/" + d.name + ".gTree.svg", function( response ) {
			// TODO: save all these as subelements of data upon loading to reduce latency
			var result = (new XMLSerializer()).serializeToString(response);
			rs.html("<center><h1>Glycan " + d.name + "</h1></center><br>" + result);
		});
	}
	
	// USE D3 to process data from API 
	d3.json(theURL, function( data) {
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

		// add drawing variables to each node in data.nodes
		var cc;
		var sh;
		var nodeCount = 0;
		data.nodes.forEach(function( d, i ) {
			nodeCount++;
			d.cc = pal[d.dp]; // color of the node, depends on dp
			d.sh = shading[nodeCount % 2]; // shading of the node's 'strip'
			d.y = vSpacing * nodeCount; // vertical spacing of nodes
			d.url = "https://www.glygen.org/glycan/" + d.name;
			d.isSelected = 0;
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
		
		function nodeOut(d) {
			$("#results").html("");
			links
				.classed('arcHot', false)
				.classed('arcPale', false);
			labels
				.classed('labelHot', false);
			dpLabels
				.classed('labelHot', false);
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
				start = id_to_node[d.source].y 
				end = id_to_node[d.target].y
				return [
					'M',
					// the x-coordinate for start of each arc is static (node_x)
					node_x,
					// the arc starts (y-coordinate) at the starting node
					start,    
					'A', 
					// nodes that are far apart are connected by 'tall' arcs
					//  arc size is controlled by arcScale
					// radius x (rx)
					arcScale * (start - end),     
					// radius y (ry)
					(start - end),
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
					end
				]
				.join(' ');
			})
			.classed('arcDefault', true)
			.on('mouseover', function (d) {
				conciseReaction(d);
				links
					.classed('arcHot', function (link_d) {
					return link_d.source === d.source && link_d.target === d.target ? true : false;					
				})	
				.classed('arcPale', function (link_d) {
				  return link_d.source !== d.id && link_d.target !== d.id ? true : false;					
				})				
			})
			.on('mouseout', function (d) {
				$("#results").html("");
				nodeOut(d);
			})
			.on("click", function(d) {
				showReaction(d);
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
				d.isSelected = 1;
				showNode(d);
			})
			.on('mouseover', function (d) {
				nodeOver(d);
			})
			.on('mouseout', function (d) {
				nodeOut(d);
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
			.text(function(d){ return(d.name)})
			.on('mouseover', function (d) {
				nodeOver(d);
			})
			.on('mouseout', function (d) {
				nodeOut(d);
			})
			.on("click", function(d) {
				d.isSelected = 1;
				showNode(d);
			})	

		var sandboxes = svg
			.selectAll()
			.data(data.nodes)
			.enter()
			.append('g')
			.on("click", function(d) { 
				window.open("explore.html?" + d.name); 
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
				start = d.y
				return [
					'M',sand_x,start,'l',15.20,4.40,'l',4.00,-5.60,
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
				window.open("https://www.glygen.org/glycan/" + d.name);
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
				start = d.y - 4
				return [
					'M',logo_x,start,'l',12.65,3.65,'l',4.2,-4.85,	
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
				window.open(subURL + "=" + d.name);
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
				start = d.y - 7.5
				return [
					'M',sub_x,start,'a',1.8,1.8,1,1,0,0.001,0,
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