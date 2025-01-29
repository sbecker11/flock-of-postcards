import pandas as pd
import numpy as np
import json
import re
import requests
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

input_xlsx_file = 'jobs.xlsx'
target_column = 'Description'
output_xlsx_file = 'jobs-processed.xlsx'
output_mjs_file = 'jobs.mjs'

def init_counters():
    counters = {
        'valid_no_changes_cnt': 0,
        'valid_some_changes_cnt': 0,
        'invalid_all_changes_cnt': 0
    }
    return counters

def report_counters(counters):
    print(f"valid_no_changes_count: {counters['valid_no_changes_cnt']}")
    print(f"valid_some_changes_count: {counters['valid_some_changes_cnt']}")
    print(f"invalid_all_changes_count: {counters['invalid_all_changes_cnt']}")


def test_permuted_url(original_url):
    transformations = [
        "", ".com", "www.", "www.com",
        "http://", "http://.com", "http://www.", "http://www.com",
        "https://", "https://.com", "https://www.", "https://www.com"
    ]

    # First, try the url without any transformation
    try:
        response = requests.head(original_url, allow_redirects=True, timeout=10)
        if response.status_code == 200:
            logging.info(f"Success: original_url:{original_url} is already valid with no transformation")
            return {"original": original_url, "valid": original_url, "code": -1}  # -1 for no transformation
    except requests.RequestException:
        pass

    # Remove trailing slash if it follows a valid domain extension
    stripped_url = re.sub(r'\.(com|org|net|edu|gov|mil|biz|info|mobi|name|aero|asia|jobs|museum|co|tv)\/$', r'.\1', original_url.strip("'\""))

    # If removing the slash makes it different, try this first
    if stripped_url != original_url.strip("'\""):
        try:
            response = requests.head(stripped_url, allow_redirects=True, timeout=10)
            if response.status_code == 200:
                logging.info(f"Success: original_url:{original_url} was made valid by removing trailing slash: '{stripped_url}'")
                return {"original": original_url, "valid": stripped_url, "code": -2}  # -2 for trailing slash removal
        except requests.RequestException:
            pass

    # Continue with transformations on the stripped URL
    for transform in transformations:
        url = transform.replace('.com', f'{stripped_url}.com') if '.com' in transform else transform + stripped_url
        try:
            response = requests.head(url, allow_redirects=True, timeout=10)
            if response.status_code == 200:
                logging.info(f"Success: original_url:{original_url} was made valid:'{url}' with transformation code {transformations.index(transform)}")
                return {"original": original_url, "valid": url, "code": transformations.index(transform)}
        except requests.RequestException:
            pass  # Move to the next permutation if this one fails

    # If no permutation works
    logging.info(f"Failure: original_url:'{original_url}' could not be transformed into a valid url")
    return None


# replace all (url) with (valid_url) or ""
# if no valid_url can be found
def process_urls_in_string(text, counters):
    # Regex pattern to match URLs in parentheses
    pattern = r'\((?:https?:\/\/)?([^\s\)]+)\)'

    # Find all matching URLs
    matches = re.findall(pattern, text)
    for original_url in matches:
        # Find the first permutation that makes the original url valid
        valid_permutation = test_permuted_url(original_url)
        if valid_permutation:
            replacement_url = valid_permutation['valid']  # Use 'valid' key
            if valid_permutation['code'] == -1:
                counters['valid_no_changes_cnt'] += 1
            else:
                counters['valid_some_changes_cnt'] += 1
            # Replace the original URL with the valid one
            text = re.sub(f'\({re.escape(original_url)}\)', f'({replacement_url})', text)
        else:
            # If no valid transformation, remove the URL
            counters['invalid_all_changes_cnt'] += 1
            text = re.sub(f'\({re.escape(original_url)}\)', '', text)

    return text

# Example usage:
# counters = init_counters()
# old_string = "Here's a URL (example.com) and another (bad-url)"
# new_string = process_urls_in_string(old_string)
# print(new_string)
# "Here's a URL (http://www.example.com) and another (Invalid URL)"
# rreport_counters(counters)


# read contents of 'jobs.xlsx' into dataframe df
df = pd.DataFrame(pd.read_excel(input_xlsx_file))
df['start'] = df['start'].astype(str)
df['end'] = df['end'].astype(str)

# verify that the target_column exists
if target_column not in df.columns:
    raise Exception(f"'{target_column}' field not found in columns: {df.columns}")

# Replace NaN values with None
df = df.replace({np.nan: None})

# Apply the process_urls_in_string function to create a new 'processed' column
counters = init_counters()
df['processed'] = df[target_column].apply(lambda text: process_urls_in_string(text, counters))
report_counters(counters)

# Drop the old target_column
df = df.drop(columns=target_column)

# Rename 'processed' to target_column
df = df.rename(columns={'processed': target_column})

# extact the processed list of dicts from the datafame
list_of_dicts = df.reset_index().to_dict(orient='records')

# save the list_of dicts to output_mjs_file
with open(output_mjs_file, 'w', encoding="utf-8") as mjs_file:
    mjs_file.write('const jobs = ')
    mjs_file.write(json.dumps(list_of_dicts))
    mjs_file.write(';')
print(f"Successfully output {output_mjs_file}.")

# also save the processed df to a new output_xlsx file
df.to_excel(output_xlsx_file, index=False)
print(f"Successfully output {output_xlsx_file}.")

