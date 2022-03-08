<?php
include '../config.php';

$servername = getenv('MYSQL_SERVER_NAME');
$password = getenv('MYSQL_PASSWORD');

$limiter = null;
if(isset($_GET['limiter'])) $limiter = $_GET['limiter'];
$limiterVal = $_GET['val'];

// Create connection
$connection = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($connection->connect_error) {
	die("<br>Connection failed: " . $connection->connect_error);
}

$dataWrap = [];
$dataWrap['limiter'] = $limiter;
$dataWrap['limiter_value'] = $limiterVal;
$ruleData = [];

$query = "none";

// limit query to specific, acceptable cases
// verbosity REQUIRED for security - cannot simply replace variables, but use prepared statements
$nPars = 0;
$whereClause = "";


if(!empty($limiter)) switch ($limiter) { 
	case "focus":
	  $whereClause = "WHERE focus=?";
	  $nPars = 1;
	  break;
	case "rule_id":
	  $whereClause = "WHERE rules.rule_id=?";
	  $nPars = 1;
	  break;
	case "curator":
	  $whereClause = "WHERE rule_data.curator_id=?";
	  $nPars = 1;
	  break;
	case "taxonomy":
	  $whereClause = "WHERE rule_data.taxonomy=?";
	  $nPars = 1;
	  break;
	case "agent":
	  $whereClause = "WHERE rule_data.agent=?";
	  $nPars = 1;
	  break;
	case "logic_substr":
	  $limiterVal = "%$limiterVal%"; // required for "WHERE LIKE"
	  $whereClause = "WHERE rules.logic LIKE ?";
	  $nPars = 1;
	  break;
	case "comment_substr":
	  $limiterVal = "%$limiterVal%"; // required for "WHERE LIKE"
	  $whereClause = "WHERE rule_data.comment LIKE ?";
	  $nPars = 1;
	  break;
	case "reference_substr":
	  $limiterVal = "%$limiterVal%"; // required for "WHERE LIKE"
	  $whereClause = "WHERE rule_data.refs LIKE ?";
	  $nPars = 1;
	  break;
	case "status":
	  $nPars = 1;
	  $whereClause = "WHERE rule_data.status=?";
	  break;
	case "no_filter":
		break;
	default:
	  // if this code is reached, the specified $limiter is not supported
	  $msg = "The specified limiter ($limiter) is not supported -";
	  $msg .= "  Try one of the following:";
	  $msg .= "  focus; status; rule_id; curator; taxonomy; agent; logic_substr; comment_substr; reference_substr;";
	  $dataWrap['msg'] = $msg;
	  $nPars = 0;
	  $whereClause = "WHERE rule_data.rule_id=0";
}

$query = "SELECT canonical_residues.residue_id,canonical_residues.anomer,canonical_residues.absolute,canonical_residues.form_name,canonical_residues.site,rule_data.*,rules.logic FROM canonical_residues LEFT JOIN rule_data ON (rule_data.focus = canonical_residues.residue_id) LEFT JOIN rules ON (rules.rule_id = rule_data.rule_id) $whereClause ORDER BY SUBSTR(canonical_residues.residue_id, 1, 1), cast(SUBSTR(canonical_residues.residue_id, 2, 4) as UNSIGNED)";
// echo "$query\n\n";

$stmt = $connection->prepare($query);
if ($nPars == 1) {
	$stmt->bind_param("s", $limiterVal);
}
$stmt->execute(); 
$result = $stmt->get_result();
if ( ($result->num_rows) > 0) {
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
} else {
	$row = [];
	$row['residue_id'] = "none";
	$row['inference'] = "none";
	$row['status'] = "none";
	$row['status'] = "none";
	$row['refs'] = "none";
	$row['comment'] = "none";
	$row['curator_id'] = "none";
		
	array_push($ruleData,$row);
}

$dataWrap['data'] = $ruleData;

header("Cache-Control: no-cache, must-revalidate");
header('Content-Type: application/json; charset=utf-8');
echo json_encode($dataWrap, JSON_PRETTY_PRINT);

?>
