import uuid
import subprocess
import argparse
import sys

def main():
    """
    Downloads files from a list of URLs provided in an input file.
    Each URL is saved to a randomly named .mp4 file.
    """
    parser = argparse.ArgumentParser(description="Download files from a list of URLs.")
    parser.add_argument("input_file", help="Path to the file containing URLs, one per line.")
    args = parser.parse_args()

    try:
        with open(args.input_file, 'r') as file:
            urls = file.readlines()
    except FileNotFoundError:
        print(f"Error: Input file not found at '{args.input_file}'", file=sys.stderr)
        sys.exit(1)

    for url in urls:
        # Remove leading/trailing whitespace, especially the newline character
        clean_url = url.strip()
        if not clean_url:
            continue

        outfile = f"{uuid.uuid4().hex[:8]}.mp4"
        
        # Note: curl's option for output file is -o or --output, not --outfile
        # Using -L to follow redirects is also good practice.
        command = ["curl", "-L", "-o", outfile, clean_url]
        
        print(f"Downloading from {clean_url} to {outfile}...")
        
        try:
            # check=True will raise a CalledProcessError if curl returns a non-zero exit code
            subprocess.run(command, check=True, capture_output=True, text=True)
            print(f"Successfully downloaded to {outfile}")
        except subprocess.CalledProcessError as e:
            print(f"Error downloading from {clean_url}:", file=sys.stderr)
            # Print curl's error output for debugging
            print(e.stderr, file=sys.stderr)
        except FileNotFoundError:
            print("Error: 'curl' command not found. Please ensure it is installed and in your PATH.", file=sys.stderr)
            sys.exit(1)

if __name__ == "__main__":
    main()
