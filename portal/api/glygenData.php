<?php
// Generates a tsv file containing glycans, their glycotree residues, and
//  information about the enzymes that transfer these residues.

include '../config.php';
$servername = getenv('MYSQL_SERVER_NAME');
$password = getenv('MYSQL_PASSWORD');

header("Content-type:text/tab-separated-values");

try {

	// Create connection
	$connection = new mysqli($servername, $username, $password, $dbname);

	// Check connection
	if ($connection->connect_error) {
		die("<br>Connection failed: " . $connection->connect_error);
	}
	
	$query = "SELECT compositions.glytoucan_ac,compositions.residue_name,compositions.residue_id,enzyme_mappings.uniprot,gene_name,gene_id,compositions.parent_id,enzymes.type,enzymes.species FROM compositions,enzyme_mappings,enzymes WHERE compositions.residue_id=enzyme_mappings.residue_id AND enzyme_mappings.uniprot=enzymes.uniprot";
	$stmt = $connection->prepare($query);
	$stmt->execute(); 
	$result = $stmt->get_result();
	$count = 1;
	echo "glytoucan_ac\tresidue_name\tresidue_id\tuniprot\tgene_name\tgene_id\tparent_residue_id\tenzyme_type\tspecies\n";
	while ( ($row = $result->fetch_assoc()) ) {
		// if ($count > 0) {
			echo $row['glytoucan_ac'] . "\t" .
			$row['residue_name'] . "\t" .
			$row['residue_id'] . "\t" .
			$row['uniprot'] . "\t" .
			$row['gene_name'] . "\t" .
			$row['gene_id'] . "\t" .
			$row['parent_id'] . "\t" .
			$row['type'] . "\t" .
			$row['species'] . "\n";
		// }
		$count++;
		// echo $count . "\n";
	}
	
} catch (mysqli_sql_exception $e) { 
	echo "MySQLi Error Code: " . $e->get Code() . "<br />";
	echo "Exception Msg: " . $e->getMessage();
	exit();
}

$connection->close();