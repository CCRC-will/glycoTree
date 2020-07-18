#!/bin/bash

cd ./data
pwd
rm *.lst

cd ./gct
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
