<?php
include '../config.php';

$servername = getenv('MYSQL_SERVER_NAME');
$password = getenv('MYSQL_PASSWORD');


// Create connection
$connection = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($connection->connect_error) {
	die("Connection failed: " . $connection->connect_error);
}

$updates = [];
$updates['proposed'] = [];
$query = "SELECT * FROM `rule_data` WHERE (`status`='proposed')";
$stmt = $connection->prepare($query);
$stmt->execute(); 
$result = $stmt->get_result();
if ( ($result->num_rows) > 0) { 
	while ($row = $result->fetch_assoc()) {
		array_push($updates['proposed'], $row);
	}
}

$updates['disputed'] = [];
$query = "SELECT * FROM `rule_data` WHERE (`status`='disputed')";
$stmt = $connection->prepare($query);
$stmt->execute(); 
$result = $stmt->get_result();
if ( ($result->num_rows) > 0) { 
	while ($row = $result->fetch_assoc()) {
		array_push($updates['disputed'], $row);
	}
}

$updates['rule_defs'] = [];
$query = "SELECT * FROM `rules`";
$stmt = $connection->prepare($query);
$stmt->execute(); 
$result = $stmt->get_result();
if ( ($result->num_rows) > 0) { 
	while ($row = $result->fetch_assoc()) {
		$index = $row['rule_id'];
		$updates['rule_defs'][$index] = $row;
	}
}

header("Cache-Control: no-cache, must-revalidate");
header('Content-Type: application/json; charset=utf-8');
echo json_encode($updates, JSON_PRETTY_PRINT);

?>
