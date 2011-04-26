// Copyright (c) 2002-2004 AquaMinds Software Corporation. All rights reserved.

// resizes images that are wider than the iPhone display
function resizeImages(s, maxWidth) {
	var i1 = 0;
	while ((i1 >= 0) && (i1 < s.length)) {
		var p1 = s.indexOf("<IMG ", i1);
		if (p1 < 0)
			p1 = s.indexOf("<img ", i1);
		var p2 = s.indexOf("<EMBED ", i1);
		if (p2 < 0)
			p2 = s.indexOf("<embed ", i1);
		p3 = s.indexOf("<OBJECT ", i1);
		if (p3 < 0)
			p3 = s.indexOf("<object ", i1);
		p2 = ((p1 >= 0) && (p2 >= 0)) ? ((p1 < p2) ? p1 : p2) : ((p1 >= 0) ? p1 : p2);
		i1 = ((p2 >= 0) && (p3 >= 0)) ? ((p2 < p3) ? p2 : p3) : ((p2 >= 0) ? p2 : p3);
		if (i1 >= 0) {
			i1 += 4;
			var i2 = s.indexOf(">", i1);
			if (i2 > i1) {
				var attributes = s.substring(i1, i2);
				// find the width attribute
				var i3 = attributes.search(/width=/i);
				if (i3 >= 0) {
					i3 += 6;
					var i4 = attributes.indexOf(" ", i3);
					if (i4 < 0) i4 = attributes.length;
					// trim spaces and quotes
					while (isNaN(attributes.charAt(i3))) i3++;
					while (isNaN(attributes.charAt(i4 - 1))) i4--;
					
					if (i4 > i3) {
						// we should now have a valid width
						var width = attributes.substring(i3, i4);
						if (!isNaN(width) && (width > maxWidth)) {
							// it needs to be reduced
							
							var newAttributes = (attributes.substring(0, i3) + maxWidth + attributes.substring(i4, attributes.length));
							
							// look for a height value as well
							var i5 = newAttributes.search(/height=/i);
							if (i5 >= 0) {
								
								i5 += 7;
								var i6 = newAttributes.indexOf(" ", i5);
								if (i6 < 0) i6 = newAttributes.length;
								// trim spaces and quotes
								while (isNaN(newAttributes.charAt(i5))) i5++;
								while (isNaN(newAttributes.charAt(i6 - 1))) i6--;
								if (i6 > i5) {
									// we should now have a valid height
									var height = newAttributes.substring(i5, i6);
									if (!isNaN(height)) {
										newAttributes = (newAttributes.substring(0, i5) + (height * maxWidth / width) + newAttributes.substring(i6, attributes.length));
									}
								}
							}
							
							// Fix up the original input string
							s = s.substring(0, i1) + newAttributes + s.substring(i2, s.length);
						}
					}
				}				
				i1 = i2;
			}
		}
	}
	return s;
}

// converts iframe tags to just a link to the URL
function removeIFrame(s, maxWidth) {
	var i1 = s.indexOf("<IFRAME ", i1);
	if (i1 < 0)
		i1 = s.indexOf("<iframe ", i1);
	if (i1 >= 0) {
		i1 += 7;
		var i2 = s.indexOf(">", i1);
		if (i2 > i1) {
			var attributes = s.substring(i1, i2);
			// find the src attribute
			var i3 = attributes.search(/src=/i);
			if (i3 >= 0) {
				i3 += 4;
				var i4 = attributes.indexOf(" ", i3);
				if (i4 < 0) i4 = attributes.length;					
				if (i4 > i3) {
					// we should now have a valid src
					// strip all spaces and quotes
					while ((attributes.charAt(i3) == '"') || (attributes.charAt(i3) == ' ')) i3++;
					while ((attributes.charAt(i4-1) == '"') || (attributes.charAt(i4-1) == ' ')) i4--;
					var src  = attributes.substring(i3, i4);
					if (src.indexOf("pages/") < 0) {
						var text = src;
						var i2 = text.lastIndexOf('/');
						if (i2 >= 0)
							text = text.substring(i2 + 1, text.length);
						// Fix up the original input string
						var ext = "";
						var i = src.lastIndexOf('.');
						if (i > 0)
							ext = src.substring(i, src.length).toLowerCase();
						if ((ext == ".jpg") || (ext == ".png") || (ext == ".gif") || (ext == ".tif") || (ext == ".tiff") || (ext == ".pdf")){
							s = "<a href=\"" + src + "\" target=\"_top\"><img src=\"" + src + "\" style=\"max-width:" + maxWidth + "\"></a>";
						}
						else
							s = "<a href=\"" + src + "\" target=\"_top\">" + text + "</a>";
					}
				}
			}
		}				
	}
	return s;
}

