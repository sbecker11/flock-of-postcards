#!/bin/bash

# Developer can edit the given jobs.xlsx spreadsheet,
# but changing the columns will require further 
# cevelopment.
# 
# This bash script converts the jobs.xlsx file to a 
# jobs.mjs file which can be referenced as static content 
# from any html file.
# 
# Details:
# The jobs.xlsx spreadsheet file is converted to a csv file and 
# then to a json file using in2csv and csvjson. These are python 
# utilities that become callable after activating the local 
# python virtual environment using `source venv/bin/activate`.
#
# The jobs.mjson file is then used to create the jobs.mjs file
# using standard unix tools.  The `truncate -s -1 jobs.mjs` line 
# removes the trailing newline character added by
# `echo "const jobs = " > jobs.mjs`
#
# The new jobs.mjs file is then referenced from html as any 
# local javascript file using:
#   <script type="text/javascript" src="static_files/jobs.mjs"></script>
#

rm -f jobs.csv jobs.mjson jobs.mjs
source venv/bin/activate
in2csv jobs.xlsx > jobs.csv
cat jobs.csv | python csv2json.py > jobs.mjson
echo -n "const jobs = " > jobs.mjs
cat jobs.mjson >> jobs.mjs
truncate -s -1 jobs.mjs
echo ";" >> jobs.mjs
deactivate
rm -f jobs.csv jobs.mjson
echo "done"