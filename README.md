# flock-of-postcards  
# Dark, chaotic, and deep  

This`flock-of-postcards` web app is a glorified resume describing my own work history and skills over my long career timeline.

The app is rather chaotic, so I hope the following explaination helps.

Large `business cards`are used to describe various jobs, each with its role, 
employer, and time period. These cards are larger, heavy, slow moving, and far away from your view. Each `business card` is surrounded by its flock of smaller `skill cards`that hovers around them.

Mouse motion over the left side of the window causes your point of view to move around, using`motion parallax` and a fuzzy `depth of field` which gives the flock its sense of 3-D depth. 

The point of view is marked as a bulls-eye <img src="static_content/icons/bulls-eye.png"> that follow the position of the mouse. The bulls-eye has mass and inertia thus providing a slower and more fluid way to change your perspective. 

Moving the mouse vertically also causes your view to slide over the `career imeline` shown on the far left edge. 

Click on a `business card` or `skill card` to make it pop it into focus at the top of the flock, and to see its details in the right-hand details area. 

Each job can have a long description, which is defined in an offline-editable Excel spreadsheet. Each description contains related skills, terms, and tools used for that job.

Each skill is marked up in with \[square brackets\] in the spreadsheet description, and is displayed as a clickable link that pops up its `skill card`.

Web links are marked up with \(parens\) in the spreadsheet and are displayed with clickable world wide web icons <img src="static_content/icons/icons8-url-16-white.ico">. 

Image links are marked up with  \{curly braces\} in the spreadheet and are displayed as clickable image icons <img src="static_content/icons/icons8-img-16-white.png'>. 

A `skill card` is created for each \[square\] bracketed phrase in the job description. A skill is typically used over many jobs, so each `skill card` has 
one or more return icons <img src="static_content/icons/icons8-back-16-black.png"> that serve as clickable links back to jobs that used that skill. The number 
of return icons indicates the number of jobs and the amount of time used to hone that skill.


# Run the interactive `flock-of-postcards` resume app using VSCode and LiveServer

## Clone this repo to your local development folder   
`cd <your-local-dev-folder>`  
`git clone git@github.com:sbecker11/flock-of-postcards.git`  
`cd <your-local-dev-folder>/flock-of-postcards`  

## Install VSCode + LiverServer  

The `flock-of-postcards` webapp uses ES6 Modules. This requires that you have an ultra lightweight webserver running on your local machine that supports ES6. 

LiveServer is an ultra light weight webserver that works with Google Chrome browser and can be run from the VSCode IDE. Installation of Vscode and the LiveServer extension is easy-peasy.  

- Install the  <a href="https://code.visualstudio.com">vscode IDE</a> on your local OS.    
<a href="https://code.visualstudio.com/"><img src="static_content/icons/vscode-IDE-logo.png"/></a>

- Start vscode and open the folder of the newly cloned `flock-of-postcards` project.  

- Click the "extensions" icon in the left panel of vscode to search for vscode extensions  
<img src="static_content/icons/vscode-extensions-icon.png"/>  

- Search for and install vscode's <a href="https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer">LiveServer</a> extension  
<a href="https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer"><img src="static_content/icons/vscode-liveserver-logo.png"/></a>  


- Click the "explorer" icon at the top left of vscode to explore your local filesystem  
<img src="static_content/icons/vscode-explorer-icon.png"/>  

- Click the "Go Live" button at the bottom right in vscode to start the vscode-embedded webserver  
<img src="static_content/icons/vscode-go-live-icon.png"/> 

- Note that the "Go Live" button now shows either "Port : 5500" or "Port : 5501"

- Click the button below that matches the "Go Live" button's new Port value:  
    <a href="http://localhost:5500/index.html"><img src="./static_content/graphics/GoLivePort5500.png"/></a>  
    <a href="http://localhost:5501/index.html"><img src="./static_content/graphics/GoLivePort5501.png"/></a>  


You should now be up and running with the website's default configuration which shows off MY OWN stellar technology career.

But wouldn't it be better to configure the app to show off your own illustrious career?
 
 # How to customize the webapp to show your own illustrious career

- Go to the project's local home folder  
`cd <your-local-dev-folder>/flock-of-postcards`

- Go to jobs folder  
`cd static_content/jobs`

- Open the `jobs.xlsx`  spreadsheet file using your own copy of Microsoft Excel (or any alternative that handles `.xlsx` files) 

### Customize the Jobs Spreadsheet  

