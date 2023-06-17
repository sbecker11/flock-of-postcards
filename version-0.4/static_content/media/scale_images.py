import os
import re
import time
import imageio
from PIL import Image
import sys

def process_images(src_directory, scaled_directories, error_log):
    if not os.path.exists(src_directory):
        print(f"Source directory '{src_directory}' does not exist.")
        return

    os.makedirs('images', exist_ok=True)
    os.makedirs('error_images', exist_ok=True)

    num_resized = {}
    num_failed = {}
    num_found = {}
    start_time = time.time()

    for scaled_dir, scale_factor in scaled_directories.items():
        target_directory = f"images/{scaled_dir}"
        os.makedirs(target_directory, exist_ok=True)
        num_resized[scaled_dir] = 0
        num_failed[scaled_dir] = 0
        num_found[scaled_dir] = 0

        print(f"Processing images for scale factor {scale_factor}...")

        for filename in os.listdir(src_directory):
            if not os.path.isfile(os.path.join(src_directory, filename)):
                continue

            match = re.match(r'(.*?)-(\d+)x(\d+)\.(\w+)$', filename)
            if not match:
                log_error(error_log, f"Invalid filename format: {filename}")
                num_failed[scaled_dir] += 1;
                continue

            original_name = match.group(1)
            original_width = int(match.group(2))
            original_height = int(match.group(3))
            original_extension = match.group(4)

            try:
                img = Image.open(os.path.join(src_directory, filename))

                # Check if the image is an animated GIF
                if img.is_animated:
                    resized_filename = f"{original_name}.{original_extension}"
                    target_path = os.path.join(target_directory, resized_filename)

                    if os.path.exists(target_path):
                        print(f"Found '{filename}' already saved as '{resized_filename}' in '{scaled_dir}'")
                        num_found[scaled_dir] += 1;
                        continue

                    resize_animated_gif(os.path.join(src_directory, filename), target_path, scale_factor)
                    num_resized[scaled_dir] += 1
                    print(f"Saved resized animated GIF '{target_path}'")
                else:
                    resized_width = original_width // int(1/scale_factor)
                    resized_height = original_height // int(1/scale_factor)
                    new_filename = f"{original_name}-{resized_width}x{resized_height}.{original_extension}"
                    target_path = os.path.join(target_directory, new_filename)

                    if os.path.exists(target_path):
                        print(f"Found '{filename}' already saved as '{new_filename}' in '{scaled_dir}'")
                        num_found[scaled_dir] += 1;
                        continue

                    resized_img = img.resize((resized_width, resized_height))
                    resized_img.save(target_path)
                    num_resized[scaled_dir] += 1
                    print(f"Saved resized image '{target_path}'")

                num_found[scaled_dir] += 1

            except ValueError as ve:
                num_failed[scaled_dir] += 1
                log_error(error_log, f"Error processing file '{filename}': {str(ve)}")
                move_to_error_directory(src_directory, filename)
            except Exception as e:
                num_failed[scaled_dir] += 1
                log_error(error_log, f"Error processing file '{filename}': {str(e)}")
                move_to_error_directory(src_directory, filename)

        print(f"Resizing phase for {scaled_dir} completed.")
        print(f"Number of files found: {num_found[scaled_dir]}")
        print(f"Number of files resized: {num_resized[scaled_dir]}")
        print(f"Number of files failed: {num_failed[scaled_dir]}")
        print()

    end_time = time.time()
    total_time = end_time - start_time

    print("Overall processing completed.")
    print(f"Total time elapsed: {total_time:.2f} seconds")
    print()

    try:
        compare_directories(list(scaled_directories.keys()), src_directory)
    except Exception as e:
        log_error(error_log, f"Error in compare_directories function: {str(e)}")

def resize_animated_gif(input_file, output_file, scale_factor):
    reader = imageio.get_reader(input_file)
    fps = reader.get_meta_data()['fps']
    writer = imageio.get_writer(output_file, fps=fps)

    for frame in reader:
        resized_frame = imageio.imresize(frame, scale_factor)
        writer.append_data(resized_frame)

    reader.close()
    writer.close()

def log_error(log_file, error_message):
    with open(log_file, 'a') as f:
        f.write(f"Error: {error_message}\n")

def move_to_error_directory(src_directory, filename):
    source_path = os.path.join(src_directory, filename)
    error_directory = 'error_images'
    target_path = os.path.join(error_directory, filename)
    os.rename(source_path, target_path)
    print(f"Moved '{filename}' to '{error_directory}' directory")

def compare_directories(directory_list, src_directory):
    try:
        src_files = set([re.match(r'(.*?)-\d+x\d+\.\w+$', filename).group(1) for filename in os.listdir(src_directory)])
        file_counts = {}

        for scaled_dir in directory_list:
            path = f"images/{scaled_dir}"
            scaled_files = set([re.match(r'(.*?)-\d+x\d+\.\w+$', filename).group(1) for filename in os.listdir(path)])
            file_counts[scaled_dir] = len(scaled_files)

        # Find the directories with file count differences
        diff_directories = []
        for i in range(len(directory_list) - 1):
            for j in range(i + 1, len(directory_list)):
                dir1 = directory_list[i]
                dir2 = directory_list[j]
                if file_counts[dir1] != file_counts[dir2]:
                    diff_directories.append((dir1, dir2))

        # Print the file count differences
        if diff_directories:
            print("File count differences between directories:")
            for diff in diff_directories:
                dir1, dir2 = diff
                print(f"{dir1}: {file_counts[dir1]} files, {dir2}: {file_counts[dir2]} files")
        else:
            print("No file count differences between directories")

        # Find the original name differences between directories
        diff_directories = {}
        for scaled_dir in directory_list:
            path = f"images/{scaled_dir}"
            scaled_files = set([re.match(r'(.*?)-\d+x\d+\.\w+$', filename).group(1) for filename in os.listdir(path)])
            diff_names = src_files - scaled_files
            diff_directories[scaled_dir] = diff_names

        # Print the original name differences
        print("Original name differences between directories:")
        for scaled_dir, diff_names in diff_directories.items():
            print(f"{scaled_dir}:")
            for name in diff_names:
                print(name)
    except Exception as e:
        raise Exception(f"Error in compare_directories function: {str(e)}")

# Get the source directory and scaled directories from command-line arguments
if len(sys.argv) < 5:
    print("Usage: python scale_images.py src_directory scaled_directory1 scale_factor1 scaled_directory2 scale_factor2 ...")
    sys.exit(1)

src_directory = sys.argv[1]
scaled_directories = {}
num_scales = (len(sys.argv) - 2) // 2

for i in range(num_scales):
    index = 2 + i * 2
    scaled_directory = sys.argv[index]
    scale_factor = float(sys.argv[index + 1])
    scaled_directories[scaled_directory] = scale_factor

# Call the process_images function with the command-line arguments
error_log = 'errors.log'
process_images(src_directory, scaled_directories, error_log)
