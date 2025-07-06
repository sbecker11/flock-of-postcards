#!/usr/bin/env python3
"""
Script to fix camelCase inconsistencies when changing attribute names globally.

Common conversions:
- JobIndex -> JobNumber
- jobIndex -> jobNumber
- selectedJobIndex -> selectedJobNumber
- hoveredJobIndex -> hoveredJobNumber
- etc.

Usage:
    python scripts/fix_camelcase.py <old-name> <new-name>

Example:
    python scripts/fix_camelcase.py job-index job-number
"""

import re
import os
import sys

def kebab_to_camel(kebab_case):
    """Convert kebab-case to camelCase."""
    return ''.join(word.capitalize() if i > 0 else word for i, word in enumerate(kebab_case.split('-')))

def fix_camelcase_attributes(directory, old_name, new_name):
    """
    Fix camelCase inconsistencies when changing attribute names.
    
    Args:
        directory: Directory to search in
        old_name: Old attribute name (e.g., 'job-index')
        new_name: New attribute name (e.g., 'job-number')
    """
    # Convert kebab-case to camelCase for the pattern
    old_camel = kebab_to_camel(old_name)
    new_camel = kebab_to_camel(new_name)
    
    # Pattern to find lowercase letter + oldCamelCase
    pattern = rf'([a-z]){old_camel}'
    replacement = rf'\1{new_camel}'
    
    print(f"Searching for pattern: {pattern}")
    print(f"Replacing with: {replacement}")
    
    files_changed = 0
    
    # Walk through all .mjs files
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.mjs'):
                filepath = os.path.join(root, file)
                
                # Read file
                with open(filepath, 'r') as f:
                    content = f.read()
                
                # Apply regex replacement
                new_content = re.sub(pattern, replacement, content)
                
                # Write back if changed
                if new_content != content:
                    with open(filepath, 'w') as f:
                        f.write(new_content)
                    print(f"Fixed: {filepath}")
                    files_changed += 1
    
    print(f"\nTotal files changed: {files_changed}")

def main():
    if len(sys.argv) != 3:
        print("Usage: python scripts/fix_camelcase.py <old-name> <new-name>")
        print("Example: python scripts/fix_camelcase.py job-index job-number")
        sys.exit(1)
    
    old_name = sys.argv[1]
    new_name = sys.argv[2]
    
    print(f"Fixing camelCase inconsistencies:")
    print(f"Old name: {old_name}")
    print(f"New name: {new_name}")
    print(f"Old camelCase: {kebab_to_camel(old_name)}")
    print(f"New camelCase: {kebab_to_camel(new_name)}")
    print("-" * 50)
    
    fix_camelcase_attributes('.', old_name, new_name)

if __name__ == "__main__":
    main() 