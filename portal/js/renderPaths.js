function initialize() { 
	// TODO: convert all d3 style attributes to css
	var dataPath = "api/paths/getpathD3v3.php";
	var arg = window.location.search.substring(1);
	var a = arg.split("&");
	var theURL = dataPath + "?start=" + a[1] + "&end=" +a[0];
	// alert(theURL);

	var vSpacing = 20;
	
	var shading = ['#FFFFFF', '#EAF0FA'];
	var mouse_hl = '#25c';
	
	var helpMessage = "<p>Mouse Over or Click on a Graphical Element</p>";

	// as arcScale increases, horizontal size of arc dereases
	var arcScale = 10;
	var margin = {top: 20, right: 20, bottom: 20, left: 20};
	var width = 600 - margin.left - margin.right;
	var height = 3000 - margin.top - margin.bottom;
	var node_x = 300;

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


	
	// process data from API
	d3.json(theURL, function( data) {
		document.getElementById("headerDiv").innerHTML = "<h2>Pathways from " + a[1] + " to " + a[0] + "</h2>"; 

				// map each node to its id so given link source or target, node can be retrieved
		var id_to_node = {};
		data.nodes.forEach(function (n) {
			id_to_node[n.id] = n;
		});
		
		// path_count value
		var pc = data.path_count;

		// d.cc holds the node color - corresponds to dp
		//  d.y specifies the vertical position of each node
		var cc;
		var sh;
		var nodeCount = 0;
		data.nodes.forEach(function( d, i ) {
			nodeCount++;
			d.cc = pal[d.dp];
			d.sh = shading[nodeCount % 2];
			d.y = vSpacing * nodeCount;
			d.url = "https://www.glygen.org/glycan/" + d.name;
			d.isSelected = 0;
		});

		// calculate parameters for arcs
		var edgeCount = 0;
		var maxSpan = 1;
		data.links.forEach(function (d) {
			edgeCount++;
			var soy = id_to_node[d.source].y 
			var tay = id_to_node[d.target].y
			maxSpan = Math.max(maxSpan, Math.abs(tay - soy));
			// arcScale defines how 'tall' each arc is
			arcScale = Math.min(20, 1800 / maxSpan);
		});

		document.getElementById("headerDiv").innerHTML += "Number of nodes: " +  nodeCount + "; Number of links: " +  edgeCount + "; Number of unique paths: " + pc;



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
			})
			.on('mouseout', function (d) {
				$("#results").html("");
				links
					.classed('arcHot', false);	
			})
			.on("click", function(d) {
				showReaction(d);
				/*

				*/
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
				// window.open("https://www.glygen.org/glycan/" + d.name);
				d.isSelected = 1;
				showNode(d);
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
			.attr("x", 50)
			.attr("y", function(d){ return(d.y+5)})
			.classed('labelDefault', true)
			.text(function(d){ return(d.name)})
			.on("click", function(d) { 
				window.open("explore.html?" + d.name); 
			})
			.on('mouseover', function (d) {
				$("#results").load("svg/" + d.name + ".gTree.svg");
				labels
					.classed('labelHot', function (label_d) {
						return label_d.id === d.id ? true : false;
					})
			})
			.on('mouseout', function (d) {
				$("#results").html("");
				labels
					.classed('labelHot', false);
			});	

		 // Add the mouseover functionality 
		nodes
			.on('mouseover', function (d) {
				$("#results").load("svg/" + d.name + ".gTree.svg");
				// Highlight the connections to/from the node
				links
					.classed('arcHot', function (link_d) {
					  return link_d.source === d.id || link_d.target === d.id ? true : false;					
				  })
	
				labels
					.classed('labelHot', function (label_d) {
						return label_d.id === d.id ? true : false;
					})
				dpLabels
					.classed('labelHot', function (label_d) {
						return label_d.id === d.id ? true : false;
					})
			})
			.on('mouseout', function (d) {
				$("#results").html("");
				links
					.classed('arcHot', false);
				labels
					.classed('labelHot', false);
				dpLabels
					.classed('labelHot', false);
			})
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