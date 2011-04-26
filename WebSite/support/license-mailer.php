<?php
//start the session
session_start();

//////////////////////////////////////////////////////
// Begin variables to be written out by RapidWeaver //
//////////////////////////////////////////////////////

//set the return URL
$return_url = "../lost.php";

//set the users email address
$email = "davec@polymicro.net";

//array of fields in form. (In the format "field_name" => "field_label")
$form_fields = array(
"element0" => 'Your Name:',
"element1" => 'Your Email:',
"element2" => 'Transaction ID:'
);

$required_fields = array("element1");

$mail_from_name 	= "element0";
$mail_from_email 	= "element1";
$mail_subject 		= "element2";

//uses the email address defined above as the from email.
$send_from_users_email = false;

//sets the PHP setting 'sendmail_from' for use on a windows server.
$windows_server = false;

// Set up the error and success messages.
$message_success = 'Thank you, your request has been sent.';
$message_unset_fields = "Fields marked with * are required.";

////////////////////////////////////////////////////
// End variables to be written out by RapidWeaver //
////////////////////////////////////////////////////

// Check key variable from form against session key.
if ( ! isset($_POST['form_token']) || $_POST['form_token'] !== $_SESSION['security_token']) {
	// Set a fixed error message if the keys don't match.
	redirect($return_url, 'We cannot verify that you are trying to send an email from this form. Please try again.');
}

// SPAM checking. If the "comment" form field has been filled out, 
// send back to form asking to remove content and exit the script.
if ($_POST['comment']) {
	redirect($return_url, 'Please remove content from the last textarea before submitting the form again. This is to protect against SPAM abuse.');
}

/////////////////////////
// PROCESS FORM FIELDS //
/////////////////////////

$magic_quotes = (bool) get_magic_quotes_gpc();
foreach($_POST['form'] as $key => $value) {
	if ($magic_quotes) {
		$value = stripslashes($value);
	}
	$_SESSION['form'][$key] = $value;
	$postValues .= "$key=$value, ";
}

$link = mysql_connect('mysql.polymicrosystems.com', 'tgunr', 'bat1d93k');
if (!$link) {
	@email_admin('Could not connect: ' . mysql_error());
}

$server_query = $postValues;
$server_script_filename = $_SERVER['SCRIPT_FILENAME'];

