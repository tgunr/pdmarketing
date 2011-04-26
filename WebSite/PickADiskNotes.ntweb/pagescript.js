// Copyright (c) 2002-2007 AquaMinds Software Corporation. All rights reserved.

var allEntries = new Array();
var topEntries = new Array();

function gotoPage(pageNum, entryId) {
	parent.gotoPage(pageNum, entryId);
}

if (parent.isIPhone) {
	document.write("<SCRIPT LANGUAGE=\"JavaScript\" SRC=\"iphone.js\"></SCRIPT>");
}

var bgImageXOffset = 0;
var bodyIsLoaded = 0;

function gotoSelectedEntry() {
	var frame = frames["pageBodyFrame"];
	frame.location.hash = (parent.selectedText && (parent.selectedText.length > 0)) ? "selection" : parent.selectedEntryId;
	parent.selectedText = null;
	parent.selectedEntryId = -1;
}

function bodyLoaded() {
	var frame = frames["pageBodyFrame"];
	if (parent.bgImageType >= 2) {
		var doc = frame.document;
		if (doc.pageBgImage && !parent.isIPhone) {
			bgImageSize();
		}
	}
	if (parent.selectedEntryId && (parent.selectedEntryId.length > 0)) {
		setTimeout("gotoSelectedEntry()", 20);
	}
	setTimeout("bodyIsLoaded = 1;", 5);
}

function bodyResized() {
	bgImageSize(bodyIsLoaded ? 0 : 16);
}

function bgImageSize(sbWidth) {
	var frame = frames["pageBodyFrame"];
	var doc   = frame.document;

	var winWidth  = 0;
	var winHeight = 0;
	
	var imgWidth  = parent.bgImageWidth;
	var imgHeight = parent.bgImageHeight;
	var imgLeft      = 0;

	if (frame.innerWidth) {
		winWidth  = frame.innerWidth;
		winHeight = frame.innerHeight;
	}
	else if (doc.body.clientWidth) {
		winWidth  = doc.body.clientWidth;
		winHeight = doc.body.clientHeight;
	}
	if (winWidth == 0) {
		if (frame.parent) {
			winWidth  = frame.parent.innerWidth;
			winHeight = frame.parent.innerHeight;
			if (winWidth == 0) {
				winWidth  = frame.parent.top.innerWidth;
				winHeight = frame.parent.top.innerHeight;
			}
		}
	}
	if ((winWidth > 0) && (winHeight > 0)) {
		if (parent.isSafari && sbWidth && (parent.pageNumber > 0))
			winWidth += sbWidth;
		if (parent.isIPhone) {
			if ((winWidth < 320) && (winHeight > 420))
				winHeight = 420;
			else if ((winWidth > 400) && (winHeight > 270))
				winHeight = 270;
		}
		
		var bgImageRatio = imgHeight / imgWidth;
		
		if (parent.bgImageType == 2) {
			// fit to width of page
			imgWidth  = winWidth;
			imgHeight = (winWidth * bgImageRatio);
		}
		else if (parent.bgImageType == 3) {
			// cover - preserve aspect but cover the page
			var winRatio = winHeight / winWidth;
			if (winRatio > bgImageRatio) {
				imgHeight = winHeight;
				imgWidth  = (imgHeight / bgImageRatio);
				if (imgWidth > winWidth) {
					imgLeft = winWidth - imgWidth;
					if (!parent.isIPhone) {
						imgLeft = imgLeft / 2;
					}
				}
			}
			else {
				imgWidth  = winWidth;
				imgHeight = (winWidth * bgImageRatio);
			}
		}
		else if (parent.bgImageType == 4) {
			// scale
			imgWidth  = winWidth;
			imgHeight = winHeight;
		}
	}
	
	imgLeft   = Math.round(imgLeft);
	imgWidth  = Math.round(imgWidth);
	imgHeight = Math.round(imgHeight);

	if (!parent.isIPhone) {
		var img = doc.pageBgImage;
		if (img) {
			img.left   = imgLeft;
			img.width  = imgWidth;
			img.height = imgHeight;
		}
	}
	
	imgWidth  = (Math.abs(imgWidth - winWidth) > 2) ? (imgWidth + "px") : "100%";
	return "left: " + imgLeft + "px; top: 0px; width: " + imgWidth + "; height: " + imgHeight + "px";
}

var sx = 0;
var sy = 0;

