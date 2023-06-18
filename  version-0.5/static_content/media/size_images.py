import os
import sys
import shutil
from PIL import Image
import time

def create_directory(directory):
    try:
        os.makedirs(directory)
    except FileExistsError:
        pass

def process_image(downloaded_images_dir, sized_images_dir, error_images_dir):
    errors = []
    sized_count = 0
    skipped_count = 0
    failed_count = 0
    start_time = time.time()

    create_directory(sized_images_dir)
    create_directory(error_images_dir)

    if not os.path.exists(downloaded_images_dir):
        print(f"Failure: Directory '{downloaded_images_dir}' does not exist.")
        return

    for filename in os.listdir(downloaded_images_dir):
        try:
            file_path = os.path.join(downloaded_images_dir, filename)

            if not os.path.isfile(file_path):
                skipped_count += 1
                continue

            name, extension = os.path.splitext(filename)

            with Image.open(file_path) as image:
                width, height = image.size

            sized_filename = f"{name}-{width}x{height}{extension}"
            sized_file_path = os.path.join(sized_images_dir, sized_filename)

            if os.path.exists(sized_file_path):
                print(f"Skipped: File '{filename}' already exists in '{sized_images_dir}'.")
                skipped_count += 1
                continue

            shutil.copy2(file_path, sized_file_path)

            print(f"Sized: '{filename}' saved as '{sized_filename}' in '{sized_images_dir}'.")
            sized_count += 1

        except Exception as e:
            error_message = f"Error processing '{filename}': {str(e)}"
            errors.append(error_message)
            print(f"Failed: {error_message}")
            failed_count += 1

            # Append error message to errors.log
            with open("errors.log", "a") as f:
                f.write(error_message + "\n")

            # Move file to error_images_dir
            error_file_path = os.path.join(error_images_dir, filename)
            shutil.move(file_path, error_file_path)

    elapsed_time = time.time() - start_time

    print("\nSummary:")
    print(f"Total files processed: {sized_count + skipped_count + failed_count}")
    print(f"Sized files: {sized_count}")
    print(f"Skipped files: {skipped_count}")
    print(f"Failed files: {failed_count}")
    print(f"Total elapsed time: {elapsed_time} seconds")

    if errors:
        with open("errors.log", "a") as f:
            f.write("\n".join(errors))

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python size_image.py downloaded_images_dir sized_images_dir error_images_dir")
        sys.exit(1)

    downloaded_images_dir = sys.argv[1]
    sized_images_dir = sys.argv[2]
    error_images_dir = sys.argv[3]

    process_image(downloaded_images_dir, sized_images_dir, error_images_dir)
