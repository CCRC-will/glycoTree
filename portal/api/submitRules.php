<?php
include '../config.php';
include 'glycanCommon.php';

$servername = getenv('MYSQL_SERVER_NAME');
$password = getenv('MYSQL_PASSWORD');
$uSugar = getenv('SUGAR');
$uSpice = 1 * getenv('SPICE'); 

$jsonData = $_GET['json_data'];

$submittedData = json_decode($jsonData, true);

$curator_id = strtolower($submittedData['curator']); //case insensitive
$curator_pw = $submittedData['curator_pw']; // case sensitive
$combo = "$curator_pw/$curator_id";

// Create connection
$connection = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($connection->connect_error) {
	die("<br>Connection failed: " . $connection->connect_error);
}


// authentication
$h1 = "none";
$query = "SELECT * FROM curators WHERE id=?";
$stmt = $connection->prepare($query);
$stmt->bind_param("s", $curator_id);
$stmt->execute(); 
$result = $stmt->get_result();
if ($result->num_rows == 1) { // exactly one row (index = 0) per id
	$h1 = $result->fetch_assoc()['auth'];
}

$h2 = hash_pbkdf2("sha256", $combo, $uSugar, $uSpice, 32);

if ($h1 != $h2) {
	die("Authentication Failure!\n\nPlease check your curator id ($curator_id) and password (******)");
}

// initialize rule parameters
$rule_id = 0;
$focus = "";
$enzyme = "";
$other_residue = "";
$polymer = "";
$taxonomy = "";
$refs = "";
$comment = "";
$status = "proposed";



$query = "INSERT INTO rule_data (rule_id, focus, enzyme, other_residue, polymer, taxonomy, curator_id, refs, comment, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
$stmt = $connection->prepare($query);
$stmt->bind_param("isssssssss", $rule_id, $focus, $enzyme, $other_residue, $polymer, $taxonomy, $curator_id, $refs, $comment, $status);


	echo "\ncurator: '" . $curator_id . "'";
	$rule_id = 1 * $submittedData['data']['rule_id'];
	echo "\n  rule id: " . $rule_id; 
	$focus = $submittedData['data']['focus'];
	echo "\n  focus: '" . $focus . "'"; 
	$enzyme = $submittedData['data']['enzyme'];
	echo "\n  enzyme: '" . $enzyme . "'"; 
	$other_residue = $submittedData['data']['other_residue'];
	echo "\n  other_residue: '" . $other_residue . "'"; 
	$polymer = $submittedData['data']['polymer'];
	echo "\n  polymer: '" . $polymer . "'"; 
	$taxonomy = $submittedData['data']['taxonomy'];
	echo "\n  taxonomy: '" . $taxonomy . "'"; 
	$refs = $submittedData['data']['refs'];
	echo "\n  refs: '" . $refs . "'"; 
	$comment = $submittedData['data']['comment'];
	echo "\n  comment: '" . $comment . "'"; 
	echo "\n  status: '" . $status . "'"; 
		
	if ($stmt->execute()) {
		echo "\n\nNew record created successfully";
	} else {
		echo "\n\nUnable to create record";
	}


$connection->close();

?>
