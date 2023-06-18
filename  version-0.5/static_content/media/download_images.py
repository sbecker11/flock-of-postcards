import requests
import os
import sys

# Function to fetch and save an image from a given URL
def fetch_image(url, save_path):
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        with open(save_path, 'wb') as file:
            for chunk in response.iter_content(chunk_size=8192):
                file.write(chunk)
    except Exception as e:
        # Log the error to the error.log file
        with open('error.log', 'a') as error_log:
            error_log.write(f"Error downloading image from {url}: {str(e)}\n")

# Check if the required command line arguments are provided
if len(sys.argv) != 3:
    print("Usage: python fetch_images.py <image_urls_file> <destination_directory>")
    sys.exit(1)

image_urls_file = sys.argv[1]
destination_directory = sys.argv[2]

# Check if the image_urls_file exists
if not os.path.isfile(image_urls_file):
    print(f"Error: {image_urls_file} does not exist.")
    sys.exit(1)

# Create the destination directory if it doesn't exist
os.makedirs(destination_directory, exist_ok=True)

# Read the image URLs from the file
with open(image_urls_file, 'r') as file:
    url_list = file.read().splitlines()

# Fetch and save images from the URLs
for index, url in enumerate(url_list, 1):
    filename = f"image{index}.jpg"
    save_path = os.path.join(destination_directory, filename)

    # Check if the image file already exists
    if os.path.isfile(save_path):
        print(f"Skipping image {index}/{len(url_list)}: {url} (Found)")
    else:
        print(f"Downloading image {index}/{len(url_list)}: {url}")
        fetch_image(url, save_path)

print("Image download complete!")
