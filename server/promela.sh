#!/bin/bash

tmp_dir=$(mktemp -d)
cd $tmp_dir

cat > model.pml

spin -a model.pml           > /dev/null 2>&1
gcc -DBFS_PAR -o pan pan.c  > /dev/null 2>&1
./pan

for ext in .trc .trail; do
  if ls *$ext 1> /dev/null 2>&1; then
    spin -p -t -v -k "$(ls *$ext)" model.pml
    break
  fi
done

rm -rf $tmp_dir