function scrollback() {
	var frame = frames["pageBodyFrame"];
	frame.scrollTo(sx, sy);
}

// Global method called when clicking on the expand or contract image for an entry
function expand(id) {
	sx = 0;
	sy = 0;
	var frame = frames["pageBodyFrame"];
	var doc   = frame.document;
	var bd  = doc.body;
    if (doc.documentElement && doc.documentElement.scrollTop) {
        // IE
        sx = doc.documentElement.scrollLeft;
        sy = doc.documentElement.scrollTop;
    }
    else if (doc.body && doc.body.scrollTop) {
        // IE
        sx = doc.body.scrollLeft;
        sy = doc.body.scrollTop;
    }
    else if (frame.scrollY) {
        // Mozilla
        sx = frame.scrollX;
        sy = frame.scrollY;
    }
    else if (frame.pageYOffset) {
        // Netscape
        sx = frame.pageXOffset;
        sy = frame.pageYOffset;
    }
    allEntries[id].expanded = !allEntries[id].expanded;
	if (parent.isSafari || parent.isIPhone)
		writePageBody(doc);
	else
		frame.location = frame.location;
	setTimeout("scrollback()", 100);
}

// This function mimics the html encoding of the entry content done when the web notebook is generated
function encode(str) {
	var index  = 0;
	var len    = str.length;
	var entity;
	var added;
	var chr;
	var code;
	
	while (index < len) {
		chr = str.charAt(index);
		entity = null;
		
		switch (chr) {
			case  '&': entity = "&amp;";  break;
			case  '<': entity = "&lt;";   break;
			case  '>': entity = "&gt;";   break;
			case '\"': entity = "&quot;"; break;
			case '\'': entity = "&#39;"; break;
			case '\\': entity = "&#92;"; break;
			case  '#': entity = "&#35;"; break;
			default: {
				code = str.charCodeAt(index);
				if ((code >= 127) && (code < 256)) {
					entity = String(code);
					while (entity.length < 4) {
						entity = "0" + entity;
					}
					entity = "&#" + entity + ";";
				}
				break;
			}
		}
						
		if (entity != null) {
			str    = str.substr(0, index) + entity + str.substr(index + 1);
			added  = entity.length - 1;
			index  += added;
			len    += added;
		}
						
		index++;
	}
						
	return str;
}

