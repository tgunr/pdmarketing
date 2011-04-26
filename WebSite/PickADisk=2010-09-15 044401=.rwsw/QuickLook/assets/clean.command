#!/bin/bash
dir=`dirname "$0"`
echo "Cleaning: $dir"
pushd "$dir"
find .. -type d -name .svn -exec rm -fr {} \;
popd