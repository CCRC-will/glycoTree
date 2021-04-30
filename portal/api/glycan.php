<?php
include '../config.php';
$servername = getenv('MYSQL_SERVER_NAME');
$password = getenv('MYSQL_PASSWORD');
// $caveats = [];
	
function generateCaveats($resList, $accession, $connection) {
	// generate caveat objects and put into array $caveats
	$caveats = [];
	// get the residue_name of a required canonical residue
	$required = "";
	$required_query = "SELECT residue_name FROM canonical_residues WHERE residue_id=?"; 
	$required_stmt = $connection->prepare($required_query);
	$required_stmt->bind_param("s", $required);
	// find residue annotations that require caveats
	foreach ($resList as $value)  {
		$resID = $value['residue_id'];
		$resName = $value['residue_name'];
		// make sure variables are not inappropriately set
		$limitedTo = "";
		$required = "";
		$notIn = "";

		// echo "<br>" . $resName . " (" . $resID . ")"; 
		// check for required residues and generate caveats
		$newCaveat = [];
		if (!empty($value['requires_residue'])) {
			$required = $value['requires_residue'];
			$satisfied = false;
			// echo " requires residue " . $required;
			foreach ($resList as $present)  {
				// echo " - test " . $present['residue_id'];
				if ($present['residue_id'] == $required) {
					$satisfied = true;
				}
			}
			if (!$satisfied) {
				$required_stmt->execute(); 
				$required_result = $required_stmt->get_result();
				while ($reqRow = $required_result->fetch_assoc()) {
					$reqResName = $reqRow['residue_name'];
				}
				// echo ", which is absent with name " . $reqResName;
				$newCaveat['type'] = "required_residue_missing";
				$newCaveat['residue_id'] = $resID;
				$newCaveat['residue_name'] = $resName;
				$newCaveat['required_id'] = $required;
				$newCaveat['required_residue_name'] = $reqResName;
				$msg = $accession . " contains residue " . $resID .
					" (" . $resName .
					"), which cannot be enzymatically transferred unless residue " .
					$required . " (" . $reqResName .
					") has been previously added. " .
					$accession . " does not contain " . $required .
					", so it is either abiotic (e.g., chemically synthesized) or generated from another glycan by hydrolysis of " .
					$required . ".";
				$newCaveat['msg'] = $msg;
				$caveats[] = $newCaveat;
			}
		}
		// check for abiotic residues and generate caveats
		$newCaveat = [];
		$notes = $value['notes'];
		$notIn = $value['not_found_in'];
		// echo "<br> checking notes: " . $notes;
		if (strrpos($notes, 'abiotic') !== false) {
			// echo " found abiotic residue";
			$newCaveat['type'] = "abiotic_residue";
			$newCaveat['residue_id'] = $resID;
			$newCaveat['residue_name'] = $resName;
			$newCaveat['notes'] = $notes;
			//$newCaveat['limited_to'] = "";
			$newCaveat['not_found_in'] = $notIn;
			$msg = $accession . " contains residue " . $resID .
				" (" . $resName . "), which has an " . $notes .
				". Therefore, " . $accession .
				" is itself abiotic (e.g., chemically synthesized).";
			$newCaveat['msg'] = $msg;
			$caveats[] = $newCaveat;
		}
		// check for chemically inconsistent residues
		$newCaveat = [];
		if (strrpos($notes, 'inconsistent') !== false) {
			// echo " - found chemically inconsistent residue";
			$newCaveat['type'] = "chemically_inconsistent";
			$newCaveat['residue_id'] = $resID;
			$newCaveat['residue_name'] = $resName;
			$newCaveat['notes'] = $notes;
			$newCaveat['not_found_in'] = $notIn;
			$msg = $accession . " contains residue " . $resID .
				" (" . $resName . "), which is " . $notes .
				". Therefore, " . $accession . " is itself " .
				$notes . ".";
			$newCaveat['msg'] = $msg;
			$caveats[] = $newCaveat;
		}

		// check whether glycan is taxonomically limited
		$newCaveat = [];
		if (!empty($value['limited_to'])) {
			$limitedTo = $value['limited_to'];
			// echo " - glycan is taxonomically lmited";
			$newCaveat['type'] = "taxonomically_limited";
			$newCaveat['residue_id'] = $resID;
			$newCaveat['residue_name'] = $resName;
			$newCaveat['notes'] = $notes;
			$newCaveat['limited_to'] = $limitedTo;
			$msg = $accession . " contains residue " . $resID .
				" (" . $resName . "), which is limited to " .
				$limitedTo . " (" . $notes . "). Therefore, " .
				$accession . " is itself limited to " .
				$limitedTo . ".";
			$newCaveat['msg'] = $msg;
			$caveats[] = $newCaveat;
		}
		$newCaveat = [];
		// echo "<br> caveats has " . count($caveats) . " elements";
	}
	// echo "<br><br>";
	return $caveats;
}  // end of function generateCaveats


