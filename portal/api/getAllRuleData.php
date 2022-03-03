<?php
include '../config.php';

$servername = getenv('MYSQL_SERVER_NAME');
$password = getenv('MYSQL_PASSWORD');

$limit = $_GET['limit'];

// Create connection
$connection = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($connection->connect_error) {
	die("<br>Connection failed: " . $connection->connect_error);
}

$ruleData = [];

if ($limit == "true") {
	$query = "SELECT canonical_residues.residue_id,rule_data.*,rules.logic FROM canonical_residues LEFT JOIN rule_data ON (rule_data.focus = canonical_residues.residue_id) LEFT JOIN rules ON (rules.rule_id = rule_data.rule_id) WHERE rule_data.status='proposed' ORDER BY SUBSTR(canonical_residues.residue_id, 1, 1), cast(SUBSTR(canonical_residues.residue_id, 2, 4) as UNSIGNED)";
} else {
	$query = "SELECT canonical_residues.residue_id,rule_data.*,rules.logic FROM canonical_residues LEFT JOIN rule_data ON (rule_data.focus = canonical_residues.residue_id) LEFT JOIN rules ON (rules.rule_id = rule_data.rule_id) ORDER BY SUBSTR(canonical_residues.residue_id, 1, 1), cast(SUBSTR(canonical_residues.residue_id, 2, 4) as UNSIGNED)";
}

$stmt = $connection->prepare($query);
$stmt->execute(); 
$result = $stmt->get_result();
while ($row = $result->fetch_assoc() ) {
	$focus = $row['focus'];
	$agent = $row['agent'];
	$factor_1 = $row['factor_1'];
	$factor_2 = $row['factor_2'];
	$taxonomy = $row['taxonomy'];
	$logic = $row['logic'];
	$keys = array("[focus]", "[agent]", "[factor_1]", "[factor_2]", "[taxonomy]");
	$vals = array($focus, $agent, $factor_1, $factor_2, $taxonomy);
	$inference = str_replace($keys,$vals,$logic);
	$row['inference'] = $inference;
	array_push($ruleData,$row);
}

echo json_encode($ruleData, JSON_PRETTY_PRINT);

?>
