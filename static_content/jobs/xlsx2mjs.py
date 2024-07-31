import pandas as pd 
import numpy as np
import json
import re
import requests
import argparse
import os

def check_link_urls(list_of_dicts):
    """
    Check the validity of URLs in the Descriptions in the given list of dictionaries.

    Args:
        list_of_dicts (list): A list of dictionaries containing Descriptions which may contain URLs.

    Returns:
        list: A new list of dictionaries with URLs in Descriptions checked for validity and modified if necessary.
    """

    def is_valid_url(url):
        """
        Check if a given URL is valid by sending a HEAD request and checking the response status code.

        Args:
            url (str): The URL to check.

        Returns:
            bool: True if the URL is valid (status code 200), False otherwise.
        """
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
        }

        try:
            normalized_url = url.rstrip('/')
            response = requests.head(normalized_url, headers=headers, allow_redirects=True, timeout=5)
            return response.status_code == 200 # 200 is valid
        except requests.RequestException:
            return False

    # Create regex patterns for web links formatted as [label](url) with parens
    web_link_pattern = re.compile(r'\[([^\]]+)\]\((http[s]?://[^\)]+)\)')
    
    # Create regex patterns for image links formatted as [label]{url} with curly braces
    image_link_pattern = re.compile(r'\[([^\]]+)\]\{(http[s]?://[^\}]+)\}')

    # Create an empty list to store the checked list of dictionaries
    checked_list_of_dicts = []
    
    num_links_removed = 0

    # Check descriptions of each dict_item in list_of_dicts
    # and remove any invalid web link or image link if found
    for dict_item in list_of_dicts:
        new_dict_item = dict_item.copy()
        description = new_dict_item.get('Description', '')
        original_description = description  # Keep track of the original description

        # Check web links formatted as [label](url) with parens in the Description
        for match in web_link_pattern.finditer(description):
            label, url = match.groups()
            if not is_valid_url(url):
                print(f'Removing invalid web link: [{label}]({url})')
                num_links_removed += 1
                description = description.replace(f"[{label}]({url})", label)

        # Check image links formatted as [label]{url} with curly braces in the Description
        for match in image_link_pattern.finditer(description):
            label, url = match.groups()
            if not is_valid_url(url):
                print(f'Removing invalid image link: [{label}]({url})')
                num_links_removed += 1
                description = description.replace(f'[{label}]{{{url}}}', label)

        # if description was modified then use it to update the dict_item
        if description != original_description:
            new_dict_item['Description'] = description
        
        # always append the new_dict_item to the checked_list_of_dicts
        checked_list_of_dicts.append(new_dict_item)

    print(f'Number of invalid links removed: {num_links_removed}')
    return checked_list_of_dicts

def update_mjs_from_xlsx(xlsx_path, mjs_path):
    """
    Update jobs.mjs from jobs.xlsx.

    Args:
        xlsx_path (str): The path to the Excel file.
        mjs_path (str): The path to the JavaScript file.
    """ 
    # Read the Excel file into a pandas DataFrame
    df = pd.DataFrame(pd.read_excel(xlsx_path)) 
    df['start'] = df['start'].astype(str)
    df['end'] = df['end'].astype(str)

    # Replace NaN values with None
    df = df.replace({np.nan: None})

    # Convert the DataFrame to a list of dictionaries
    list_of_dicts = df.reset_index().to_dict(orient='records')

    # Check the validity of URLs in the list of dictionaries
    checked_list_of_dicts = check_link_urls(list_of_dicts)

    # Write the checked list of dictionaries to jobs.mjs
    with open(mjs_path, 'w') as mjs_file:
        mjs_file.write('const jobs = ')
        mjs_file.write(json.dumps(checked_list_of_dicts))
        mjs_file.write(';')

def main():    
    parser = argparse.ArgumentParser(description="Process jobs.xlsx and update jobs.mjs")

    # Add arguments
    parser.add_argument('xlsx_path', type=str, help='The path to jobs.xlsx')
    parser.add_argument('mjs_path', type=str, help='The path to jobs.mjs')

    # Parse the arguments
    args = parser.parse_args()

    # Get absolute paths
    xlsx_path = os.path.abspath(args.xlsx_path)
    mjs_path = os.path.abspath(args.mjs_path)

    # Print the paths (for debugging purposes)
    print(f"Absolute path to jobs.xlsx: {xlsx_path}")
    print(f"Absolute path to jobs.mjs: {mjs_path}")

    # Your main function logic here
    # For example, you can call a function to update jobs.mjs from jobs.xlsx
    update_mjs_from_xlsx(xlsx_path, mjs_path)


if __name__ == '__main__':
    main()
