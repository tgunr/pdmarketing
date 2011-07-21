function bzGetFlashPlayerBZ4E2230EF9DF242998BA7() {
	var div = document.getElementById('SWBZ4E2230EF9DF242998BA7');
	if (div) {
		div.innerHTML = '<p style="background-color:#ffffff;color:#000000;padding:1em;">You have an old version of Flash Player. <a href="http://www.adobe.com/go/getflash/" target="_top">Get the latest Flash player.</a></p>';
	} else {
		alert("no SWBZ4E2230EF9DF242998BA7 div");
	}
}
function checkLocalWarning() {
	var path = _urlBZ4E2230EF9DF242998BA7.substring(0,8);
	if (path.match('file:\/\/')) {
		var element = document.getElementById('local-warning');
		element.style.display = '';
	}
}
function bzEmbedSWFBZ4E2230EF9DF242998BA7() {
	if (swfobject.hasFlashPlayerVersion("9.0.45")) {
		var flashvars = {
			swfId: "SWBZ4E2230EF9DF242998BA7",
			xmlPath: _urlBZ4E2230EF9DF242998BA7 + "bz.xml",
			imgPath: _urlBZ4E2230EF9DF242998BA7 + "img",
			urlType: "_top",
			showInfo: "1",
			themeMode: "2"
		};
		var params = {
			wmode: "transparent",
			allowscriptaccess: "always"
		};
		var attributes = {};
		swfobject.embedSWF(_urlBZ4E2230EF9DF242998BA7 + "bzAnimation.swf", "SWBZ4E2230EF9DF242998BA7", "240", "206", "9.0.45", false, flashvars, params, attributes);
		swfobject.addDomLoadEvent(checkLocalWarning);
	} else {
		swfobject.addDomLoadEvent(bzGetFlashPlayerBZ4E2230EF9DF242998BA7);
	}
}
bzEmbedSWFBZ4E2230EF9DF242998BA7();
