
<?php
/* Improvements:
-	keep an associative array counts = {[accession] => [count]} to do the following
	.	when a link is made to a novel accession, the count for that accession is put into the array - the count is the sum of counts returned from its 'ancestors'
	.	this simplifies "node exists" queries - if (counts['accession'] > 0), then accession exists
	.	when called from $end, if count of aglycone ($newEnd > 0), then
	$newEnd exists;
	. the link to $newEnd cannot yet exist because of the way the traversal is structured
	. all links from $newEnd must already exist and be totaled in counts[$newEnd]
	.	if ($newEnd > 0), then make a new link ($end to $newEnd) and add counts[$newEnd] to local count for #end - when done, the local count for $end is returned to calling iteration of function
	.	upon completion, $end does two things:
			+ set the value of counts[$end] to local count
			+ return this value to calling iteration - these are summed for each 'parent'
	.	grand total of returned values is the number of possible paths
*/

include '../../config.php';
	
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

/*
function edgeExists($data, $child_node, $parent_node) {
	// echo " ...edgeExists?... checking $child_node and $parent_node\n";
	// $data is an array of arrays
	$nds = $data['nodes'];
	//     links are specified using indices of nodes
	$cIndex = nodeExists($data, $child_node);
	$pIndex = nodeExists($data, $parent_node);

	// echo "   ...edgeExists?... checked node indices $cIndex and $pIndex\n";
	$lnks = $data['links'];
	// for all edges, the source is always $parent_node and
	//     the target is always $child_node
	foreach ($lnks as $value) {
		if (($value['target'] == $cIndex) && ($value['source'] == $pIndex)) {
			// echo "   ...edgeExists?... FOUND edge\n";
			return 1;
		}
	}
	// echo "   ...edgeExists?... DID NOT FIND edge\n";

	return 0;
} // end of function edgeExists()
*/

function nodeExists($data, $the_node) {
	// echo " ---nodeExists?--- $the_node\n";
	$nds = $data['nodes'];
	//     links are specified using indices of nodes
	$nIndex = 0;
	foreach($nds as $value) {
		if ($value["name"] == $the_node) $nIndex = $value["id"];
	}
	if (($nIndex) > 0) {
		// echo " ---nodeExists?--- FOUND\n";
	} else {
		// echo " ---nodeExists?--- NOT FOUND\n";
	}
	return $nIndex;
}



function addNode(&$data, $the_node, $connection) {
	// echo "   ...addNode... $the_node\n";
	// copy $data['nodes']
	$nds = $data['nodes'];
	$count = sizeof($nds) + 1;
	$newNode = [];
	$newNode["id"] = $count;
	$newNode["name"] = $the_node;
	$newNode["dp"] = getDP($the_node, $connection);
	$nds[] = $newNode;
	// changes to $nds are local, so must refresh $data['nodes']
	$data['nodes'] = $nds;
	// echo "\nNODES\n";
	// echo json_encode($data['nodes'], JSON_PRETTY_PRINT);
	return $newNode["id"];
}

// use this on $nodes array with column 'dp'
function sortColumn($arr, $column) {
// sort associative array by column value
		$column_array  = array_column($arr, $column);
		// no ascending or descending - order depends entirely on $cmp
		asort($column_array);
		$i = 0;
        foreach ($column_array as $key => $value)  {
			// echo "$key $value; "; 
			$sorted_array[$i] = $arr[$key];
			$i++;
		}
	return $sorted_array;
}


