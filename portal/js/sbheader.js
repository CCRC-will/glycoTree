
function setupAnimation(svgID, contextID) {	
	// the next part is very general - generate array animA
	var animA = []; // an array of animation elements
	var aa = $("#" + svgID).contents().find('animate');
	for (var i = 0; i < aa.length; i++) 
		animA[aa[i].getAttribute('id')] = aa[i];
	
	var at = $("#" + svgID).contents().find('animateTransform');
	for (var i = 0; i < at.length; i++) 
		animA[at[i].getAttribute('id')] = at[i];
	
	// c is the context - the html element holding the svg
	// use vanilla javascript to make addEventListener (below) work
	var c = document.getElementById(contextID); 

	// the rest is context-specific 
	c.addEventListener('mouseenter', function() {
		var tcm = tCount % 4;  // step through permutations
		switch(tcm) {
			case 0: // translation
				animA['mv_top'].beginElement();
				animA['mv_bottom'].beginElement();
				animA['mv_middle'].beginElement();
				animA['show_sand'].beginElement();
				break;
			case 1: // reverse translation
				animA['vm_top'].beginElement(); // vm is reverse of mv
				animA['vm_bottom'].beginElement();
				animA['vm_middle'].beginElement();
				animA['hide_sand'].beginElement();
				break;
			case 2: // rotation
				animA['rot_top'].beginElement();
				animA['rot_bottom'].beginElement();
				animA['mv_middle'].beginElement();
				animA['show_sand'].beginElement();
				break;
			case 3: // reverse rotation
				animA['tor_top'].beginElement(); // tor is reverse of rot
				animA['tor_bottom'].beginElement();
				animA['vm_middle'].beginElement();
				animA['hide_sand'].beginElement();
				break;
		}
		tCount++;
	}, false);

}