// Entry method which returns the HTML for an entry (a table with the image and contents), and its expanded children
function getHTML(indent, doc) {
	var s = "";
    s += "<A NAME=\"" + this.id + "\"><TABLE ID=\"" + this.id + "\" ENTRIESPACING=\"0\" ENTRYPADDING=\"2\" NOBORDER WIDTH=\"100%\">\n";
    s += "<TR> <TD style=\"white-space: nowrap; width: " + ((indent + 1) * 15) + "px; text-align: right; vertical-align:top\">\n";
    if (parent.showControls) {
        if (this.children.length > 0) {
            var ss = "<A HREF=\"javascript:parent.expand(";
            ss += this.id;
            ss += ")\" ONMOUSEOVER=\"window.status=\'Expand/Collapse selected outline\'; return true;\" ONMOUSEOUT=\"window.status=\'\'; return true;\">";
            ss += "<IMG BORDER=\"0\" SRC=\"";
            ss += (this.expanded ? "images/open.png" : "images/closed.png");
            ss += "\"></A>\n";
			s += ss;
        }
        else {
            if (this.linkedPageNum > 0) {
                var ss = "<A HREF=\"javascript:parent.gotoPage(";
                ss += this.linkedPageNum;
                ss += ",";
                ss += this.linkedEntryId;
                ss += ");\" ";
                ss += "ONMOUSEOVER=\"window.status=\'Go to selected page\'; return true;\" ONMOUSEOUT=\"window.status=\'\'; return true;\" TARGET=\"_parent\"><IMG BORDER=\"0\" SRC=\"images/link.png\"></A>\n";
				s += ss;
            }
            else {
                s += "<IMG BORDER=\"0\" SRC=\"images/node.png\">\n";
            }
        }
    }
    s += "<TD style=\"text-align:left";
	
	var isSectionPage = (this.linkedPageNum > 0) && (parent.pageName == "");
	
	if (this.selected) {
		if (!this.selectedText) {
			s += "; background: #B5D5FF";
		}
		else {
			s += "; border: 1px solid #B5D5FF";
		}
	}
	if (isSectionPage) {
		s += "; cursor:pointer";
	}
	s += "\"";
	
	if (isSectionPage) {
		// On section pages, link the page names to the pages
		s += " onclick=\"javascript:parent.gotoPage(" + this.linkedPageNum + "," + this.linkedEntryId + ");\"";
	}
	else if (this.children.length) {
		s += " onclick=\"javascript:parent.expand(" + this.id + ")\"";
	}
	s += "  >";
	
	// Make some changes for the iPhone
	var str = this.contents;
	
	if (parent.isIPhone) {
		var w = (parent.window.innerWidth >= 480) ? 400 : 240;
		var ringFrame = parent.window.document.getElementById("vringFrame");
		if (ringFrame)
			w -= ringFrame.width;
		str = resizeImages(str, w);   // size images to available width
		str = removeIFrame(str, w);   // iframes not terribly useful in this context
		str = str.replace(/LinkPage/g, "_top"); // keep external links in same "window" so back button works as expected
		str = fixMovieEmbeds(str);  // reference the preview image, etc
		str = wrapLongURLs(str);
	}
	
	if (this.selectedText) {
		var sel = encode(this.selectedText);
		var rExp = new RegExp(sel, "i");
		var i = str.search(rExp);
		if (i >= 0) {
			var n = sel.length;
			str = str.substr(0, i) + "<a name=\"selection\"><span style=\"background: #B5D5FF\">" + str.substr(i, n) + "</span></a>" + str.substr(i + n);
		}
	}
	
    s += str;
    s += "</td>";
	if (isSectionPage) {
		s += "<td style=\"text-align:right; cursor:pointer\" onclick=\"javascript:parent.gotoPage(" + this.linkedPageNum + "," + this.linkedEntryId + ");\"><span class=\"pageNumber\">" + this.linkedPageNum + "&nbsp;</span></td>";
	}
	
	s += "\n</TABLE></A>\n";
    if ((this.children.length > 0) && this.expanded) {
        for (var i = 0; i < this.children.length; i++) {
            s += this.children[i].getHTML(indent + 1, doc);
        }
    }
    this.selected = false;
	this.selectedText = null;
	return s;
}

// Entry method which adds a child entry to a parent entry
function addChild(child) {
    this.children[this.children.length] = child;
    child.parent = this;
    return child;
}

// Entry method called to expand a entry. Expands all parent entries as well
function setExpanded(flag) {
    this.expanded = true;
    if (this.expanded && (this.parent != null)) {
	    this.parent.setExpanded(true);
    }
}

// Entry method called to flag an entry as selected.  Expands the parent to 
// make sure the entry is visible
function setSelected(flag) {
    this.selected = flag;
    if (this.selected && (this.parent != null)) {
	    this.parent.setExpanded(true);
    }
}

// Entry object definition
function entry(id, contents, expanded, linkedPageNum, linkedEntryId) {
    this.id = id;
    allEntries[this.id] = this;
    this.contents       = contents;
    this.children       = new Array();
    this.parent         = null;
    this.expanded       = expanded;
    this.linkedPageNum  = linkedPageNum;
    this.linkedEntryId  = linkedEntryId;
    this.selected       = false;
	this.selectedText   = null;
    this.setSelected    = setSelected;
    this.setExpanded    = setExpanded;
    this.getHTML        = getHTML;
    this.addChild       = addChild;
}

// Retrieve the previous page number from our cookie
function previousPageNumber() {
    var n = 1;
    var i1 = parent.document.cookie.indexOf("previousPageNumber=");
    if (i1 >= 0) {
        var i2 = parent.document.cookie.indexOf(";", i1 + 19);
        if (i2 < 0) i2 = parent.document.cookie.length;
        n = parent.document.cookie.substring(i1, i2);
        if (n < 1) n = 1;
        if (n > parent.notebookPageCount)
            n = parent.notebookPageCount;
    }
    return n;
}

function loadStyles(doc) {
	var pageNum = parent.validatePageNumber(parent.pageNumber);
	doc.write('<link rel="stylesheet" type="text/css" href="pages/' + pageNum +  '/page.css" />');
	if (parent.isIPhone)
		doc.write('<link rel="stylesheet" type="text/css" href="pages/' + pageNum +  '/page-iphone.css" />');
	if (!parent.useTitleFrame && (parent.pageNumber > 0)) {
		doc.write('<link rel="stylesheet" type="text/css" href="pages/' + pageNum +  '/title.css" />');
	}
}