The jobs spreadsheet has one row for each job description. 
Each job description has the following columns that you 
need to replace with your own info:
* role  
* employer  
* start      (YYYY-MM-DD)  
* end        (YYYY-MM-DD)  
* z-index    (from 1 to 3)
* css name	 (darkgreen)
* css RGB	   (#006900)
* css color	 (Excel color background)
* text color (#FFFFFF) or (#000000)
* description  

The `description` cell holds an arbitrary length bulleted job description. As described above, skills, terms, and tools can be wrapped with \[square brackets\] to create a flock of `skill cards` for each `business card`.


### Regenerate the Jobs module  

- Save your updated Excel file

- Go back to the project's cloned home directory  
`cd <your-local-dev-folder>/flock-of-postcards`

- Create, activate, and initialize a python virtal environment  
`python -m venv venv`  
`source venv/bin/activate`  
`pip install -r requirements.txt`  
 
- Run the python script that converts the Excel jobs spreadsheet file `jobs.xlsx` into a NodeJS module file `jobs.mjs`  
`python xlsx2mjs.py`  

If the app is already running, it will re-load the `jobs.mjs` file. 

# Behold your own glorious flock of postcards




### Future work

- Provide the option to print the resume to a PDF file
- Need to ease focal point to bullseye when any cardDiv is selected (or clicked?)
- Need to add stamp icons to post cards
- Click on post card to see it's full-size iomage in right-side detail panel
- Render bizcards as 3D blocks with rounded corners
- Rotate 3D bizcard blocks during transitions
- Toggle debug panel visiblilty with button or key


## Development history  

### version 1.1    July 8, 2024  

- Updated installation and customization instructions in README.md
- Deployed latest to github

<a target="_new" href="https://sbecker11.github.io/flock-of-postcards/">https://sbecker11.github.io/flock-of-postcards</a>

### version 1.0    March 8, 2024 

<a target="_new" href="http://spexture.com/">http://spexture.com</a>

- CURRENT_DATE in job [end] replaced with first day of next month but displayed as 'working'
- Always scroll newly selected bizcardDiv (and optionally its bizcardLineItem) into view in selectTheBizcard
- not started 
  in highlightTheDivCardBackArrow 
    unhighlightTheHighlightedDivCardBackArrow 
    update theHighlightedDivCardBackArrow
    find the CardDivLineItemTagSpan of theHighlightedDivCardBackArrow 
    call highlightTheCardDivLineItemTagSpan
   in highlightTheCardDivLineItemTagSpan
    unhighlightTheHighlightedCardDivLineItemTagSpan
    update theHighlightedCardDivLineItemTagSpan
    find the cardDivCardBackArrow of theHighlightedCardDivLineItemTagSpan
    call highlightTheCardDivCardBackArrow

### version 0.9:   January 4, 2024

### version 0.8:   January 1, 2024
<img src="static_content/graphics/version-0.8.jpg">

### version 0.7:   November 18, 2023

- Default timeline year avg of min-max years
- Auto-computing timeline min-max years
- Interpolating CURRENT_DATE  in xlsx file
- GoLive link with port 5500 or 5501
- applying parallax on the target for restoreSavedStyle
- replaced addAimationEndListener with endAnimation on a timeout
- Bizcards are now animating to the top, but not staying there
- Bizdards return to original position after losing focus
- fixed selectNextBizcard
- added links to three.mjs examples
- added links to Virtual Munsell Color Wheel
- added select all skills button
- added selectNext, selectAll, and clearAll buttons


### version 0.6:   July 3, 2023  

- Upgraded static website to use ES6 modules, thus requiring a local webserver that supports ES6.  
- The focal point now eases towards the mouse when it enters the canvas area.  
- The focal point now eases toward the bullsEye when it leaves the canvas areas.  
-  <img src="static_content/graphics/version-0.6.gif">8 MB animated gif</a>


### version 0.5:   June 26, 2023

- A flock of small skill postcards and larger business cards float over the left-side canvas column.
- A timeline is displayed at ground level, to visualize the date range of employment for each business card.
- A 3-D parallax effect on cards is controlled by the "focalPoint", which tracks the mouse while over the canvas.
- Add line items to the right-side resume column by selecting business cards.
- Select a postcard or resume line item by clicking it, click again to deselect it.
- Selected postcards and line-items have a red-dashed border.
- Once selected, a postcard or business card is temporarily moved above the flock where is not subject to motion parallax.
- Click on a postcard to select and scroll its resume line item into view.
- Click on a resume line item to select and scroll its postcard into view.
- The canvas viewport shows "bullseye" with a plus sign at canvas center, where parallax effect is zero.
- FocalPoint defaults back to the viewport center bullseye when it leaves the canvas.
- The focalPoint starts tracking the mouse as soon as it re-enters the canvas area.
- Canvas auto-scrolling starts when the focalPoint is in top or bottom quqrter of the canvas.
- Autoscrolling stops when the focalPoint moves to viewport center and when the mouse leaves the canvas.
- Click on a resume line item's top-right delete button to delete it.
- Click on the bottom-right green next button to open and select the resume line item for the next business card.
- Skill postcards inherit the color of its parent business card.
- Click the underlined text in a business cards resume line item to select and bring that skill postcard into view over the flock.


### version 0.4:   June 18, 2023

- scripted process to convert WordPress media dump xml file into a javascript file of img paths of resized local img files (not included in github) for html inclusion.
- scripted process to convert excel jobs.xlsx spreadsheet file (included in github) into a javascript file of job objects for html inclusion.
- right side now has fixed header and footer and an auto-scolling content.
- click on a any postcard or underlying buisness card to add a new deleteble line item to the right column.


### version 0.3:   June 7, 2023

- downloads bizcards from local jobs.csv file  
  - BUT only works when running local instance of http-server from the version3 folder  
- click on a red-div to open a new pink line-item in the right-column  


### version 0.2:   June 6, 2023

- faded timeline on right side
- linear gradiens at top and bottom
- bizcards are purple and far away from viewer
- cards are red and closer to viewer
- cards turn yellow on rollover  
- horizontal and vertical mouse motion induce motion parallax
- parallax decreases as distance to viewer increases
- manual vertical scrolling is supported though scrollbar is invisible
- canvas scrolls vertically when mouse approaches top and bottom
- right column for diagnostics


### version 0.1 - May 23, 2023

<img src="https://shawn.beckerstudio.com/wp-content/uploads/2023/05/flock-of-postcards.png" width="25%" height="25%"/>

- randomized div sizes, locations, and z-index
- z-index affects opacity and brightness
- autogenerated imgs from web
- vertical stack of divs moved to canvas-container center on load and resize
- vertical scrollbar
- fat middle line for diagnositcs
- right column for diagnostics

