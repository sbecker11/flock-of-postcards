import pandas as pd 
import numpy as np
import json
  
df = pd.DataFrame(pd.read_excel("jobs.xlsx")) 
df['start'] = df['start'].astype(str)
df['end'] = df['end'].astype(str)

# Replace NaN values with None
df = df.replace({np.nan: None})

list_of_dicts = df.reset_index().to_dict(orient='records')

with open('jobs.mjs', 'w') as mjs_file:
    mjs_file.write('const jobs = ')
    mjs_file.write(json.dumps(list_of_dicts))
    mjs_file.write(';')
