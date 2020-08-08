#!/bin/bash

echo "Clearing intermediate data"
cd ./data
pwd
rm *.lst

echo
cd ./gct
pwd
rm *.lst
rm G*.txt
ls

echo
cd ./csv
pwd
rm G*.csv
rm *.lst
ls

echo
cd ./mapped
pwd
rm G*.csv
rm report.csv
ls

echo
cd ./sorted
pwd
rm G*.csv
ls

echo
cd ../../../..
pwd
ls

echo
echo "Clearing generated model data"
echo
cd ../model
pwd
rm unassigned.csv
rm annotated_glycans.csv
rm annotated_glycans.json
ls

echo
cd gTree_svg
pwd
rm G*.svg
ls

echo
cd ../GlycoCT_svg
pwd
rm G*.svg
ls

echo
cd ../json
pwd
rm G*.json
ls

echo
cd ../..
pwd
