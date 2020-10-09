#!/bin/bash

#  populates the TARGET directory '/var/www/html' with the glycoTree portal files

# The agent executing this script must have write access to the
#    TARGET directory '/var/www/html'
#    The TARGET directory '/var/www/html' must exist
#    The 'glycoTree' repository root directory contains a subdirectory called 'portal' 
#    The 'glycoTree' directory exists and is a subdirectory of the current directory

TARGET=/var/www/html

# remove all contents of the TARGET directory
rm -rf $TARGET/*

# repopulate the TARGET directory
cp -rf glycoTree/portal/* $TARGET/
