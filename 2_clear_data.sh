#!/bin/bash

cd ./data
pwd
rm *.lst

cd ./def
pwd
rm *.lst
rm G*.txt
ls

cd ./csv
pwd
rm G*.csv
rm *.lst
ls

cd ./mapped
pwd
rm G*.csv
rm report.csv
ls

cd ../../../und
pwd
rm *.lst
rm G*.txt
ls

cd ./csv
pwd
rm G*.csv
rm *.lst
ls

cd ./mapped
pwd
rm G*.csv
rm report.csv
ls

cd ../../..
pwd
ls
