<?php

// Usage for command line:
//   php getSuperset.php acc=[glytoucan accession] pw=[mysql_password]

// Usage on line:
// https://glygen.ccrc.uga.edu/sandbox/api/getSuperset.php?acc=[glytoucan accession]


include '../config.php';
include 'bitSet.php';

$servername = "";
$password = "";

try {
	if (empty($_GET)) {
		// $_GET is not populated when called from command line
		// the following lines are required for command-line invocation
		parse_str(implode('&', array_slice($argv, 1)), $_GET);
		$servername = 'localhost:8889';
		// !!! password must be supplied on the command line !!!
		$password = $_GET['pw'];
	} else {
		$servername = getenv('MYSQL_SERVER_NAME');
		$password = getenv('MYSQL_PASSWORD');
	}
} catch(Exception $e) {
	exit($e->getMessage());
}

try {

	$acc = $_GET['acc'];
	//echo "\n### processing glycan: " . $acc . " ###";
	$head = $_GET['head'];
	
	// Create connection
	$connection = new mysqli($servername, $username, $password, $dbname);

	// Check connection
	if ($connection->connect_error) {
		exit("connection failure");
	}
	
	$bitData = [];
	$probe_b64 = "";
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
	
	//echo "\n### Fetched " . sizeof($bitData) . " data sets ###";
	// echo "\n    data set for " . $acc . " is: \n" . $probe_b64;
	
	$probe_bs = new BitSet($probe_b64, "base64");
	$probeFuzzy = checkFuzzy($probe_bs);
	// echo "\nprobeFuzzy is " . $probeFuzzy;
	// fuzziness is specified: clear(0) to facilitate logic
	$probe_bs->clear(0);
	$cp = $probe_bs->cardinality();

	$extended = [];
	$identical = [];
	$pruned = [];
	$extended_fuzzy = [];
	$record = [];
	
	foreach($bitData as $a => $data) {
		$target_bs = new BitSet($data, "base64");
		$targetFuzzy = checkFuzzy($target_bs);
		// fuzziness is specified: clear(0) to facilitate logic
		$target_bs->clear(0); 
		$ct = $target_bs->cardinality();
		$target_bs->and($probe_bs);
		$cAnd = $target_bs->cardinality(); // i.e., the number of common bits
		// cp, ct, and cAnd hold information for classifying targets

		
		if (!$probeFuzzy) { // process probes that are NOT fuzzy
			if (!$targetFuzzy) {
				// neither probe nor target are fuzzy: and logic is easy
				if ($cAnd == $cp) { // all bits in probe are in target
					if ($cAnd == $ct) { // all bits in target are in probe
						// target is identical to probe		
						array_push($identical, $a);			
					} else { // all bits in probe are in target but not vice verse
						// target extends probe
						array_push($extended, $a);			
					}
				} else { // NOT all bits in probe are in target
					if ($cAnd == $ct) { // all bits in target are in probe
						// target is pruned version of probe
						array_push($pruned, $a);
					}
				}
			} else {
				// only target is fuzzy
				if ($cAnd == $cp) { // all bits in probe are in target
					// target is a fuzzy extension of probe	
					array_push($extended_fuzzy, $a);	
				}
			}
		} else { // process fuzzy probes
			// can reliably find only non-fuzzy pruned versions of fuzzy probes
			if (!$targetFuzzy) {
				// only probe is fuzzy
				if ($cAnd == $ct) { // all bits in target are in probe
					// target is a (non-fuzzy) pruned version of fuzzy probe	
					array_push($pruned, $a);
				}
			}
		}
	}
	
	$output = [];
	$output['glytoucan_ac'] = $acc;
	$output['bit_sets'] = sizeof($bitData);
	$output['identical'] = $identical;
	$output['extended'] = $extended;
	$output['extended_fuzzy'] = $extended_fuzzy;
	$output['pruned'] = $pruned;

	if ($head == "1") header('Content-Type: application/json; charset=utf-8');
	echo json_encode($output, JSON_PRETTY_PRINT);

} catch (mysqli_sql_exception $e) { 
	echo "MySQLi Error Code: " . $e->getCode() . "<br />";
	echo "Exception Msg: " . $e->getMessage();
	exit();
}

$connection->close();

function checkFuzzy($bitset) {
	$fuzzy = $bitset->get(0) ? true : false;
	return($fuzzy);
}

?>