function speciate() {
	var s = document.getElementById('species').value;
	var ss = document.getElementsByClassName('species'); 
	if (s === 'all') {
		for (var i=0; i<ss.length; i++) {
			ss[i].style.visibility = 'visible';
			ss[i].style.height = 'auto';
		}
	}  else {
		for (var i=0; i<ss.length; i++) {
			ss[i].style.visibility = 'hidden';
			ss[i].style.height = '0px';
		}
		var sss = document.getElementsByClassName(s);
		for (var i=0; i<sss.length; i++) {
			sss[i].style.visibility = 'visible';
			sss[i].style.height = 'auto';
		}
	}
}