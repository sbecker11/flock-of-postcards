#!/bin/bash
if [ "$#" -ne "1" ]; then
  echo "Usage $0 <SRC_IMG_DIR>"
  echo " example: $0 images/images_fitted_200"
  exit 1
fi

SRC_IMG_DIR=$1

echo "image_paths = [" > tmp_file ; 
for i in $(ls ${SRC_IMG_DIR}); do 
  echo "@@static_content/media/${SRC_IMG_DIR}/$i@@," >> tmp_file; 
done; 
echo "];" >> tmp_file;
sed 's/@@/"/g' tmp_file > image_paths.js
rm tmp_file

echo "SUCCESS"
echo "$(cat image_paths.js | grep ${SRC_IMG_DIR} | wc -l) items created in image_paths.js"