function sortCustom($arr, $column, $cmp) {
// sort associative array by column value using comparator '$cmp'
		$column_array  = array_column($arr, $column);
		// no ascending or descending - order depends entirely on $cmp
		uasort($column_array, $cmp);
		$i = 0;
        foreach ($column_array as $key => $value)  {
			// echo "$key $value; "; 
			$sorted_array[$i] = $arr[$key];
			$i++;
		}
	return $sorted_array;
}


function gtree_comparator($a, $b) {
//  custom comparator for sorting glycoTree residue_id values
//	  - first both non-numeric (e.g., 'NA' - 'NC')  order lexically
//	  - next both partially numeric (e.g., 'N31' - 'N324') order numerically
//	  - last both numeric (e.g., '17' - '12') order numerically
//	  - for mixed numeric and partially numeric (e.g., 'N5' - '35') put numeric last

	preg_match('/[A-Z]/', $a, $matches, PREG_OFFSET_CAPTURE);
	$ap = $matches[0][1]; // position of [A-Z] in $a, NULL if not found
	$ac = (!is_null($ap)); // boolean, true if contains [A-Z]
	
	preg_match('/[A-Z]/', $b, $matches, PREG_OFFSET_CAPTURE);
	$bp = $matches[0][1]; // position of [A-Z] in $a, NULL if not found
	$bc = (!is_null($bp)); // boolean, true if contains [A-Z]

	//get the numeric parts $an and $bn
	$an = $a;
	$bn = $b;
	if ($ac) { // $a is canonical
		// reset $an only if $a contains a numeric substring
		preg_match('/[0-9]/', $a, $matches, PREG_OFFSET_CAPTURE);
		if (!is_null($matches[0][1])) $an = (int) substr($a, $ap+1);
	}
	if ($bc) { // $b is canonical
		// reset $bn only if $b contains a numeric substring
		preg_match('/[0-9]/', $b, $matches, PREG_OFFSET_CAPTURE);
		if (!is_null($matches[0][1])) $bn = (int) substr($b, $bp+1);
	}
	
	// exactly one of the two is numeric
	if ( (!$ac || !$bc ) && ( $ac || $bc ) ) { 
			return -1 * strcmp($a, $b);
	}

	// both contain [A-Z] or both are numeric
	if ($an == $bn) {
		return 0;
	}
	return ($an < $bn) ? -1 : 1;
	
}

