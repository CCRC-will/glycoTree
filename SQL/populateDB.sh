#!/bin/bash
# Usage: ./populateDB -u <user> -d <mysql_bin_directory>  -a <sandbox api server>
# Example:
#  ./populateDB.sh -u gt_user -d /Applications/MAMP/Library/bin/ -a https://glygen.ccrc.uga.edu/sandbox/api/
# Example:
# ./populateDB.sh -u gt_user -d /Applications/MAMP/Library/bin/ -a localhost:8080/api/
#  This script populates the glycotree DB using the mysqlimport command
#  For security reasons, YOU must supply the 
#    DB user_name and directory containing mysqlimport
#    User will be prompted for the MYSQL password

# The commands in this script assume it is called from glycotree/SQL/
#  Thus, files specifying the model are in the directory ../model/

start=$(date)
echo $start
admin_id=""
accept="n"
COUNT=0

rule_php="ruleDataUpdates.php"
rule_html="ruleData.html?limit=true"
TFILE="tempfile.tsv"
rm $TFILE
RULE_DATA="rule_data.tsv"

# initiate (global) canonical_residues.csv with N_canonical_residues.csv
cp ../model/N_canonical_residues.csv ./canonical_residues.csv
# append canonical_residues.csv with O_canonical_residues.csv (remove header line)
awk 'NR > 1 {print($0);}' ../model/O_canonical_residues.csv >> ./canonical_residues.csv
cp ../model/enzymes.csv ./enzymes.csv
cp ../model/enzyme_mappings.csv ./enzyme_mappings.csv
cp ../model/rules.tsv ./rules.tsv
cp ../model/rule_data.tsv ./rule_data.tsv
	
# glycotree/SQL/compositions.csv is generated by glycotree/build_N-tree.sh
# glycotree/SQL/correlation.csv is generated by glycotree/build_N-tree.sh


if [ $# -lt 6 ]; then
  echo "Not enough arguments"
  exit
fi

for (( i=1; i<=$#; i++)); do
  j=$(($i + 1))

  if [ ${!i} = '-u' ]; then
    user=${!j}
    echo "user name $user"
  fi

  if [ ${!i} = '-d' ]; then
    dir=${!j}
    echo "mysql bin directory $dir"
  fi

  if [ ${!i} = '-a' ]; then
    api=${!j}
    echo "api site $api"
  fi
done

# MAYBE RULE ADMINISTRATION SHOULD BE COMPLETELY SEPARATE AND INVOKED FROM '../build_all.sh'
rule_api=$api$rule_php
echo "Rule API is $rule_api"

echo
read -s -p "Please enter the MYSQL password for $user: " pw
echo

read -p "Please enter your ID: " admin_id
echo

curl -s $rule_api -o newRules.tsv > /dev/null
echo

function check_rule() {
    echo
    echo "Rule $COUNT:"
    rule=$1
    echo "$rule"
    rule="${rule/unspecified/${admin_id}}"
    read -u 1 -p "Accept this rule? (y/n) " accept
    if [ $accept == "y" ]
    then
      echo "Rule $COUNT accepted"
      rule="${rule/proposed/active}"
    else
      echo "Rule $COUNT rejected"
      rule="${rule/proposed/rejected}"
    fi
    if test -f "$TFILE"
    then
        echo "$rule" >> $TFILE
    else
        echo "$rule" > $TFILE
    fi
}

echo "To examine the proposed rules (below), direct your browser to:"
echo $api$rule_html 
echo

while IFS='' read -r in || [[ -n "${in}" ]]; do
   if [ $COUNT -gt 0 ]
   then
     check_rule "$in"
   else
     echo "$in"
   fi
   ((COUNT++))
done < newRules.tsv

echo
echo "Processed rules:"
cat $TFILE

read -u 1 -p "Append these rules to $RULE_DATA? (y/n) " accept
if [ $accept == "y" ]
then
  timestamp=$(date +%s)
  echo "the following trivial actions are not yet implemented"
  echo "copying $RULE_DATA to ./bak/$timestamp-$RULE_DATA"
  echo "appending these rules to $RULE_DATA"
fi

rm newRules.tsv
rm $TFILE

echo
echo "populating SQL Tables"
echo

$dir/mysqlimport -u $user -p$pw --local --delete -v --fields-terminated-by="," --ignore-lines=1 --lines-terminated-by="\n" -c residue_name,residue_id,name,anomer,absolute,ring,parent_id,site,form_name,limited_to,not_found_in,notes,who,evidence,comment glycotree canonical_residues.csv 

$dir/mysqlimport -u $user -p$pw --local --delete -v --fields-terminated-by="," --ignore-lines=1 --lines-terminated-by="\n" -c type,orthology_group,uniprot,protein_refseq,dna_refseq,gene_name,gene_id,species,branch_site_specificity glycotree enzymes.csv 

$dir/mysqlimport -u $user -p$pw --local --delete -v --fields-terminated-by="," --ignore-lines=1 --lines-terminated-by="\n" -c glytoucan_ac,residue_name,residue_id,name,anomer,absolute,ring,parent_id,site,form_name,glycoct_index glycotree compositions.csv

$dir/mysqlimport -u $user -p$pw --local --delete -v --fields-terminated-by="," --ignore-lines=1 --lines-terminated-by="\n" -c glytoucan_ac,dp,homolog,relative_dp,shared glycotree correlation.csv
 
$dir/mysqlimport -u $user -p$pw --local --delete -v --fields-terminated-by="," --ignore-lines=1 --lines-terminated-by="\n" -c residue_name,residue_id,type,uniprot,requires_residue,blocked_by_residue,notes glycotree enzyme_mappings.csv

$dir/mysqlimport -u $user -p$pw --local --delete -v --fields-terminated-by="\t" --ignore-lines=1 --lines-terminated-by="\n" -c glytoucan_ac,base64_composition glycotree bitSet.tsv 

$dir/mysqlimport -u $user -p$pw --local --delete -v --fields-terminated-by="\t" --ignore-lines=1 --lines-terminated-by="\n" -c rule_id,class,description,logic glycotree rules.tsv 

$dir/mysqlimport -u $user -p$pw --local --delete -v --fields-terminated-by="\t" --ignore-lines=1 --lines-terminated-by="\n" -c instance,rule_id,focus,agent,factor_1,factor_2,taxonomy,curator_id,refs,comment,status,administrator glycotree rule_data.tsv 

$dir/mysqldump -u gt_user -p$pw glycotree > ./server/glycotree.sql
