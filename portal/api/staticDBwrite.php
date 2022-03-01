<?php
include '../config.php';
include 'glycanCommon.php';

$servername = getenv('MYSQL_SERVER_NAME');
$password = getenv('MYSQL_PASSWORD');

// Create connection
$connection = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($connection->connect_error) {
	die("Connection failed: " . $connection->connect_error);
}

echo "<pre>";
$query = "SELECT * FROM rule_data";
echo "\n\nSELECT query:\n  " . $query;
$stmt = $connection->prepare($query);
$stmt->execute(); 
$result = $stmt->get_result();

if ( ($result->num_rows) > 0) {
	echo "\n\nDB is read-accessible by PHP, first record returned from Table 'rule_data':\n";
	$row = $result->fetch_assoc();
	print_r($row);
} else {
	echo "\n\nDB is NOT read-accessible by PHP";
}

$query = "INSERT INTO rule_data (rule_id, focus) VALUES (1, 'N84')";
echo "\n\nINSERT query:\n  " . $query;
$stmt = $connection->prepare($query);
if ($stmt->execute()) {
	echo "\nNew (static) record created successfully";
} else {
	echo "\nUnable to create (static) record";
}

$query = "INSERT INTO rule_data (rule_id, focus, agent, factor_1, factor_2, taxonomy, curator_id, refs, comment, status) VALUES (1, 'N84', 'EEE', 'f1', 'f2', 'tax', 'cid', 'rrr', 'ccc', 'test')";
echo "\n\nINSERT query:\n  " . $query;
$stmt = $connection->prepare($query);
if ($stmt->execute()) {
	echo "\nNew (static) record created successfully";
} else {
	echo "\nUnable to create (static) record";
}


$query = "SELECT * FROM `rule_data` WHERE `focus`='N84'";
echo "\n\nPost-INSERT SELECT query:\n  " . $query . "\n";
$stmt = $connection->prepare($query);
$stmt->execute(); 
$result = $stmt->get_result();
if ( ($result->num_rows) > 0) { 
	while ($row = $result->fetch_assoc()) {
		print_r($row);
	}
} else {
	echo "No results returned for focus = 'N84'";
}

$query = "SELECT * FROM `rule_data` WHERE `focus`='N201'";
echo "\n\nPost-INSERT SELECT query:\n  " . $query . "\n";
$stmt = $connection->prepare($query);
$stmt->execute(); 
$result = $stmt->get_result();
if ( ($result->num_rows) > 0) { 
	while ($row = $result->fetch_assoc()) {
		print_r($row);
	}
} else {
	echo "No results returned for focus = 'N201'";
}

echo "</pre>";

$connection->close();

?>