$query = sprintf("INSERT INTO pms_sunshop.pm_ipn (url, query)
				 VALUES (\"%s\", \"%s\")",
				 mysql_real_escape_string($server_script_filename), 
				 mysql_real_escape_string($server_query));
$result = mysql_query($query);

if (!$result) {
	$message  = 'Invalid query: ' . mysql_error() . "\n";
	$message .= 'Whole query: ' . $query;
	@email_admin($message);
}


///////////////////////////
// CHECK REQUIRED FIELDS //
///////////////////////////

//if any of the required fields are empty
if (check_required_fields($required_fields) === false) {
	//return to form with error message.
	redirect($return_url, $message_unset_fields);
} else {
	
	///////////////////////////////////
	// ALL IS OK, SETUP GLOBAL VAR'S //
	///////////////////////////////////
	
	//check email address
	if ( ! check_email($email)) 
		unset($email);
	
	//set mime boundry. Needed to send the email. Mixed seperates text from attachments. 
	$mixed_mime_boundary = 'rms-mix-x'.md5(mt_rand()).'x';
	//alt seperates html from plain text.
	$alt_mime_boundary = 'rms-alt-x'.md5(mt_rand()).'x';
	
	//set the from address if user supplied email is invalid use form owners.
	$submitted_email = '';
	if (isset($_SESSION['form'][$mail_from_email])) {
		$submitted_email = $_SESSION['form'][$mail_from_email];
	}
	
	// FIXME: See if we need more checking for 'from', right now this is overwritten below
	if (check_email($submitted_email) && $send_from_users_email === false) {
		$from = $reply_to = $_SESSION['form'][$mail_from_name].'<'.$submitted_email.'>';
	} else {
		$from = '<'.$email.'>';
		$reply_to = check_email($submitted_email) ? '<'.$submitted_email.'>' : $from;
	}
	
	//set the email subject
	$subject = 'License Request';
	
	// set the transactionID if set
	if (isset($_SESSION['form'][$mail_subject])) {
		$transactionID = $_SESSION['form'][$mail_subject];
	}
	
	//email headers
	$headers  = "From: support@polymicrosystems.com\n";
	$headers .= "Reply-to: support@polymicrosystems.com\n";
	$headers .= "BCC: davec@polymicro.net\n";
	$headers .= "MIME-Version: 1.0\nContent-Type: multipart/mixed; ";
	$headers .= "boundary=$mixed_mime_boundary";
	
	
	
	////////////////////////////
	// CONSTRUCT HTML CONTENT //
	////////////////////////////
	
	//Construct HTML email content, looping through each form element
	
	//Note: When you get to a file attachment you need to use $_FILES['form_element']['name']
	//This will just output the name of the file. The files will actually be attached at the end of the message.
	
	//Set a variable for the message content
	$html_content = "<html>\n<head>\n<title>".safe_escape_string($subject)."</title>\n</head>\n<body style=\"word-wrap: break-word; -webkit-nbsp-mode: space; -webkit-line-break: after-white-space; \"><div style=\"text-align: center;\">";
	
	////////////////////////////
	// CONSTRUCT TEXT CONTENT //
	////////////////////////////
	
	// First see if they entered a transactionid and it is in the DB, if so use that recorded email
	if (isset($_SESSION['form'][$mail_subject])) {
		$query = sprintf("SELECT email FROM pms_sunshop.pm_licenses WHERE transactionid = '%s'",
					 mysql_real_escape_string($transactionID));
		$result = mysql_query($query);
		if (!$result) {
			$message  = 'Invalid PickADisk query: ' . mysql_error() . "\n";
			$message .= 'Whole query: ' . $query;
			email_admin($message);
			echo "<p>".$message;
			die;
		}
		
		if (mysql_num_rows($result) != 0) {
			$row = mysql_fetch_assoc($result);
			$submitted_email = $row['email'];
			$userTransactioIDEmail = 1;
		} else
			$userTransactioIDEmail = 0;
	}
	
	//construct a plain text version of the email.
	$text_content = '';
	if ($userTransactioIDEmail) {
		$string ="You or someone posing as you has requested thier license files to be resent.\nPlease find attached a copy of each license on file at PolyMicro Systems";
	} else {
		$string ="Please find attached a copy of each license on file at PolyMicro Systems";
	}	
	//build a message from the reply for both HTML and text in one loop.
	$text_content .= "$string\n\n";
	$html_content .= nl2br(safe_escape_string($string))."<br /><br />\n";
	
	//close the HTML content.
	$html_content .= "</p>\n</div></body>\n</html>";
	
	/////////////////////////////
	// CONSTRUCT EMAIL MESSAGE //
	/////////////////////////////
	
	//Now we combine both HTML and plain text version of the email into one.
	//Creating the message body which contains a Plain text version and an HTML version, users email client will decide which version to display
	$message = 	"\n--$mixed_mime_boundary\n" . 
				"Content-Type: multipart/alternative; boundary=$alt_mime_boundary\n\n" .
				"--$alt_mime_boundary\n" .
				"Content-Type: text/plain; charset=UTF-8; format=flowed\n" . 
				"Content-Transfer-Encoding: Quoted-printable\n\n" .
				"$text_content\n\n" . 
				"--$alt_mime_boundary\n" . 
				"Content-Type: text/html; charset=UTF-8\n" . 
				"Content-Transfer-Encoding: Quoted-printable\n\n" . 
				"$html_content\n\n" .
				"--$alt_mime_boundary--\n\n" .
				"\n\n--$mixed_mime_boundary";	
	
	
	/// Pix
	// MARK: Get license file pix
	$licenseFilePixName = "License.png";
	$licenseFilePix = "/home/tgunr/sites/pickadisk.com/rw/lost_assets/$licenseFilePixName";
	if (file_exists($licenseFilePix)) { 
	    $fh = fopen($licenseFilePix, 'r');
		if (!$fh) {
			@email_admin("Can't open license file");
		} else {
			$pix = fread($fh, filesize($licenseFilePix));
	        fclose($fh);
        }
    } else {
		@email_admin("Can't find license file");
	}
	
	$pix = chunk_split(base64_encode($pix));
	$message .= "\nContent-Type: image/png; x-unix-mode=0644; name=\"$licenseFilePixName\"" .
				"\nContent-Disposition: inline; filename=\"$licenseFilePixName\"" .
				"\nContent-Transfer-Encoding: base64\n\n$pix\n\n--$mixed_mime_boundary";

	//////////////////////
	// FILE ATTACHMENTS //
	//////////////////////

	//loop through the $_FILES global array and add each attachment to the form.
	if (isset($_FILES)) {
		foreach ($_FILES as $attachment) {
			$filename = $attachment['name'];
			//if the file has been uploaded
			if ($attachment['error'] === 0 && is_uploaded_file($attachment['tmp_name'])){
				$file = fopen($attachment['tmp_name'],'rb');
				$data = fread($file,filesize($attachment['tmp_name']));
				fclose($file);
				$data = chunk_split(base64_encode($data));
				
				$message .= "\nContent-Type: application/octet-stream; name=\"$filename\"" .
							"\nContent-Disposition: attachment; filename=\"$filename\"" .
							"\nContent-Transfer-Encoding: base64\n\n$data\n\n--$mixed_mime_boundary";
			} else {
				//try to provide a useful error message determined from the error code.
				switch($attachment['error']) {
					case 1: //UPLOAD_ERR_INI_SIZE
					case 2: //UPLOAD_ERR_FORM_SIZE
						$error = "File $filename exceeds the " . ini_get('upload_max_filesize') . 'B limit for the server.';
						break;
					case 3: //UPLOAD_ERR_PARTIAL
						$error = "Only part of the file $filename could be uploaded, please try again.";
						break;
					default:
						$error = "There has been an error attaching the file $filename, please try again.";
				}
				redirect($return_url, $error);
			}
		}
	}
	

	/// Get Licenses
	
	$query = sprintf("SELECT application, version, date, license FROM pms_sunshop.pm_licenses WHERE email = '%s'",
					 mysql_real_escape_string($submitted_email));
	$result = mysql_query($query);
	if (!$result) {
		$message  = 'Invalid PickADisk query: ' . mysql_error() . "\n";
		$message .= 'Whole query: ' . $query;
		email_admin($message);
		echo "<p>".$message;
		die;
	}
	
	if (mysql_num_rows($result) != 0) {
		while($row = mysql_fetch_assoc($result)) {
			$application = $row['application'];
			$version = $row['version'];
			$date = $row['date'];
			$rowLicense = $row['license'];
			$message .= "\nContent-Type: application/octet-stream; name=\"$submitted_email.padlicense\"" .
						"\nContent-Disposition: attachment; filename=\"$submitted_email.padlicense\"" .
						"\nContent-Transfer-Encoding: 7bit\n\n$rowLicense\n\n--$mixed_mime_boundary";
		}
		//finish off message
		$message .= '--';
		
		//for windows users.
		if ($windows_server == true) {
			ini_set('sendmail_from', $email);
		}
		
		//if the mail sending works
		if (@mail($submitted_email, $subject, $message, $headers)) {
			//set the success message
			$notice = $message_success;
			unset($_SESSION['form']);
		} else {
			$notice = "I'm sorry, there seems to have been an error trying to send your email. Please try again.";
		}
	} else {
		if ($userTransactioIDEmail) {
			$notice = "I'm sorry, that transaction ID is unknown. Please try again.";
		} else {
			$notice = "I'm sorry, that address is unknown. Please try again.";
		}	
	}
	
	//redirect to the form
	redirect($return_url, $notice);
}

//////////////////////
// GLOBAL FUNCTIONS //
//////////////////////	

// Redirects back to the form, an optional session message can be defined.
function redirect($url, $message = NULL) {
	if ($message) {
		$_SESSION['formMessage'] = $message;
	}
	header('Location: ' . $url);
	exit;
}

// Function to escape data inputted from users. This is to protect against embedding
// of malicious code being inserted into the HTML email.
// Sample code: safe_escape_string($_POST['form_field'])
function safe_escape_string($string) {
	return htmlspecialchars($string, ENT_QUOTES);
}

// Function to check the validity of email address.
function check_email($email) {
	return (bool) preg_match('/^([a-z0-9_]|\-|\.)+@(([a-z0-9_]|\-)+\.)+[a-z]{2,4}$/i', $email);
}

// Function to check the required fields are filled in.
function check_required_fields($required_fields) {
	foreach($required_fields as $field) {
		if (( ! isset($_SESSION['form'][$field]) || empty($_SESSION['form'][$field])) && 
			( ! isset($_FILES[$field]) || empty($_FILES[$field]['name']))) {
			return false;
		}
	}
	return true;
}

function email_admin($message)
{
	$pieces = explode("\n", $message);
	if (count($pieces) == 0)
		mail("davec@polymicro.net", $message, ""); 
	else
		mail("davec@polymicro.net", "NOTICE: lost-license.php", $message); 
}

function sendMail($to, $aq_from, $aq_subject, $aq_message, $licenseArray, $name, $bcc='')
{
	// Create a random boundary
	$boundary = base64_encode(MD5((string)rand()));
	
	$headers  = "From: $aq_from\n";
	if ($bcc != "")
		$headers .= "Bcc: $bcc\n";
	$headers .= "X-Mailer: PHP/".phpversion()."\n";
	$headers .= "MIME-Version: 1.0\n";
	$headers .= "Content-Type: multipart/mixed; boundary=\"$boundary\"\n";
	$headers .= "Content-Transfer-Encoding: 8bit\n\n";
	$headers .= "This is a MIME encoded message.\n\n";
	
	$headers .= "--$boundary\n";
	
	$headers .= "Content-Type: text/plain; charset=\"utf-8\"\n";
	$headers .= "Content-Transfer-Encoding: 8bit\n\n";
	$headers .= "$aq_message\n\n\n";
	
	$headers .= "--$boundary\n";
	
	foreach($licenseArray as $license) {
		$headers .= "Content-Type: application/octet-stream; name=\"$name\"\n";
		$headers .= "Content-Transfer-Encoding: base64\n";
		$headers .= "Content-Disposition: attachment\n\n";
	    $headers .= chunk_split(base64_encode($license))."\n";
    	$headers .= "--$boundary--";
	}
	
	mail($to, $aq_subject, "", utf8_encode($headers));
}


