# flock-of-postcards  
Dark, chaotic, and deep  

## Usage  
- Clone this repo to your local development folder  
`cd <your-local-dev-folder>`  
`git clone git@github.com:sbecker11/flock-of-postcards.git`
- Go into the latest version folder in the newly downloaded repo  
`cd flock-of-postcards`  


## VSCode + LiverServer Installation  

The static 'flock-of-postcards' website has been upgraded to be a webapp that uses ES6 Modules. This requires that you have an ultra light weight webserver running on your local machine that supports ES6. LiveServer is an ultra light weight webserver that works with Google Chrome browser. Installation of the vscode IDE and the LiveServer extension is easy-peasy.  

## Installation instructions for vscode IDE + LiveServer extension  

- Install the  <a href="https://code.visualstudio.com">vscode IDE</a> on your local OS.    
<a href="https://code.visualstudio.com/"><img src="https://shawn.beckerstudio.com/wp-content/uploads/2023/07/vscode-IDE-logo.png"/></a>
- Start vscode and open the newly cloned `flock-of-postcards` folder in vscode  
- Click the "extensions" icon in the left panel of vscode to search for vscode extensions  
<img src="https://shawn.beckerstudio.com/wp-content/uploads/2023/07/vscode-extensions-icon.png"/>  
- Search for and install vscode's <a href="https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer">LiveServer</a> extension  
<a href="https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer"><img src="https://shawn.beckerstudio.com/wp-content/uploads/2023/07/vscode-liveserver-logo.png"/></a>  

## Start up instructions  

- Click the "explorer" icon at the top left of vscode to explore your local filesystem  
<img src="https://shawn.beckerstudio.com/wp-content/uploads/2023/07/vscode-explorer-icon.png"/>  
- Click the "Go Live" button at the bottom right in vscode to start the vscode-embedded webserver  
<img src="https://shawn.beckerstudio.com/wp-content/uploads/2023/07/vscode-go-live-icon.png"/>  
- Note that the "Go Live" button now shows either "Port : 5500" or "Port : 5501"
- Click the button below that matches the "Go Live" button's new Port value:  
    <a href="http://localhost:5500/index.html"><img src="./static_content/graphics/GoLivePort5500.png"/></a>  
    <a href="http://localhost:5501/index.html"><img src="./static_content/graphics/GoLivePort5501.png"/></a>  
   
- Have fun with your local copy of the 'flock-of-postcards' webapp.  

## Development history  

### Planned features:
- Need to ease focal point to bullseye when any cardDiv is selected (or clicked?)
- Need to add stamp icons to post cards
- Click on post card to see full-size image in right-side panel
- Render bizcards as 3D blocks with rounded corners
- Rotate 3D bizcard blocks during transitions
- Toggle debug panel visiblilty with button or key

### version 0.7:   November 18, 2023

#### Features added:  
- Default timeline year avg of min-max years
- Auto-computing timeline min-max years
- Interpolating CURRENT_DATE  in xlsx file
- GoLive link with port 5500 or 5501
- applying parallax on the target for restoreSavedStyle
- replaced addAimationEndListener with endAnimation on a timeout
- Bizcards are now animating to the top, but not staying there
- Bizdards return to original position after losing focus
- fixed selectNextBizcard
- added links to three.js examples
- added links to Virtual Munsell Color Wheel
- added select all skills button
- added selectNext, selectAll, and clearAll buttons


### version 0.6:   July 3, 2023  
<a href="https://shawn.beckerstudio.com/wp-content/uploads/2023/07/version-0.6.gif"><img src="https://shawn.beckerstudio.com/wp-content/uploads/2023/07/version-0.6.png" width="33%" height="33%"/><br/>Click here to see 8MB animated gif</a>

#### Features added:  

- Upgraded static website to use ES6 modules, thus requiring a local webserver that supports ES6.  
- The focal point now eases towards the mouse when it enters the canvas area.  
- The focal point now eases toward the bullsEye when it leaves the canvas areas.  
- Checkout the <a href="https://shawn.beckerstudio.com/wp-content/uploads/2023/07/version-0.6.gif">8 MB animated gif</a>

### version 0.5:   June 26, 2023
<img src="https://shawn.beckerstudio.com/wp-content/uploads/2023/06/flock-of-postcards-version-0.5.png" width="33%" height="33%"/>

#### Features added:  

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
<img src="https://shawn.beckerstudio.com/wp-content/uploads/2023/06/flock-of-postcards-version-0.4.png" width="33%" height="33%"/>

#### Features added:

- scripted process to convert WordPress media dump xml file into a javascript file of image paths of resized local image files (not included in github) for html inclusion.
- scripted process to convert excel jobs.xlsx spreadsheet file (included in github) into a javascript file of job objects for html inclusion.
- right side now has fixed header and footer and an auto-scolling content.
- click on a any postcard or underlying buisness card to add a new deleteble line item to the right column.

### version 0.3:   June 7, 2023
<img src="https://shawn.beckerstudio.com/wp-content/uploads/2023/06/flock-of-cards-3.png" width="25%" height="25%"/>

#### Features added:

- downloads bizcards from local jobs.csv file  
  - BUT only works when running local instance of http-server from the version3 folder  
- click on a red-div to open a new pink line-item in the right-column  


### version 0.2:   June 6, 2023
<img src="https://shawn.beckerstudio.com/wp-content/uploads/2023/06/flock-of-cards-2.png" width="25%" height="25%"/>

#### Features added:  

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

#### Features added:  
- randomized div sizes, locations, and z-index
- z-index affects opacity and brightness
- autogenerated images from web
- vertical stack of divs moved to canvas-container center on load and resize
- vertical scrollbar
- fat middle line for diagnositcs
- right column for diagnostics

