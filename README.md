# flock-of-postcards

## Dark, chaotic, (and deep coming soon).  

## Usage:

* Clone this repo to your local development folder    
`cd <your-local-dev-folder>`  
`git clone git@github.com:sbecker11/flock-of-postcards.git` 
* Go into the latest version folder in the newly downloaded repo  
`cd flock-of-postcards/version3`  
* Start http-server  
`http-server`  
* Open this link in your browser:  
`http://localhost:8080/flock-of-cards-3.html`  


## Version 3:   June 7, 2023

Features:
* downloads bizcards from local jobs.csv file  
  * BUT only works when running local instance of http-server from the version3 folder  
* click on a red-div to open a new pink line-item in the right-column  

![Version 3](https://shawn.beckerstudio.com/wp-content/uploads/2023/06/flock-of-cards-3.png)


## Version 2:   June 6, 2023


Features:  
* faded timeline on right side
* linear gradiens at top and bottom
* bizcards are purple and far away from viewer
* cards are red and closer to viewer
* cards turn yellow on rollover  
* horizontal and vertical mouse motion induce motion parallax
* parallax decreases as distance to viewer increases
* manual vertical scrolling is supported though scrollbar is invisible
* canvas scrolls vertically when mouse approaches top and bottom
* right column for diagnostics

![Version 2](https://shawn.beckerstudio.com/wp-content/uploads/2023/06/flock-of-cards-2.png)


## Version 1 - May 23, 2023


Features:  
* randomized div sizes, locations, and z-index
* z-index affects opacity and brightness
* autogenerated images from web
* vertical stack of divs moved to left-column center on load and resize
* vertical scrollbar
* fat middle line for diagnositcs
* right column for diagnostics

![version 1](https://shawn.beckerstudio.com/wp-content/uploads/2023/05/flock-of-postcards.png)
