if( !_urlBZ4E2230EF9DF242998BA7 ) {
	var _urlBZ4E2230EF9DF242998BA7 = null;
	var scripts = document.getElementsByTagName("script");
	for( var i=0;i<scripts.length;i++ ) {
		var s = scripts[i];
		if( s.src && s.src.match(/bzLoader\.js/) ) {
			if (s.src.length>11) {
				_urlBZ4E2230EF9DF242998BA7 = s.src.substring(0,s.src.length-11);
			} else {
				_urlBZ4E2230EF9DF242998BA7 = "./";
			}
		}
	}
}
var _scriptsBZ4E2230EF9DF242998BA7 = new Array();
_scriptsBZ4E2230EF9DF242998BA7[0] = 'swfobject.js';
_scriptsBZ4E2230EF9DF242998BA7[1] = 'bz.js';
for( var i=0;i<_scriptsBZ4E2230EF9DF242998BA7.length;i++ ) {
	var urlC = _urlBZ4E2230EF9DF242998BA7+_scriptsBZ4E2230EF9DF242998BA7[i];
	document.write('<script type="text/javascript" src="'+ urlC +'"><\/script>');
}