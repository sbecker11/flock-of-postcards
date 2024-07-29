# flock-of-postcards  
# Dark, chaotic, and deep  

This`flock-of-postcards` web app is a visualization tool use to explore a person's work history, education, and skills as 
defined in a standard resume.

The tool is meant to be rather chaotic, so I hope the following explaination helps.

# Experience your flock

Large `business cards`are used to describe various jobs, each with its role, employer, and time period. These cards are large, massive, slow moving, and far away from your view. Each `business card` is surrounded by its flock of smaller `skill cards`that hovers around it.

The `left panel` contains the interactive flock viewer. The right panel shows `details` of previously selected cards.

Scroll the mouse vertically to slide over the `timeline`. Mouse motion attracts the `point-of-view`, shown as a `bulls-eye` <img src="static_content/icons/bulls-eye.png" width=11>, which has with mass and inertia. The resulting`motion parallax` and fuzzy `depth of field` give the flock its sense of 3-D depth. 

Click on a `business card` or `skill card` to make it pop it into focus at the top of the flock, and to see its details pop into view in the right-hand `details` area. 

# Build your flock

The flock is defined in an offline-editable Excel spreadsheet. Each column contains the employer, date range, role, and a list of responsibilities of that job.

Each skill is marked up in with \[square brackets\] in the job description, and is displayed as a clickable link that pops up its `skill card`.

Web links are marked up with \(parens\) and are displayed with clickable world wide web icons <img src="static_content/icons/icons8-url-16-white.ico" width=11>. 

Image links are marked up with  \{curly braces\} and are displayed as clickable image icons <img src="static_content/icons/icons8-img-16-white.png" width=11>. 

A `skill card` is created for each \[square\] bracketed phrase in the job description. A skill is typically used over many jobs, so each `skill card` has one or more return icons <img src="static_content/icons/icons8-back-16-black.png"> that serve as clickable links back to jobs that used that skill. The number 
of return icons indicates the number of jobs and the amount of time used to hone that skill.

# Run your flock  
The interactive `flock-of-postcards` resume visualization app can be run using `VSCode` with the `LiveServer` extension.

## First clone this repo to your local development folder   
`cd <your-local-dev-folder>`  
`git clone git@github.com:sbecker11/flock-of-postcards.git`  
`cd <your-local-dev-folder>/flock-of-postcards`  

## Install VSCode + LiveServer  

The `flock-of-postcards` webapp uses ES6 Modules. This requires that you have an ultra lightweight webserver running on your local machine that supports ES6. 

`LiveServer` is an ultra light weight webserver that works with Google Chrome browser and can be run as a `VSCode IDE` extension.  

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

- You should now be up and running with the website's default configuration which by default shows off MY OWN stellar 
technology career.

But wouldn't it be better to configure the app to show off your own illustrious career?
 
# Customize the webapp to show your own illustrious career

- Go to the project's local home folder  
`cd <your-local-dev-folder>/flock-of-postcards`

- Go to jobs folder  
`cd static_content/jobs`

- Backup the existing `jobs.xlsx`  spreadsheet file using:  
`cp jobs.xlsx original-jobs.xlsx`  

- Then open your `jobs.xlsx` file using your own copy of Microsoft Excel (or any alternative that handles `.xlsx` files) 

### Customize the Jobs Spreadsheet  

The jobs spreadsheet has one column for each job description. 
Each job description has the following rows where you 
need to replace &lt;my values&gt; with your own:  
* role:      &lt;Senior Data Engineer&gt;  
* employer:   &lt;Fannie Mae&gt;  
* start:      &lt;2024-02&gt;  
* end:        &lt;2024-06&gt;  
* z-index:    &lt;2&gt; (1,2 or 3)  
* css name:	 &lt;darkgreen&gt; (for documentation only so can be blank)  
* css RGB:	   &lt;#006900&gt;  
* css color:	 (Excel cell background fill color, for documentation only so can be blank)  
* text color: &lt;#FFFFFF&gt; (use white for dark cards, black for light cards)   
* description:  &lt;description&gt;  

The `description` cell holds a bulleted sentences of the various responsibilities associated with the job. Each responsiblity may include skills, terms, or that can be wrapped with \[square brackets\] to create the flock of `skill cards` for the job's `business card`. You can also use parens or curly braces to open a web page or an image in a new brower window.  


### Regenerate the Jobs module  

- Save your updated Excel file in the jobs folder

- Create, activate, and initialize a python virtal environment by running: 
`./first-run.sh`

- This makes the following calls:  
`python -m venv venv`  
`source venv/bin/activate`  
`pip install -r requirements.txt`  
 
- It also runs the python script that converts the Excel jobs spreadsheet file `jobs.xlsx` into a NodeJS module file `jobs.mjs`  
`python xlsx2mjs.py`  

If the app is already running, it will re-load the `jobs.mjs` file and you should now be able to visualize your own resume as a glorious flock of postcards





## Future work ideas  
- Parse a resume PDF file to automatically find jobs, responsibilities, skills, college degrees, certifications, licenses, patents, publications, and social websites.      
- Add, edit, or remove jobs from the app directly.  
- Output the edited jobs to a `.json` file.   
- Choose a resume format and print the jobs as a new PDF file.  
- Click and drag the `bulls-eye` to move the `point-of-view` directly.  
- Render `bizcards` as 3D blocks.  
- Rotate a 3D `bizcard block` as it floats to the top.   
- Add a `debug panel` with an on/off button.  
- Skill card return icons need review.  


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

