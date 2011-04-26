// Copyright (c) 2002-2007 AquaMinds Software Corporation. All rights reserved.
var sectionPageNumber   = 1;
var pageNumber          = 0;
var selectedEntryId     = -1;
var selectedText        = null;
var notebookPageCount   = 1;
var notebookTitle       = "";
var notebookTitleHeight = 55;
var sectionName         = "";	           // Section name of current page
var pageName            = "";		       // Name of current page
var hasCoverPage        = 0;
var contentsValid       = 0;
var showControls        = 1;
var showCoverTitle      = 1;
var showCoverRevision   = 0;
var showCoverBadge      = 0;
var revision            = "";
var bgImageType         = -2;
var bgImageName         = "";
var bgImageWidth        = 0;
var bgImageHeight       = 0;

if (location.search.indexOf("?") == 0) {
	pageNumber = parseInt(location.search.substring(1, location.search.length));
}

if (location.hash.length > 1) {
    var hash = location.hash.substring(1, location.hash.length);
	var i = hash.indexOf("_");
	if (i < 0)
		selectedEntryId = hash;
	else {
		selectedEntryId = hash.substr(0, i);
		selectedText    = decodeURIComponent(hash.substr(i + 1));
	}
}

var appName   = window.navigator.appName.toUpperCase();
var vendor    = window.navigator.vendor ? window.navigator.vendor.toUpperCase() : "";
var isSafari  = window.navigator.userAgent.indexOf("Safari") >= 0;
var isIE      = (appName.indexOf("EXPLORER") >= 0);
var isMozilla = (!isSafari && !isIE && (appName.indexOf("NETSCAPE") >= 0) && 
				 ((vendor == "") || (vendor.indexOf("NETSCAPE") >= 0) || (vendor.indexOf("CAMINO") >= 0) || (vendor.indexOf("FIREFOX") >= 0)));
var isIPhone  = (window.navigator.platform.indexOf("iPhone") >= 0);

var useTitleFrame = !isIPhone;

// Following functions emulate the new encodeURI(), for use in older browsers
function utf8(wide) {
	var c, s;
	var enc = "";
	var i = 0;
	while(i<wide.length) {
		c= wide.charCodeAt(i++);
		// handle UTF-16 surrogates
		if (c>=0xDC00 && c<0xE000) continue;
		if (c>=0xD800 && c<0xDC00) {
			if (i>=wide.length) continue;
			s= wide.charCodeAt(i++);
			if (s<0xDC00 || c>=0xDE00) continue;
			c= ((c-0xD800)<<10)+(s-0xDC00)+0x10000;
		}
		// output value
		if (c<0x80) enc += String.fromCharCode(c);
		else if (c<0x800) enc += String.fromCharCode(0xC0+(c>>6),0x80+(c&0x3F));
		else if (c<0x10000) enc += String.fromCharCode(0xE0+(c>>12),0x80+(c>>6&0x3F),0x80+(c&0x3F));
		else enc += String.fromCharCode(0xF0+(c>>18),0x80+(c>>12&0x3F),0x80+(c>>6&0x3F),0x80+(c&0x3F));
	}
	return enc;
}

var hexchars = "0123456789ABCDEF";

function toHex(n) {
	return hexchars.charAt(n>>4)+hexchars.charAt(n & 0xF);
}

var okURIchars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.!~*'();/?:@&=+$,%";

function encodeURINew(s) {
	var s = utf8(s);
	var c;
	var enc = "";
	for (var i= 0; i<s.length; i++) {
		if (okURIchars.indexOf(s.charAt(i))==-1)
			enc += "%"+toHex(s.charCodeAt(i));
		else
			enc += s.charAt(i);
	}
	return enc;
}

function ntEncodeURI(s)
{
	if ((typeof encodeURI == "function") && !isIE) {
		// Use JavaScript built-in function
		// IE 5.5+ and Netscape 6+ and Mozilla
		if (encodeURI("a%20b").length != 5)
			// cannot use the builtin function because it is re-encoding
			return encodeURINew(s);
		else
			return encodeURI(s);
	}
	else {
		// Need to mimic the JavaScript version
		// Netscape 4 and IE 4 and IE 5.0
		return encodeURINew(s);
	}
}

function validatePageNumber(num) {
    // Make sure a new page number is within bounds
    if (num < 0) {
        num = hasCoverPage ? 0 : 1;
    }
    else if ((num == 0) && !hasCoverPage) {
        num = 1;
    }
    else if (num > notebookPageCount) {
        num = notebookPageCount;
    }
	return num;
}

