<?php

$servername = "localhost";
$username = "gt_user";
$password = "gobbledygoo";
$dbname = "glycotree";

try {
	$accession = $_GET['ac'];
	$type = $_GET['type'];
	
	// Create connection
	$connection = new mysqli($servername, $username, $password, $dbname);

	// Check connection
	if ($connection->connect_error) {
		die("<br>Connection failed: " . $connection->connect_error);
	}	
	
} catch (mysqli_sql_exception $e) { 
	echo "MySQLi Error Code: " . $e->getCode() . "<br />";
	echo "Exception Msg: " . $e->getMessage();
	exit();
}
$connection->close();

?>