try {
	$accession = $_GET['ac'];
	$type = $_GET['type'];
	// Create connection
	$connection = new mysqli($servername, $username, $password, $dbname);

	// Check connection
	if ($connection->connect_error) {
		die("<br>Connection failed: " . $connection->connect_error);
	}	
	
	if (strcmp($type, "svg") == 0) {
		$filePath = '../svg/' . $accession . '.gTree.svg';
		$svgData = file_get_contents($filePath);
		echo $svgData;
	}
	
	if (strcmp($type, "json") == 0) {
		// generate an associative array 'glycan' that holds the hierarchical data
		//    for the glycan with a specific glytoucan_ac value
		$glycan = [];
		$glycan["glytoucan_ac"] = $accession;

		
		// although the following is relatively succinct, 
		//    it ignores rows in compositions where residue_id is not canonical
		// $sql = "SELECT compositions.residue_id,compositions.name,compositions.anomer,compositions.absolute,compositions.ring,compositions.parent_id,compositions.site,compositions.form_name,compositions.glycoct_index,canonical_residues.residue_name,limited_to,not_found_in,requires_residue,blocked_by_residue,notes,evidence,comment FROM compositions,canonical_residues WHERE glytoucan_ac=? AND compositions.residue_id=canonical_residues.residue_id ORDER BY residue_id";

		// get canonical residue info from compositions
		$comp_query = "SELECT residue_id,name,anomer,absolute,ring,parent_id,site,form_name,glycoct_index FROM compositions WHERE glytoucan_ac=?";
		$comp_stmt = $connection->prepare($comp_query);	
		$comp_stmt->bind_param("s", $accession);
		$comp_stmt->execute(); 
		$comp_result = $comp_stmt->get_result();

		// get cannonical residue annotations from canonical_residues
		$canon_query = "SELECT residue_name,limited_to,not_found_in,requires_residue,blocked_by_residue,notes,evidence,comment FROM canonical_residues WHERE residue_id=?";
		$canon_stmt = $connection->prepare($canon_query);
		$canon_stmt->bind_param("s", $resid);

		// get enzyme information for residues from enzyme_mappings
		$map_query = "SELECT type,orthology_group,uniprot,protein_refseq,dna_refseq,gene_name,gene_id,species,required_residues,blocking_residues,notes,branch_site_specificity FROM enzyme_mappings WHERE residue_id=?";
		$map_stmt = $connection->prepare($map_query);
		$map_stmt->bind_param("s", $resid);

		// get biosynthetically related glycans from correlation
		$match_query = "SELECT homolog,relative_dp,shared FROM correlation WHERE glytoucan_ac=?";
		$match_stmt = $connection->prepare($match_query);
		$match_stmt->bind_param("s", $accession);
		
		$residues = [];
		while ($row = $comp_result->fetch_assoc()) {
			$enzymes = [];
			$homologs = [];
			$resid = $row["residue_id"];
			$fullrow = $row;

			// query canonical_residues using the current residue_id
			$canon_stmt->execute(); 
			$canon_result = $canon_stmt->get_result();
			if ( ($canon_result->num_rows) > 0) {
				$canon_row = $canon_result->fetch_assoc();
				$fullrow = array_merge($row, $canon_row);
			}

			// query enzyme_mappings using the current residue_id
			$map_stmt->execute(); 
			$map_result = $map_stmt->get_result();
			while ($map_row = $map_result->fetch_assoc()) {
				array_push($enzymes, $map_row);
			}
			$fullrow["enzymes"] = $enzymes;

			array_push($residues, $fullrow);

			// query correlations using the glytoucan_ac
			$match_stmt->execute(); 
			$match_result = $match_stmt->get_result();
			while ($match_row = $match_result->fetch_assoc()) {
				array_push($homologs, $match_row);
			}
		}

		$caveats = generateCaveats($residues, $accession, $connection);

		// array sort by column value using custom comparator
		// $sorted = $residues;
		$sorted = sortCustom($residues, 'residue_id', 'gtree_comparator');
		$glycan["residues"] = $sorted;
		$glycan["related_glycans"] = $homologs;
		$glycan["caveats"] = $caveats;
		echo json_encode($glycan, JSON_PRETTY_PRINT);
	}

} catch (mysqli_sql_exception $e) { 
	echo "MySQLi Error Code: " . $e->getCode() . "<br />";
	echo "Exception Msg: " . $e->getMessage();
	exit();
}

$connection->close();

?>
