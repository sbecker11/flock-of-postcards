# Create image directories required for the `flock-of-postcards/version-0.4` project

## installation  

This process has been tested on macOS Ventura 13.4.

### clone the `flock-of-postcards` project from github to your local development area  

    `git clone https://github.com/sbecker11/flock-of-postcards.git`

### go to the `static_content/media` directory of `version-0.4` in the `flock-of-postcards` project

    cd flock-of-postcards/version-0.4/static_content/media

### create the python virtual environment, `venv` 

    python3 -m ven venv  

### activate the local venv  

    source venv/bin/activate  

### upgrade pip, as a precaution  

    python3 -m pip install --upgrade pip  

### install all required python packages  

    pip install -r requirements.txt  

### install `xmlstarlet` using homebrew  

    brew install xmlstarlet  

## get the data

### get an xml dump of all media from my account at beckerstudio at WordPress  

    open https://shawn.beckerstudio.com/wp-admin/export.php  

First select "media", then click "Download Export File". 
Rename the newly downloaded file to `wordpress-media.xml`
and move it to this `media` folder.  

### filter out the media files in the xml file using `xmlstarlet`  

    xmlstarlet sel -t -v "//guid" wordpress-media.xml > img-urls.txt  

use `xmlstarlet` to filter the media files from the xml file into  
`img-urls.txt`  


### download the img files listed in `img-urls.txt` into `images/downloaded_images`  

    python3 download_images.py img-urls.txt images/downloaded_images  

This downloads the image files to the `downloaded/images` directory.
[skips the download if the file is already found locally]  
[download failures may still need to be logged to `errors.log`  

## process the image files

### create a "sized" version of each downloaded image to `images/src_images`  

    python3 size_images.py images/downloaded_images images/src_images images/error_images  

This renames each downloaded file from  
 `<filename>.<extension>` to `<filename>-<width>x<height>.<extension>`  
and saved to the  `images/src_images` directory  
[skips sizing if the sized image already exists]  
[to do? for any src image that fails processing, the error needs to logged to `errors.log` and the src file needs to be moved to `error_images`]  

### create "scaled" versions of each "sized" image in `images/src_images`  

    python3 scale_images.py images/src_images images/images_12.5 12.5 images/images_25 25 images/images_50 50

This saves scaled versions to `images/images_12.5`, `images/images_25`, and `images/images_50`,  
[skips scaling if scaled image file already exists]  
[to do? for any src image that fails processing, the error needs to logged to `errors.log` and the src file needs to be moved to `error_images`]  


### review the contents of the `images` directory  

## import data into the web page 

    create_image_paths_js_file 

