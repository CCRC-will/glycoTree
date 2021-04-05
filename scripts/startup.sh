#!/bin/sh
# set environment variables
. ~/workspace/glycoTree/bashrc
# start php-mysql-apache
cd ~/workspace/glycoTree/ && docker-compose up -d
