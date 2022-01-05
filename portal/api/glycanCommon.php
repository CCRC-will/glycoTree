<?php

function checkRE($value) {
	if ( ($value['anomer'] === "b")  && ($value['absolute'] === "D") &&
	($value['ring'] === "p") ) {
		return true;
	}
	return false;
}

function getFeatures($resList, $accession, $homologs, $connection) {
	// generate caveat objects and put into array $caveats

	$caveats = [];
	// get the residue_name of a required canonical residue
	$required = "";
	$required_query = "SELECT residue_name FROM canonical_residues WHERE residue_id=?"; 
	$required_stmt = $connection->prepare($required_query);
	$required_stmt->bind_param("s", $required);
	// find residue annotations that require caveats
	$N2 = false;
	$N19 = false;
	$N20 = false;
	$fullyDefined = true;
	$matchRE = false;
	foreach ($resList as $value)  {
		// reinitialize eCaveats for each residue;
		$eCaveats = [];
		$resID = $value['residue_id'];
		if ($resID === 'N2') $N2 = true;
		if ($resID === 'N19') $N19 = true;
		if ($resID === 'N20') $N20 = true;
		// temporarily check to make sure reducing end is b-D-...p (N-glycan)
		//   more extensive and general logic to be added later
		if ($resID === 'NA') {
			$matchRE = checkRE($value);
		}
		
		$resName = $value['residue_name'];
		// make sure variables are not inappropriately set
		$limitedTo = "";
		$required = "";
		$notIn = "";

		// echo $resName . " (" . $resID . ")<br>";
		
		if (!isset($resName)) {
			$fullyDefined = false;
		  // echo "Variable 'resName' is not set.<br>";
		}
		
		// check for required residues and generate caveats
		$newCaveat = [];
		$e = $value['enzymes'];
		// echo("resid " . $resID . " has " . sizeOf($e) . " enzymes<br>");
		$requirement = false;
		$geneName = [];
		$reqRes = [];
		$reqResName = [];
		foreach ($e as $eVal)  {
			$g = $eVal['gene_name'];
			$s = $eVal['species'];
			//echo("   uniprot: " . $u . "; requires " . $eVal['requires_residue'] . "<br>");
			
			if (!empty($eVal['requires_residue'])) {
				$required = $eVal['requires_residue'];
				$satisfied = false;
				// echo " requires residue " . $required;
				foreach ($resList as $present)  {
					// echo " - test " . $present['residue_id'];
					if ($present['residue_id'] == $required) {
						$satisfied = true;
					}
				}
				if ($satisfied) {
					$consensus = false;
				} else {
					$requirement = true;
					// add gene names and required residues to arrays
					$geneName[] = $g;
					$species[] = $s;
					$reqRes[] = $required;
					// add required residue name to array
					$required_stmt->execute(); 
					$required_result = $required_stmt->get_result();
					while ($reqRow = $required_result->fetch_assoc()) {
						$reqResName[] = $reqRow['residue_name'];
					}
				}
			}
		}
		if ($requirement) {
			$newCaveat['type'] = "required_residue_missing";
			$newCaveat['residue_id'] = $resID;
			$newCaveat['residue_name'] = $resName;
			$newCaveat['species'] = $s;
			$newCaveat['gene_name'] = $geneName;
			$newCaveat['required_residues'] = $reqRes;
			$newCaveat['required_residue_names'] = $reqResName;
			$msg = $accession . " contains residue " . $resID .
				" (" . $resName .
				"). To transfer " . $resID . ", ";
				$sep = "";
			$aSize = sizeOf($geneName);
				for ($i = 0; $i < $aSize; $i++) {
					if ($i > 0) $sep = ", ";
					if ($i == $aSize - 1) $sep = ", and ";
					$msg = $msg . $sep . "the " . $species[$i] . " " . $geneName[$i] . " enzyme requires " . $reqRes[$i] . " (" . $reqResName[$i] . ")";
				}
				$msg = $msg . ". " .
				$accession . " does not contain a required residue, so this glycan is either abiotic (e.g., chemically synthesized), synthesized by a pathway that does not require any of the listed enzymes, or generated from another glycan by hydrolysis of the required residue.";
			$newCaveat['msg'] = $msg;
			// echo($msg . "<br>");
			// the following line does NOT account for enzyme consensus
			$caveats[] = $newCaveat;					
			// add enzyme caveat only if there is consensus among enzymes for the residue
			// $eCaveats[] = $newCaveat;
			/* code for consensus of enzyme requirements
			if ($consensus) {
				$tempCaveats = array_merge($caveats, $eCaveats);
				$caveats = $tempCaveats;
			}
			*/
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
				" is itself abiotic (e.g., chemically synthesized or mis-characterized).";
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
				$notes . " (likely mis-characterized).";
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
	$features['caveats'] = $caveats;

	return $features;
}  // end of function getFeatures()


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
	preg_match('/[A;-Z]/', $a, $matches, PREG_OFFSET_CAPTURE);
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
		if (!is_null($matches)) $an = (int) substr($a, $ap+1);
	}
	if ($bc) { // $b is canonical
		// reset $bn only if $b contains a numeric substring
		preg_match('/[0-9]/', $b, $matches, PREG_OFFSET_CAPTURE);
		if (!is_null($matches)) $bn = (int) substr($b, $bp+1);
		// TODO: fix the above line, which causes php to log a 'Notice'
		//    Undefined offset   or 
		//    Trying to access array offset on value of type null
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

// the functions doQuery() and queryComposition() allow composition Object to be retrieved from the DB
// when the composition Object is generated by another method, queryComposition is not called
function doQuery($q, $con, $types, ...$params) {
	//  execute a mysql query with a variable number of arguments
	$stmt = $con->prepare($q);	
	$stmt->bind_param($types, ...$params);
	$stmt->execute(); 
	$result = $stmt->get_result();
	return ($result);
	//$numargs = func_num_args();
} // end of function doQuery()


function queryComposition($acc, $con) {
	// get canonical residue info from compositions
	$queryText = "SELECT residue_id,name,anomer,absolute,ring,parent_id,site,form_name,glycoct_index FROM compositions WHERE glytoucan_ac=?";
	$result = doQuery($queryText, $con, "s", $acc);
	return ($result);
} // end of function queryComposition()



/****************************
* The integrateData() function takes an array of associative arrays as its second argument
*   This array ($compArray) can be generated from a mysql query or from explicit data,	
*    facilitating php scripts that use integrateData() to describe glycans 
*    that are not in the DB
*  example - one element of $compArray:
*  array(9) {
*   ["residue_id"]=>
*   string(2) "N1"
*   ["name"]=>
*   string(3) "Man"
*   ["anomer"]=>
*   string(1) "a"
*   ["absolute"]=>
*   string(1) "D"
*   ["ring"]=>
*   string(1) "p"
*   ["parent_id"]=>
*   string(2) "NC"
*   ["site"]=>
*   string(1) "3"
*   ["form_name"]=>
*   string(4) "Manp"
*   ["glycoct_index"]=>
*   int(6)
*  }
***************************/
function integrateData($connection, $compArray, $accession) {
	// integrates the data associated with the accession
	
	// $glycan is an associative array that holds the integrated, hierarchical data
	//    for the glycan with a specific glytoucan_ac value
	$glycan = [];
	$resid = "";
	$glycan["glytoucan_ac"] = $accession;
	// get cannonical residue annotations from canonical_residues
	$canon_query = "SELECT residue_name,limited_to,not_found_in,notes,evidence,comment FROM canonical_residues WHERE residue_id=?";
	$canon_stmt = $connection->prepare($canon_query);
	$resid = "";
	$canon_stmt->bind_param("s", $resid);

	// get enzyme information for residues from enzyme_mappings
	$map_query = "SELECT enzyme_mappings.type,enzyme_mappings.uniprot,enzyme_mappings.requires_residue,enzyme_mappings.blocked_by_residue,enzyme_mappings.notes,enzymes.protein_refseq,enzymes.dna_refseq,enzymes.gene_name,enzymes.gene_id,enzymes.species,enzymes.branch_site_specificity,enzymes.orthology_group FROM enzyme_mappings,enzymes WHERE enzyme_mappings.uniprot=enzymes.uniprot AND residue_id=?";
	$map_stmt = $connection->prepare($map_query);
	$map_stmt->bind_param("s", $resid);

	// get biosynthetically related glycans from correlation
	$match_query = "SELECT homolog,relative_dp,shared FROM correlation WHERE glytoucan_ac=?";
	$match_stmt = $connection->prepare($match_query);
	$match_stmt->bind_param("s", $accession);

	$residues = [];
	//foreach($compArray as $x => $resdata) {
	//	print_r($resdata);
	//}
	foreach($compArray as $i => $resdata) {
		$enzymes = [];
		$homologs = [];
		$resid = $resdata["residue_id"];
		$fullrow = $resdata;
		// query canonical_residues using the current residue_id
		$canon_stmt->execute(); 
		$canon_result = $canon_stmt->get_result();
		if ( ($canon_result->num_rows) > 0) {
			$canon_row = $canon_result->fetch_assoc();
			$fullrow = array_merge($resdata, $canon_row);
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

	$features = getFeatures($residues, $accession, $homologs, $connection);

	// array sort by column value using custom comparator
	// $sorted = $residues;
	$sorted = sortCustom($residues, 'residue_id', 'gtree_comparator');
	$glycan["residues"] = $sorted;
	$glycan["related_glycans"] = $homologs;
	$glycan["caveats"] = $features['caveats'];
	return($glycan);

} // end function integrateData()


function fetchBitSetData($connection, &$bitData, &$probe_b64, $acc) {
	$bit_query = "SELECT * FROM bitSet"; 
	$bit_stmt = $connection->prepare($bit_query);
	$bit_stmt->execute();
	$bit_result = $bit_stmt->get_result();
	while ($row = $bit_result->fetch_assoc()) {
		$bitData[$row['glytoucan_ac']] = $row['base64_composition'];
		if ($row['glytoucan_ac'] == $acc) {
			$probe_b64 = $row['base64_composition'];
		}
	}	
} // end of function fetchBitSetData()


function checkFuzzy($bitset) {
	$fuzzy = $bitset->get(0) ? true : false;
	return($fuzzy);
} // end of function checkFuzzy()


function compareBitSets($bitData, $probe_bs, &$identical, &$extended, &$pruned, &$extended_fuzzy) {
	$probeFuzzy = checkFuzzy($probe_bs);
	// echo "\nprobeFuzzy is " . $probeFuzzy;
	// fuzziness is specified: clear(0) to facilitate logic (only on local copy)
	$probe_bs->clear(0);

	$probeMapped = $probe_bs->cardinality();
	if ($probeMapped == 0) return; // glycans related to the 'null glycan' are meaningless
	foreach($bitData as $a => $data) {
		$target_bs = new BitSet($data, "base64");
		$targetFuzzy = checkFuzzy($target_bs);
		// fuzziness is specified: clear(0) to facilitate logic (only on local copy)
		$target_bs->clear(0); 
		$mapped = $target_bs->cardinality();
		$target_bs->and($probe_bs);
		$matched = $target_bs->cardinality(); // i.e., the number of common bits
		// cp, ct, and cAnd hold information for classifying targets

		if (!$probeFuzzy) { // process probes that are NOT fuzzy
			if (!$targetFuzzy) {
				// neither probe nor target are fuzzy: and logic is easy
				if ($matched == $probeMapped) { // all bits in probe are in target
					if ($matched == $mapped) { // all bits in target are in probe
						// target is identical to probe		
						array_push($identical,
									  array("id"=>$a, "mapped"=>$mapped, "matched"=>$matched));			
					} else { // all bits in probe are in target but not vice verse
						// target extends probe
						array_push($extended, 
									  array("id"=>$a, "mapped"=>$mapped, "matched"=>$matched));
					}
				} else { // NOT all bits in probe are in target
					if ($matched == $mapped) { // all bits in target are in probe
						// target is pruned version of probe
						array_push($pruned, array("id"=>$a, "mapped"=>$mapped, "matched"=>$matched));
					}
				}
			} else {
				// only target is fuzzy
				if ($matched == $probeMapped) { // all bits in probe are in target
					// target is a fuzzy extension of probe	
					array_push($extended_fuzzy, 
								  array("id"=>$a, "mapped"=>$mapped, "matched"=>$matched));
				}
			}
		} else { // process fuzzy probes
			// can reliably find only non-fuzzy pruned versions of fuzzy probes
			if (!$targetFuzzy) {
				// only probe is fuzzy
				if ($matched == $mapped) { // all bits in target are in probe
					// target is a (non-fuzzy) pruned version of fuzzy probe	
					array_push($pruned, 
								  array("id"=>$a, "mapped"=>$mapped, "matched"=>$matched));
				}
			}
		}
	}	
	usort($extended, function($a, $b) {
	  return $a['mapped'] - $b['mapped'];
	});
	usort($extended_fuzzy, function($a, $b) {
	  return $a['mapped'] - $b['mapped'];
	});
	usort($pruned, function($a, $b) {
	  return $b['mapped'] - $a['mapped'];
	});
} // end of function compareBitSets()


?>