function gotoPage(pageNum, entryId, text) {
    var i;
    var doPageReload;
	pageNum = parent.validatePageNumber(pageNum);
	
    // remember the previous page
    parent.document.cookie = "previousPageNumber=" + parent.pageNumber;
	
    // Set vars to new page and selected entry id
    doPageReload = (parent.pageNumber == pageNum) && (parent.selectedEntryId != entryId) && (entryId > 0);
    parent.pageNumber = pageNum;
    parent.selectedEntryId = entryId;
	parent.selectedText = text;
	
    // Change the window location to the new page
    i = location.href.indexOf("?");
	var newLoc;
	
	if (!isMozilla) {
        newLoc = ntEncodeURI((i >= 0) ? location.href.substring(0, i) : location.href)  + "?" + pageNum + ((entryId < 0) ? "" : ("#" + entryId));
    }
    else {
        newLoc = ((i >= 0) ? location.href.substring(0, i) : location.href)  + "?" + pageNum + ((entryId < 0) ? "" : ("#" + entryId));
    }
	if (text)
		newLoc += "_" + text;
	
	location.href = newLoc;
	
    if (doPageReload)
        // Force page to refresh so that selection rectangle changes
		frames[0].location.reload();
}

function prevPage() {
    gotoPage((pageNumber == (hasCoverPage ? 0 : 1)) ? notebookPageCount : (pageNumber - 1), -1);
}

function nextPage() {
    gotoPage((pageNumber == notebookPageCount) ? 1 : (pageNumber + 1), -1);
}

function go(pn, en) {
    parent.gotoPage(pn, en);
}

function prevDown(doc, isDown) {
	doc.images["Prev"].src = (isDown == true) ? "images/prev_pressed.png" : "images/prev.png";
}

function nextDown(doc, isDown) {
	doc.images["Next"].src = (isDown == true) ? "images/next_pressed.png" : "images/next.png";
}

// Global function which generates the BODY HTML for the title frame
function writeTitle(doc) {
	var s = "";

	s += "<IMG SRC=\"images/top.png\" style=\"position:absolute; left:0px; top:0px; width:100%; height:1\">";
	
	// The section name
	s += "<table VSPACE=\"0\" CELLPADDING=\"0\" CELLSPACING=\"0\" style=\"border-style: none; width: 100%\" ONMOUSEOUT=\"window.status=\'\'; return true;\">";
	s += "<TR><TD VALIGN=\"MIDDLE\">&nbsp;&nbsp;" + sectionName;
	// previous and next page buttons
	s += "<TD WIDTH=84 HEIGHT=28 ALIGN=\"MIDDLE\" VALIGN=\"MIDDLE\" NOWRAP>";
	s += "<IMG name=\"Prev\" SRC=\"images/prev.png\" BORDER=\"0\" ALIGN=\"ABSMIDDLE\"  onMouseDown=\"javascript:parent.parent.prevDown(document, true);\" onMouseUp=\"javascript:parent.parent.prevDown(document, false);\" onclick=\"javascript:parent.parent.prevPage();\" style=\"cursor:pointer\">\
<IMG name=\"Next\" SRC=\"images/next.png\" BORDER=\"0\" ALIGN=\"ABSMIDDLE\" onMouseDown=\"javascript:parent.parent.nextDown(document, true);\" onMouseUp=\"javascript:parent.parent.nextDown(document, false);\" onclick=\"javascript:parent.parent.nextPage();\" style=\"cursor:pointer\">";
	
	// page name
	s += "<TR><TD VALIGN=\"TOP\" style=\"text-indent: 20px\">" + pageName;
	
	// page number
	if (pageNumber > 0) {
		s += "<TD class=\"pageNumber\" NOWRAP ALIGN=\"CENTER\" VALIGN=\"TOP\">";
		if (!isIPhone)
			s += "Page ";
		s += (pageNumber + " of " + notebookPageCount);
	}
	s += "</table>";
	
	// add a little extra space at the bottom, then the border line
	s += "<div style=\"height: 2px\"></div><IMG SRC=\"images/divider.png\" style=\"position:absolute; bottom:0px; width:100%; height:2px\">";
	
    doc.write(s);
}

// First set all the tabs to their lowered image.  Then, if the current page has a tab, set its
// image to the raised image. If the current page has no tab image, use the current section's tab.
function updateTabs() {
	var doc = frames["tabFrame"].document;
    var i;
	var w;
	var images = doc.images;
    var n = images.length;
	var image = null;
	
    for (i = 2; i < n; i++) {
        images[i].src = images[i].name + "/tabL.png";
        images[i].border=0;
		w = images[i].width;
    }
    if (images["pages/" + pageNumber]) {
	    image = images["pages/" + pageNumber];
        image.src = "pages/" +  pageNumber + "/tabH.png";
    }
    else if (images["pages/" + sectionPageNumber]) {
	    image = images["pages/" + sectionPageNumber];
        image.src = "pages/" +  sectionPageNumber + "/tabH.png";
    }
	if (image) {
	    image.width = w - 1;
	}
}