function fixMovieEmbeds(s) {
	var i1 = s.indexOf("<embed ", i1);
	if (i1 < 0)
		i1 = s.indexOf("<EMBED ", i1);
	if (i1 >= 0) {
		i1 += 7;
		var i2 = s.indexOf(">", i1);
		if (i2 > i1) {
			var attributes = s.substring(i1, i2);
			var isMovie = (attributes.search("type=\"video/") >= 0);
			var isAudio = !isMovie && (attributes.search("type=\"audio/") >= 0);
			if (isMovie) {
				var i3 = attributes.search("src=\"attachments/");
				if (i3 >= 0) {
					i3 += 26;
					var i4 = attributes.indexOf("\"", i3);
					if (i4 < 0) i4 = attributes.length;					
					if (i4 > i3) {
						var name = attributes.substring(i3, i4);
						var i5 = name.lastIndexOf('.');
						if (i5 > 0)
							name = name.substring(0, i5);
						attributes = attributes.replace("src=\"attachments/", "href=\"");
						attributes += " src=\"attachments/" + name + "_preview.png\" target=\"myself\"";
						s = s.substring(0, i1) + attributes + s.substring(i2, s.length);					
					}
				}
			}
			if (isAudio || isMovie) {
				// get rid of the icon
				var i3 = s.indexOf("_icon.jpg");
				if (i3 > 0) {
					i3 = s.lastIndexOf("<A ", i3);
					if (i3 > 0) {
						var i4 = s.indexOf("</A>");
						if (i4 > 0) {
							s = s.substring(0, i3) + s.substring(i4 + 4, s.length);
						}
					}
				}
			}
		}
	}
	return s;
}

// Adds soft hyphens after forward slashes in URL text
function wrapLongURLs(text) {
	var i1 = 0;
	do {
		// find start of next <a> tag
		var i2 = text.indexOf("<a ", i1);
		if (i2 < 0)
			i2 = text.indexOf("<A ", i1);
		i1 = i2;
		if (i1 > -1) {
			// find end of the <a> tag
			i1 = text.indexOf(">", i1 + 3);
			if (i1 > -1) {
				// find start of </a> tag
				i2 = text.indexOf("</a", i1);
				if (i2 < 0)
					i2 = text.indexOf("</A", i1);
				if (i2 > 0) {
					var s = text.substring(i1, i2 + 1);
					// Find the linked text
					var i3 = s.search(/>[^<>]+</);
					if (i3 >= 0) {
						s = text.substring(i1 += i3 + 1, i2)
						// insert soft hyphens after every forward slash
						s = s.replace(/[\057]/g, "/&shy;");
						s = s.replace(/[@]/g, "@&shy;");
						s = s.replace(/[.]/g, ".&shy;");
						text = text.substring(0, i1) + s + text.substring(i2, text.length);
					}
					i1 += s.length;
				}
				else {
					i1 = -1; // bail out
				}
			}
		}
	}
	while ((i1 > 0) && (i1 < text.length));
	return text;
}

