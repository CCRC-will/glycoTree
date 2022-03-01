<?php
include '../config.php';
include 'glycanCommon.php';

$servername = getenv('MYSQL_SERVER_NAME');
$password = getenv('MYSQL_PASSWORD');

$jsonData = $_GET['json_data'];

$submittedData = json_decode($jsonData, true);

$curator_id = $submittedData['curator'];
echo "\ncurator is '" . $curator_id . "'";
$curator_pw = $submittedData['curator_pw'];
echo "\ncurator pw is '" . $curator_pw . "'";

// Create connection
$connection = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($connection->connect_error) {
	die("<br>Connection failed: " . $connection->connect_error);
}

// initialize parameters
$rule_id = 0;
$focus = "";
$agent = "";
$factor_1 = "";
$factor_2 = "";
$taxonomy = "";
$curator_id = "";
$refs = "";
$comment = "";
$status = "proposed";

$query = "INSERT INTO rule_data (rule_id, focus, agent, factor_1, factor_2, taxonomy, curator_id, refs, comment, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
$stmt = $connection->prepare($query);
$stmt->bind_param("isssssssss", $rule_id, $focus, $agent, $factor_1, $factor_2, $taxonomy, $curator_id, $refs, $comment, $status);

for ($i = 0; $i < sizeof($submittedData['data']); $i++ ) {
	echo "\n\n";
	$rule_id = 1 * $submittedData['data'][$i]['rule_id'];
	echo "\n  rule id is " . $rule_id; 
	$focus = $submittedData['data'][$i]['focus'];
	echo "\n  focus is '" . $focus . "'"; 
	$agent = $submittedData['data'][$i]['agent'];
	echo "\n  agent is '" . $agent . "'"; 
	$factor_1 = $submittedData['data'][$i]['factor_1'];
	echo "\n  factor_1 is '" . $factor_1 . "'"; 
	$factor_2 = $submittedData['data'][$i]['factor_2'];
	echo "\n  factor_2 is '" . $factor_2 . "'"; 
	$taxonomy = $submittedData['data'][$i]['taxonomy'];
	echo "\n  taxonomy is '" . $taxonomy . "'"; 
	$refs = $submittedData['data'][$i]['refs'];
	echo "\n  refs is '" . $refs . "'"; 
	$comment = $submittedData['data'][$i]['comment'];
	echo "\n  comment is '" . $comment . "'"; 
		
	if ($stmt->execute()) {
			echo "\n\nNew record created successfully";
		} else {
			echo "\n\nUnable to create record";
		}
}

$connection->close();

?>
