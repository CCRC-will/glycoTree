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
	var arcScale = 0.7;
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

	// process data from API
	d3.json(theURL, function( data) {
		document.getElementById("headerDiv").innerHTML = "<h2>Pathways from " + a[1] + " to " + a[0] + "</h2>"; 

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
			console.log("name is " + d.name + " - dp is " + d.dp + " - color is " + d.cc + " - y is " + d.y);
		});

		var edgeCount = 0;
		data.links.forEach(function (n) {
			edgeCount++;
		});

		document.getElementById("headerDiv").innerHTML += "Number of nodes: " +  nodeCount + "; Number of links: " +  edgeCount + "; Number of unique paths: " + pc;

		// map each node to its id so given link source or target, node can be retrieved
		var id_to_node = {};
		data.nodes.forEach(function (n) {
			id_to_node[n.id] = n;
		});


		// draw alternate shading first (background)
		var shade = svg
			.selectAll()
			.data(data.nodes)
			.enter()
			.append("rect")
			.attr("x", 0)
			.attr("y", function(d){ return(d.y-10)})
			.attr("width", width)
			.attr("height", 20)
			.style("fill", function(d){ return(d.sh)})

		// draw links before nodes so nodes are in foreground
		// draw the links
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
					node_x,
					start,    
					// the arc starts at the starting node
					'A', 
					// radius x (rx)
					(start - end),     
					// radius y (ry) - arc is forced to go through start and end
					//   counter-intuitively, increasing ry makes arc shallower
					arcScale * (start - end),
					// x-axis-rotation
					0,
					// large-arc-flag
					0,
					// sweep-flag
					//   value of 1 always makes arc clockwise from start to end
					1,  
					node_x,
					end
				]
				.join(' ');
			})
			.style("fill", "none")
			.attr("stroke", "black")
			.on('mouseover', function (d) {
				$("#results").html("<h3>Mouse-Over Arc: concise reaction details for arc will be drawn here</h3>");
				// TODO: highlight the arc
			})
			.on('mouseout', function (d) {
				$("#results").html("");
				// TODO: unhiglight the arc
			})
			.on("click", function(d) { 
				$("#results").html("<h3>Click Arc: full reaction details will be shown in new window</h3>");
			});

		// draw nodes
		var nodes = svg
			.selectAll()
			.data(data.nodes)
			.enter()
			.append("circle")
			.attr("cx", node_x)
			.attr("cy", function(d){ return(d.y)})
			.attr("r", 6)
			.style("fill", function(d){ return(d.cc)})
			.on("click", function(d) { window.open("https://www.glygen.org/glycan/" + d.name); })



		// label nodes	
		var labels = svg
			.selectAll()
			.data(data.nodes)
			.enter()
			.append("text")
			.attr("x", 5)
			.attr("y", function(d){ return(d.y+5)})
			.attr("class", "linkText")
			.text(function(d){ return(d.name + ' (' + d.dp) + ")"})
			.on("click", function(d) { window.open("explore.html?" + d.name); })
			.on('mouseover', function (d) {
				$("#results").load("svg/" + d.name + ".gTree.svg");
			})
			.on('mouseout', function (d) {
				$("#results").html("");
			});	

		 // Add the mouseover functionality - TODO: put this with node defs
		nodes
			.on('mouseover', function (d) {
				$("#results").load("svg/" + d.name + ".gTree.svg");
				// Highlight the connections to/from the node
				links
					 .style('stroke', function (link_d) { 
						  return link_d.source === d.id || link_d.target === d.id ? mouse_hl : '#ccc';
					  })
					 .style('stroke-width', function (link_d) {
						  return link_d.source === d.id || link_d.target === d.id ? 3 : 1;
					  })
				labels
					.style('fill', function (label_d) {
					  return label_d.id === d.id ? mouse_hl : '#000';
					})
			})
			.on('mouseout', function (d) {
				$("#results").html("");
				links
					.style('stroke', 'black')
					.style('stroke-width', '1')
				labels
					.style('fill', 'black')
			})
	})
}