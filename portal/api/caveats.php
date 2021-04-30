<?php

include '../config.php';
$servername = getenv('MYSQL_SERVER_NAME');
$password = getenv('MYSQL_PASSWORD');

try {
	$ac = $_GET['ac'];
	// echo "<br>accession is " . $ac;

	// Create connection
	$connection = new mysqli($servername, $username, $password, $dbname);

	// Check connection
	if ($connection->connect_error) {
		$data['message'] = "<br>Connection to data base failed: " .
			$connection->connect_error;
		$OKtoGO = false;
	}
	
	$caveats = [];
	
	// get accessions that contain residues requiring other residues
	$sql = 	"SELECT glytoucan_ac,canonical_residues.residue_id,canonical_residues.residue_name,requires_residue FROM canonical_residues,compositions WHERE canonical_residues.residue_id=compositions.residue_id AND requires_residue<>''";

	$stmt = $connection->prepare($sql);

	// determine if the required residue is contained in the glycan
	$sql2 = "SELECT glytoucan_ac,residue_id FROM compositions WHERE residue_id=? AND glytoucan_ac=?"; 
	$ac = "";
	$required = "";
	$stmt2 = $connection->prepare($sql2);
	$stmt2->bind_param("ss", $required, $ac);
	
	// get the residue_name of the required residue
	$sql3 = "SELECT residue_name FROM canonical_residues WHERE residue_id=?"; 
	$stmt3 = $connection->prepare($sql3);
	$stmt3->bind_param("s", $required);
	

	$stmt->execute(); 
	$result = $stmt->get_result();
	$count = 0;
	while ($row = $result->fetch_assoc()) {
		$new_caveat = [];
		$resID = $row['residue_id'];
		$resName = $row['residue_name'];
		$required = $row['requires_residue'];
		$ac = $row['glytoucan_ac'];
		// echo "<br><br>" . $ac . ' requires ' . $required;
		$stmt2->execute(); 
		$result2 = $stmt2->get_result();
		// echo "<br>number of rows is " . $result2->num_rows;
		if ($result2->num_rows > 0) {
			// echo "<br> requirement satisfied";
		} else {
			// echo "<br> requirement NOT satisfied";
			$stmt3->execute(); 
			$result3 = $stmt3->get_result();
			while ($row3 = $result3->fetch_assoc()) {
				$reqResName = $row3['residue_name'];
			}
			$new_caveat['glytoucan_ac'] = $ac;
			$new_caveat['type'] = "required_residue_missing";
			$new_caveat['residue_id'] = $resID;
			$new_caveat['residue_name'] = $resName;
			$new_caveat['required_id'] = $required;
			$new_caveat['required_residue_name'] = $reqResName;
			$msg = $ac . " contains residue " . $resID . " (" . $resName . "), which cannot be enzymatically transferred unless residue " . $required . " (" . $reqResName . ") has been previously added. " . $ac . " does not contain " . $required . ": it is therefore either abiotic (e.g., chemically synthesized) or generated from another glycan by hydrolysis of " . $required . ".";
			$new_caveat['msg'] = $msg;
			$caveats[] = $new_caveat;
		}
	}
	
	// get data for glycans containing abiotic residues
	$sql3 = 	"SELECT glytoucan_ac,canonical_residues.residue_id,canonical_residues.residue_name,not_found_in,notes FROM canonical_residues,compositions WHERE canonical_residues.residue_id=compositions.residue_id AND notes LIKE '%abiotic%'";
	
	$stmt3 = $connection->prepare($sql3);
	$stmt3->execute(); 
	$result3 = $stmt3->get_result();
	while ($row3 = $result3->fetch_assoc()) {
		$new_caveat = [];
		$resID = $row3['residue_id'];
		$resName = $row3['residue_name'];
		$ac = $row3['glytoucan_ac'];
		$notIn = $row3['not_found_in'];
		$notes = $row3['notes'];
		$new_caveat['glytoucan_ac'] = $ac;
		$new_caveat['type'] = "abiotic_residue";
		$new_caveat['residue_id'] = $resID;
		$new_caveat['residue_name'] = $resName;
		$new_caveat['notes'] = $notes;
		$new_caveat['not_found_in'] = $notIn;
		$msg = $ac . " contains residue " . $resID . " (" . $resName . "), which has an " . $notes . ". Therefore, " . $ac . " is itself abiotic (e.g., chemically synthesized).";
		$new_caveat['msg'] = $msg;
		$caveats[] = $new_caveat;
	}
	
	// get data for glycans containing chemically inconsistent residues
	$sql4 = 	"SELECT glytoucan_ac,canonical_residues.residue_id,canonical_residues.residue_name,not_found_in,notes FROM canonical_residues,compositions WHERE canonical_residues.residue_id=compositions.residue_id AND notes LIKE '%inconsistent%'";
	
	$stmt4 = $connection->prepare($sql4);
	$stmt4->execute(); 
	$result4 = $stmt4->get_result();
	while ($row4 = $result4->fetch_assoc()) {
		$new_caveat = [];
		$resID = $row4['residue_id'];
		$resName = $row4['residue_name'];
		$ac = $row4['glytoucan_ac'];
		$notIn = $row4['not_found_in'];
		$notes = $row4['notes'];
		$new_caveat['glytoucan_ac'] = $ac;
		$new_caveat['type'] = "chemically_inconsistent";
		$new_caveat['residue_id'] = $resID;
		$new_caveat['residue_name'] = $resName;
		$new_caveat['notes'] = $notes;
		$new_caveat['not_found_in'] = $notIn;
		$msg = $ac . " contains residue " . $resID . " (" . $resName . "), which is " . $notes . ". Therefore, " . $ac . " is itself " . $notes . ".";
		$new_caveat['msg'] = $msg;
		$caveats[] = $new_caveat;
	}

	// get data for glycans that are taxonomically limited	
	$sql5 = 	"SELECT glytoucan_ac,canonical_residues.residue_id,canonical_residues.residue_name,limited_to,notes FROM canonical_residues,compositions WHERE canonical_residues.residue_id=compositions.residue_id AND limited_to<>''";
	
	$stmt5 = $connection->prepare($sql5);
	$stmt5->execute(); 
	$result5 = $stmt5->get_result();
	while ($row5 = $result5->fetch_assoc()) {
		$new_caveat = [];
		$resID = $row5['residue_id'];
		$resName = $row5['residue_name'];
		$ac = $row5['glytoucan_ac'];
		$limitedTo = $row5['limited_to'];
		$notes = $row5['notes'];
		$new_caveat['glytoucan_ac'] = $ac;
		$new_caveat['type'] = "taxonomically_limited";
		$new_caveat['residue_id'] = $resID;
		$new_caveat['residue_name'] = $resName;
		$new_caveat['notes'] = $notes;
		$new_caveat['limited_to'] = $limitedTo;
		$msg = $ac . " contains residue " . $resID . " (" . $resName . "), which is limited to " . $limitedTo . " (" . $notes . "). Therefore, " . $ac . " is itself limited to " . $limitedTo . ".";
		$new_caveat['msg'] = $msg;
		$caveats[] = $new_caveat;
	}
	
	$data['caveats'] = $caveats;
	echo json_encode($data, JSON_PRETTY_PRINT);


} catch (mysqli_sql_exception $e) { 
	echo "MySQLi Error Code: " . $e->getCode() . "<br />";
	echo "Exception Msg: " . $e->getMessage();
	exit();
}

$connection->close();

?>