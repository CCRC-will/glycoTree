<?php

$servername = "localhost";
$username = "gt_user";
$password = "gobbledygoo";
$dbname = "glycotree";

$edges = [];


function getDP($accession, $connection) {
	$sql = "SELECT COUNT(*) AS num FROM compositions WHERE glytoucan_ac=? ";
	$stmt = $connection->prepare($sql);
	$stmt->bind_param("s", $accession);
	$stmt->execute(); 
	$result = $stmt->get_result();
	$row = $result->fetch_assoc(); 
	$dp = $row["num"];
	return $dp;
}

function getRE($accession, $residue_id, $connection) {
  // generate a string representing the reducing end structure of the glycan
  //   for a particular type of glycan, the reducing-end residue will have a 
  //     specific $residue_id; e.g., for N-glycans, $residue_id is 'NA'
  $reducing_end_structure = "";
  $sql = "SELECT anomer, absolute, name, ring from compositions WHERE glytoucan_ac=?  AND residue_id=?";
	$stmt = $connection->prepare($sql);
	$stmt->bind_param("ss", $accession, $residue_id);
	$stmt->execute(); 
	$result = $stmt->get_result();
  $row = $result->fetch_assoc();
	$sep = "";
  foreach ($row as $value) {
	  $reducing_end_structure = $reducing_end_structure . $sep . $value;
	  $sep = "-";
  }
  return $reducing_end_structure;
}

function getPrecursors($accession, $connection) {
	$precursors = [];
	$sql = "SELECT homolog FROM correlation WHERE glytoucan_ac=? AND relative_dp=-1";
	$stmt = $connection->prepare($sql);
	$stmt->bind_param("s", $accession);
	$stmt->execute(); 
	$result = $stmt->get_result();
	$count = 0;
	while ($row = $result->fetch_assoc()) {
		$precursors[$count] = $row['homolog'];
		$count++;
	}
	return $precursors;
}


function edgeExists($edge_array, $child_node, $parent_node) {
	// $edge_array is an array of arrays
	foreach ($edge_array as $value) {
		if (($value['product'] == $child_node) && ($value['precursor'] == $parent_node)) {
			return 1;
		}
	}
	return 0;
}


function addEdge(&$edge_array, $child_node, $parent_node) {
	 // later include residue_added, enzymes[]
	$edge = array(
	 	"product" => $child_node,
	 	"precursor" => $parent_node
	);
	$edge_array[] = $edge;
}

// recursive traversal ($end to $start) of multiple pathways
//   traversal direction is opposite that of pathway direction
// return values propagate back to original $end node
// $end is the id of the traversal initiator (end of pathway)
// $start is the id of the traversal terminus (start of pathway)
// $globalRE is a string describing the reducing end structure common to all nodes
// $startDP is the number of residues in the traversal terminus (start of pathway)
// $rid is the canonical residue_id of the reducing end of each node
//   $rid = "NA" for N-glycans
// $edge_array is passed by reference so it can be appended at each recursion level
function pathDAG($end, $start, $globalRE, $startDP, $rid, &$edge_array, $connection) {

	$re = getRE($end, $rid, $connection);
	// do not use accessions with non-matching reducing ends
	if ($globalRE != $re) return 0; 
	
	// if $start has been reached; success, but do not continue traversal
	if ($end == $start) return 1;
	
	// $startDP has been reached, but ($end != $start); dead end
	if ($startDP == getDP($end, $connection)) return 0;
	
	// $success if at least one edge connecting $end to a potential precursor
	//   is made or already exists;  $success set to 1 if one of these criteria is met
	$success = 0; 
   
	// fetch all potential precursors of $end
	$precursors = getPrecursors($end, $connection);
	foreach ($precursors as $key => $value) {
		$new_end = $precursors[$key];
		// echo "end is " . $end . " and new_end is " . $new_end;
		// check if edge connecting $end and $new_end exists
		if (edgeExists($edge_array, $end, $new_end) == 0) {
			// edge does not exist
			$outcome = pathDAG($new_end, $start, $globalRE, $startDP, $rid, $edge_array, $connection);
			if ($outcome == 1) {
				// must pass $edge_array by reference to modify it
				addEdge($edge_array, $end, $new_end); 
				$success = 1;
			}
		} else {
			// edge exists
			$success = 1;
		}
	}

	return $success;
}


try {
	$end = $_GET['end'];
	$start = $_GET['start'];

	// Create connection
	$connection = new mysqli($servername, $username, $password, $dbname);

	// Check connection
	if ($connection->connect_error) {
		die("<br>Connection failed: " . $connection->connect_error);
	}
	
	// echo "end is " . $end . "\n";
	// echo "start is " . $start . "\n";

	$rid = "NA";
	$reEnd = getRE($end, $rid, $connection);
	$reStart = getRE($start, $rid, $connection);
	// echo "end reducing structure is " . $reEnd . "\n";
	// echo "start reducing structure is " . $reStart . "\n";
	if ($reEnd != $reStart) {
		echo 
		die ("Reducing ends do not match, so no pathway can be traversed\n");
	}
	
	$endDP = getDP($end, $connection);
	// echo "end DP is " . $endDP . "\n";
	$startDP = getDP($start, $connection);
	// echo "start DP is " . $startDP . "\n";
	if ($startDP > $endDP) {
		echo 
		die ("Start DP is greater than end DP - cannot yet generate a biosynthetic pathway from large to small\n");
	}	
	
	$edges = [];
	
	pathDAG($end, $start, $reEnd, $startDP, $rid, $edges, $connection);
	echo json_encode($edges, JSON_PRETTY_PRINT);
	
} catch (mysqli_sql_exception $e) { 
	echo "MySQLi Error Code: " . $e->getCode() . "<br />";
	echo "Exception Msg: " . $e->getMessage();
	exit();
}



$connection->close();

?>