function addEdge(&$data, $child_node, $parent_node, $connection) {
	// echo "---addEdge--- $child_node - $parent_node\n";
	// add nodes to $data if they have not yet been added
	// nodeExists returns nodeIndex, or zero if non-existent
	$cIndex = nodeExists($data, $child_node);
	if ($cIndex === 0) {
		// echo " ---addEdge--- adding node $child_node, which does not yet exist\n";
		// addNode returns new (non-zero) nodeIndex
		$cIndex = addNode($data, $child_node, $connection);
		// echo " ---addEdge--- ADDED node with id $cIndex\n";
	}
	
	// nodeExists returns nodeIndex, or zero if non-existent
	$pIndex = nodeExists($data, $parent_node);
	if ($pIndex === 0) {
		// echo " ---addEdge--- adding node $parent_node, which does not yet exist\n";
		$pIndex = addNode($data, $parent_node, $connection);
		// echo " ---addEdge--- ADDED node with id $pIndex\n";
	}
	$nds = $data['nodes'];
	
	// get the residue_id (i.e., $diff) of the residue that is 
	//     present in the $child_node but not in the $parent_node
	$child_residues = [];
	$sql = "select residue_id from compositions where glytoucan_ac=?";
	$stmt = $connection->prepare($sql);
	$acc = $child_node;
	$stmt->bind_param("s", $acc);
	$stmt->execute(); 
	$result = $stmt->get_result();
	while ($row = $result->fetch_assoc()) {
		$child_residues[] = $row["residue_id"];
	}
	// echo "\nchild is " . $child_node . "\n  num residues is " . sizeof($child_residues) . "\n";
	
	$parent_residues = [];
	$acc = $parent_node;
	$stmt->execute(); 
	$result = $stmt->get_result();
	while ($row = $result->fetch_assoc()) {
		$parent_residues[] = $row["residue_id"];
	}
	// echo "\nparent is " . $parent_node . "\n  num residues is " . sizeof($parent_residues) . "\n";

	$diff = array_diff($child_residues, $parent_residues);
	foreach($diff as $value) $ra = $value;

	$enzymes = [];
	$sql = "select gene_name,uniprot,species from enzyme_mappings where residue_id=?";
	$stmt = $connection->prepare($sql);
	$stmt->bind_param("s", $ra);
	$stmt->execute(); 
	$result = $stmt->get_result();
	while ($row = $result->fetch_assoc()) {
		$enzymes[] = $row;
	}
	

	$edge = array(
	 	"target" => $cIndex,
	 	"source" => $pIndex,
		"residue_added" => $ra,
		"enzymes" => $enzymes
	);
	$lnks = $data['links'];
	// echo "   adding edge($child_node - $parent_node), here is the data before:\n %%% ";
	// var_dump($data);
	$lnks[] = $edge;
	$data['links'] = $lnks;
	// echo "--- addEdge--- ($child_node - $parent_node) result;\n";
	// echo "\nDATA\n";
	// echo json_encode($data, JSON_PRETTY_PRINT);
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
// $data and $pc (path-count) are passed by reference so they can be appended 
//     at each recursion level
function pathDAG($end, $start, $globalRE, $startDP, $rid, &$data, $connection, &$pc) {
	// echo "\n#### ---pathDAG--- recursion for node $end ####\n";
	
	// if $start has been reached; success, but do not continue traversal
	if ($end == $start) {
		// echo "  ---pathDAG--- !FOUND START! TERMINATING traversal, outcome is 1\n\n";
		return 1;
	}
	
	$re = getRE($end, $rid, $connection);
	// echo "reducing end is $re\n";
	// do not use accessions with non-matching reducing ends
	if ($globalRE != $re) {
		// echo "  ---pathDAG--- bailing - reducing end mismatch, outcome is 0\n\n";
		return 0; 
	}
	

	// $startDP has been reached, but ($end != $start); dead end
	if ($startDP == getDP($end, $connection)) {
		// echo "  ---pathDAG--- dp ($startDP) of $end matches start, but no match: outcome is 0\n\n";
		return 0;
	}
	
	// $paths is the number of paths to $start from this node - initially 0
	$paths = 0; 
   
	// fetch all potential precursors of $end
	$precursors = getPrecursors($end, $connection);
	foreach ($precursors as $key => $value) {
		$new_end = $precursors[$key];
		if (!array_key_exists($new_end, $pc) ) {
			// if $new_end exists, no need for recursion
			// echo "---pathDAG--- recursion\n";
			$outcome = pathDAG($new_end, $start, $globalRE, $startDP, $rid, $data, $connection, $pc);
		} else {
			// get the outcome that would result if recursion occurred
			$outcome = $pc[$new_end];
		}
		if ($outcome > 0) {
			// $new_end has traversed to $start, sp process the results 
			//    $outcome is the number of paths taken
			// echo "@@@ pathDAG @@@ COMPLETED TRAVERSAL FROM $new_edge TO $start: NUMBER OF PATHS TAKEN IS $outcome\n";
			// add $new_end to $pc (path-count) - if it's not there already
			 $pc[$new_end] = $outcome;
			// add $end-$new_end edge to $data
			//  addEdge also adds nodes themselves, it they're not there already
			addEdge($data, $end, $new_end, $connection); 
			$paths += $outcome;
		}
	}

	return $paths;
}  // end of function pathDAG()


try {
	$end = $_GET['end'];
	$start = $_GET['start'];
	// $servername = 
	$data = [];
	$pc = [];
	$data['nodes'] = []; 
	$data['links'] = []; 
	// echo "initial data:\n";
	// echo json_encode($data, JSON_PRETTY_PRINT);

	// Create connection
	$connection = new mysqli($servername, $username, $password, $dbname);

	// Check connection
	if ($connection->connect_error) {
		die("<br>Connection failed: " . $connection->connect_error);
	}

	$rid = "NA";
	$reEnd = getRE($end, $rid, $connection);
	$reStart = getRE($start, $rid, $connection);

	if ($reEnd != $reStart) {
		echo 
		die ("Reducing ends do not match, so no pathway can be traversed\n");
	}
	
	$endDP = getDP($end, $connection);
	$startDP = getDP($start, $connection);
	if ($startDP > $endDP) {
		echo 
		die ("Start DP is greater than end DP - cannot yet generate a biosynthetic pathway from large to small\n");
	}	
	
	
	$totalPaths = pathDAG($end, $start, $reEnd, $startDP, $rid, $data, $connection, $pc);
	
	$nodeArray = $data['nodes'];
	$sortedNodes = sortColumn($nodeArray, 'dp');
	$data['nodes'] = $sortedNodes;
	
	$data['path_count'] = $totalPaths;

	// echo "Total number of complete paths is $totalPaths";
	// echo "\nDATA\n";
	
	echo json_encode($data, JSON_PRETTY_PRINT);
	
} catch (mysqli_sql_exception $e) { 
	echo "MySQLi Error Code: " . $e->getCode() . "<br />";
	echo "Exception Msg: " . $e->getMessage();
	exit();
}

$connection->close();

?>