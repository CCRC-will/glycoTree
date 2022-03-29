<?php
include '../config.php';
$servername = getenv('MYSQL_SERVER_NAME');
$password = getenv('MYSQL_PASSWORD');

try {
	$par = $_GET['par'];
	$mode = $_GET['mode'];
	$par2 = $_GET['par2'];
	
	// Create connection
	$connection = new mysqli($servername, $username, $password, $dbname);

	// Check connection
	if ($connection->connect_error) {
		die("<br>Connection failed: " . $connection->connect_error);
	}
	
	$list = [];
	$numPars = 0;
	switch ($mode) {
		case "with": 
			// glycans containing $par1 AND $par3
			$numPars = 2;
			$query = "SELECT DISTINCT glytoucan_ac FROM compositions c WHERE residue_id=? AND glytoucan_ac IN (SELECT DISTINCT glytoucan_ac FROM compositions WHERE residue_id=?)";
			break;
		case "without":
			// glycans containing $par1 BUT NOT $par3
			$numPars = 2;
			$query = "SELECT DISTINCT glytoucan_ac FROM compositions c WHERE residue_id=? AND glytoucan_ac NOT IN (SELECT DISTINCT glytoucan_ac FROM compositions WHERE residue_id=?)";
			break;
		case "all":
		  $query = "SELECT DISTINCT glytoucan_ac FROM compositions";
		  break;
		case "all_N":
		  $query = "SELECT DISTINCT glytoucan_ac FROM compositions WHERE residue_id LIKE 'N%'";
		  break;
		case "mapped_N":
		  $query = "SELECT DISTINCT glytoucan_ac FROM compositions WHERE residue_id LIKE 'N%' AND glytoucan_ac NOT IN (SELECT DISTINCT glytoucan_ac FROM compositions WHERE residue_name='unassigned')";
		  break;
		case "all_O":
		  $query = "SELECT DISTINCT glytoucan_ac FROM compositions WHERE residue_id LIKE 'O%'";
		  break;
		case "mapped_O":
		  $query = "SELECT DISTINCT glytoucan_ac FROM compositions WHERE residue_id LIKE 'O%' AND glytoucan_ac NOT IN (SELECT DISTINCT glytoucan_ac FROM compositions WHERE residue_name='unassigned')";
		  break;	
		case "res":
		  $numPars = 1;
		  $query = "SELECT DISTINCT glytoucan_ac FROM compositions WHERE residue_id=?";
		  break;	
		case "sug":
		  $par2 = "%" . $par . "%";
		  $numPars = 2;
		  if ((strpos($par, "NAc") !== false) || (strpos($par, "NGc") !== false)) {
			  $query = "SELECT DISTINCT glytoucan_ac FROM compositions WHERE name=? OR residue_name LIKE ?";
		  } else {
			  // the query does not contain 'NAc' or 'NGc' so filter these out
			  $query = "SELECT DISTINCT glytoucan_ac FROM compositions WHERE (name=? OR residue_name LIKE ?) AND residue_name NOT IN (SELECT residue_name FROM compositions WHERE residue_name LIKE '%NAc%' OR residue_name LIKE '%NGc%')";	
		  }
		  break;
		default:
		  $query = "SELECT DISTINCT glytoucan_ac FROM compositions";
	}
	
	
	$stmt = $connection->prepare($query);	
	if ($numPars === 1) {
		$stmt->bind_param("s", $par);
	}
	if ($numPars === 2) {
		$stmt->bind_param("ss", $par, $par2);
	}
	$stmt->execute(); 
	$result = $stmt->get_result();
	
	while ($list_row = $result->fetch_assoc()) {
			array_push($list, $list_row);
	}
	echo json_encode($list, JSON_PRETTY_PRINT);
	
	} catch (mysqli_sql_exception $e) { 
		echo "MySQLi Error Code: " . $e->get Code() . "<br />";
		echo "Exception Msg: " . $e->getMessage();
		exit();
	}

$connection->close();

?>

