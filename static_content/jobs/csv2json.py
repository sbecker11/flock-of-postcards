import csv
import sys
import io
import json
from datetime import datetime

csv.field_size_limit(sys.maxsize)

replacements = {
    "CURRENT_DATE": f"{datetime.now():%Y-%m}"
}
in_str = sys.stdin.read()
reader_list = csv.DictReader(io.StringIO(in_str))
count = 0;
out_rows = []
for row in reader_list:
    out_row = {}
    for (key,val) in row.items():
        if val in replacements.keys():
            val = replacements[val]
        out_row[key] = val        
    out_rows.append(json.dumps(out_row))
print(f'[{",".join(out_rows)}]')
