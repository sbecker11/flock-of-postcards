import os
import sys
import time
import shutil
import logging
from PIL import Image

# example call
# python3 fit_images.py images/images_12.5 images/images_fitted_200 images/image_errors 200

def scale_image(img_path, target_max_size):
    img = Image.open(img_path)
    width, height = img.size
    aspect_ratio = width / height

    if width <= target_max_size and height <= target_max_size:
        return img, "Copied"

    if width > height:
        new_width = target_max_size
        new_height = int(new_width / aspect_ratio)
    else:
        new_height = target_max_size
        new_width = int(new_height * aspect_ratio)

    scaled_img = img.resize((new_width, new_height), Image.ANTIALIAS)
    return scaled_img, f"Scaled ({new_width}/{width}, {new_height}/{height})"


def process_images(src_img_dir, dst_img_dir, errors_dir, target_max_size):
    copied_count = 0
    scaled_count = 0
    skipped_count = 0
    failed_count = 0

    start_time = time.time()

    # Create the destination directory if it doesn't exist
    os.makedirs(dst_img_dir, exist_ok=True)

    # Create the errors directory if it doesn't exist
    os.makedirs(errors_dir, exist_ok=True)

    # Configure logging
    logging.basicConfig(
        filename="error.log",
        level=logging.ERROR,
        format="%(asctime)s %(levelname)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    try:
        for filename in os.listdir(src_img_dir):
            src_path = os.path.join(src_img_dir, filename)

            try:
                img, operation = scale_image(src_path, target_max_size)

                if operation == "Copied":
                    dst_filename = filename
                    copied_count += 1
                else:
                    new_width, new_height = img.size
                    dst_filename = f"{filename}_{new_width}_{new_height}"
                    scaled_count += 1

                dst_path = os.path.join(dst_img_dir, dst_filename)

                if os.path.exists(dst_path):
                    skipped_count += 1
                    print(f"Skipped {filename}: File already exists")
                else:
                    img.save(dst_path)
                    print(f"Processed {filename}: {operation}")

            except Exception as e:
                logging.error(f"Error processing {filename}: {str(e)}")
                failed_count += 1
                shutil.move(src_path, os.path.join(errors_dir, filename))
                print(f"Failed to process {filename}")

    except FileNotFoundError:
        print(f"Source image directory '{src_img_dir}' does not exist.")
        return

    end_time = time.time()
    total_time = end_time - start_time

    print(f"\nSummary:")
    print(f"Copied: {copied_count}")
    print(f"Scaled: {scaled_count}")
    print(f"Skipped: {skipped_count}")
    print(f"Failed: {failed_count}")
    print(f"Total time taken: {total_time:.2f} seconds")


if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Usage: python app.py src_img_dir dst_img_dir errors_dir target_max_size")
    else:
        src_img_dir = sys.argv[1]
        dst_img_dir = sys.argv[2]
        errors_dir = sys.argv[3]
        target_max_size = int(sys.argv[4])

        process_images(src_img_dir, dst_img_dir, errors_dir, target_max_size)