// Global function which generates the BODY HTML for the page (entry list) frame
function writePageBody(doc) {
	bodyIsLoaded = 0;
	doc.open();
	doc.write("<BODY class=\"pageBackgroundStyle\" style=\"height:100%\" onload=\"parent.bodyLoaded()\" onresize=\"parent.bodyResized();\"");
	if (parent.pageNumber == 0)
		doc.write(" onmousemove=\"window.status='Click to enter notebook'; return true;\"");
	if (parent.isIPhone)
		doc.write(" style=\"-webkit-text-size-adjust:110%\"");
	doc.write(">");
	
	if (parent.notebookTitleHeight == 0) {
		doc.write("<IMG SRC=\"images/top.png\" style=\"position:absolute; left:0px; top:0px; width:100%; height:1px\">");
	}
	
	var includeTitle   = !parent.useTitleFrame && (parent.pageNumber > 0);
	var includeBgImage = (parent.bgImageType >= 2) && (parent.bgImageName != "");
	
	if (includeTitle) {
		doc.write("<DIV class=\"titleBg\" style=\"position:relative; left:0; top:0\">");
		parent.writeTitle(doc);
		doc.write("</DIV>");
	}
	
	if (includeBgImage) {
		if (includeTitle)
			doc.write("<DIV style=\"position:relative; left:0; top:0\">");
		if (!parent.isIPhone) {
			doc.write("<img name=\"pageBgImage\" src=\"backgrounds/" + parent.bgImageName + "\" style=\"left:" + bgImageXOffset + 
					  "; top:0; z-index: -1; position:absolute; cursor:pointer\"  onclick=\"parent.gotoPage(1, -1);\"");
		}
		else {
			doc.write("<img name=\"pageBgImage\" src=\"backgrounds/" + parent.bgImageName + "\" style=\"" + bgImageSize(0) + 
					  "; z-index: -1; position:absolute; cursor:pointer\"  onclick=\"parent.gotoPage(1, -1);\"");
		}
		if (parent.pageNumber == 0) {
			doc.write(" onmousemove=\"window.status='Click to enter notebook'; return true;\"");
		}		
		doc.write(">");
	}
	
	var i = parent.selectedEntryId;
	if ((i >= 0) && (i < allEntries.length)) {
		allEntries[i].selected = true;
		allEntries[i].selectedText = parent.selectedText;
	}
	
	if (parent.pageNumber == 0) {
		doc.write("<div onclick=\"parent.gotoPage(1, -1);\" onmousemove=\"window.status='Click to enter notebook'; return true;\" style=\"width:100%; height:100%; cursor:pointer\" >");
	}
	
	doc.bgcolor = parent.pageColor;
	
	var s = "";
	for (i = 0; i < topEntries.length; i++) {
		s += topEntries[i].getHTML(0, doc);
	}
	doc.write(s);
	
	if (parent.pageNumber == 0) {
		if ((parent.showCoverTitle != 0) || (parent.showCoverRevision != 0)) {
			doc.write("<TABLE class=\"coverTitleTableStyle\">");
			if (parent.showCoverTitle != 0)
				doc.write("<TR><TD><DIV onclick=\"parent.gotoPage(1, -1);\" class=\"coverTitleStyle\">" + parent.coverText + "</DIV>");
			if (parent.showCoverRevision != 0)
				doc.write("<TR><TD><DIV onclick=\"parent.gotoPage(1, -1);\" class=\"coverRevisionStyle\">" + parent.revision + "</DIV>");
			doc.write("</TABLE>");
		}
		
		if (parent.showCoverBadge != 0) {
			if (!parent.isIPhone)
				doc.write("<DIV style=\"position:absolute; top: 85%; width: 98%; text-align: center\"><a href=\"http://www.aquaminds.com\" target=\"aminds\"><img src=\"backgrounds/badge.png\" border=0></a></div>");
			else
				doc.write("<DIV style=\"position:absolute; top: 375; width: 98%; text-align: center\"><a href=\"http://www.aquaminds.com\" target=\"_top\"><img src=\"backgrounds/badge.png\" border=0></a></div>");
		}
		doc.write("</DIV>");
	}
	
	if (includeTitle && includeBgImage) {
		doc.write("</DIV>");
	}
	
    doc.write("</BODY>");
	doc.close();
}
