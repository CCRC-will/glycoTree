#!/bin/bash

cd ./data
pwd
rm *.lst

cd ./fully_determined
pwd
rm *.lst
rm G[0-3]*.txt
rm G[4-6]*.txt
rm G[7-9]*.txt

cd ./csv
pwd
rm G*.csv
rm *.lst

cd ./mapped
pwd
rm G*.csv
rm report.csv
ls

cd ..
pwd
ls

cd ..
pwd
ls

cd ..
pwd
ls

cd ..
pwd
ls
