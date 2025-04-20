# flock-of-postcards  
# Dark, chaotic, and deep  

The `flock` is a glorified resume describing my own work history and skills over my career timeline.

![The flock](/static_content/graphics/version-0.6-50.gif)

Large `business cards`are used to describe various jobs, each with its role, 
employer, and time period. These cards are larger, slowing moving, and further away from your view. Each `business card` is surrounded by its flock of
smaller `skill cards`that hovers around them.

Mouse motion over the left side of the window causes your point of view to move around, using`motion parallax` and a fuzzy `depth of field`to give the flock its sense of depth. 

Moving the mouse vertically also causes your view to slide over the `career imeline` shown on the far left edge. 

Click on a `business card` or `skill card` to make it pop it into focus at the top of the flock, and to see its details in the right-hand details area. 

Each job can have a long description, which is defined in an offline-editable Excel spreadsheet. Each description contains related skills, terms, and tools used for that job.

Each skill is marked up in with \[square brackets\] in the spreadsheet description, and is displayed as a clickable link that pops up its `skill card`.

Web links are marked up with \(parens\) in the spreadsheet and are displayed with clickable world wide web icons <img src="static_content/icons/icons8-url-16-white.ico">. 

Image links are marked up with  \{curly braces\} in the spreadheet and are displayed as clickable image icons <img src="static_content/icons/icons8-img-16-white.png'>. 

A `skill card` is created for each \[square\] bracketed phrase in the job description. A skill is typically used over many jobs, so each `skill card` has 
one or more return icons <img src="static_content/icons/icons8-back-16-black.png"> that serve as clickable links back to jobs that used that skill. The number 
of return icons indicates the number of jobs and the amount of time used to hone that skill.


# Run the `flock-of-postcards` career resume web app using VSCode

## Clone this repo to your local development folder  
`cd <your-local-dev-folder>`
`git clone git@github.com:sbecker11/flock-of-postcards.git`
`cd <your-local-dev-folder>/fock-of-postcards`
 
## Install VSCode + LiverServer  

The `flock-of-postcards` webapp uses ES6 Modules. This requires that you have an ultra lightweight webserver running on your local machine that supports ES6. 

LiveServer is an ultra light weight webserver that works with Google Chrome browser. Installation of Vscode IDE and the LiveServer extension is easy-peasy.  

- Install the  <a href="https://code.visualstudio.com">vscode IDE</a> on your local OS.    
<a href="https://code.visualstudio.com/"><img src="static_content/icons/vscode-IDE-logo.png"/></a>

- Start vscode and open the newly cloned `flock-of-postcards` folder in vscode  

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
`cd <your-local-dev-folder>/fock-of-postcards`

- Go to jobs folder
`cd static_content/jobs`

- Edit the `jobs.xlsx` Microsoft Excel spreadsheet file

### Customize the Jobs Spreadsheet  

The jobs spreadsheet has one row for each job description. 
Each job description has the following columns that you 
need to fill out:
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

- Go back to your shell and run the python script that converts the Excel jobs spreadsheet file `jobs.xlsx` into a NodeJS module file `jobs.mjs`:
`python xlsx2mjs.py`

If the app is already running, it will re-load the `jobs.mjs` file. 

# Behold your own glorious flock of postcards




### Future work

- Provide the option to print the resume to a PDF file
- Need to ease focal point to BullsEye when any skillCardDiv is selected (or clicked?)
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
- Always scroll newly selected bizCardDiv (and optionally its bizcardResumeDiv) into view in selectTheBizcard
- not started 
  in highlightTheDivCardBackArrow 
    unhighlightTheHighlightedDivCardBackArrow 
    update theHighlightedDivCardBackArrow
    find the CardDivResumeDivTagSpan of theHighlightedDivCardBackArrow 
    call highlightTheCardDivResumeDivTagSpan
   in highlightTheCardDivResumeDivTagSpan
    unhighlightTheHighlightedCardDivResumeDivTagSpan
    update theHighlightedCardDivResumeDivTagSpan
    find the cardDivCardBackArrow of theHighlightedCardDivResumeDivTagSpan
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
- Add resume divs to the right-side resume column by selecting business cards.
- Select a postcard or resume div by clicking it, click again to deselect it.
- Selected postcards and resume-divs have a red-dashed border.
- Once selected, a postcard or business card is temporarily moved above the flock where is not subject to motion parallax.
- Click on a postcard to select and scroll its resume div into view.
- Click on a resume div to select and scroll its postcard into view.
- The canvas viewport shows "BullsEye" with a plus sign at canvas center, where parallax effect is zero.
- FocalPoint defaults back to the viewport center BullsEye when it leaves the canvas.
- The focalPoint starts tracking the mouse as soon as it re-enters the canvas area.
- Canvas auto-scrolling starts when the focalPoint is in top or bottom quqrter of the canvas.
- Autoscrolling stops when the focalPoint moves to viewport center and when the mouse leaves the canvas.
- Click on a resume div's top-right delete button to delete it.
- Click on the bottom-right green next button to open and select the resume div for the next business card.
- Skill postcards inherit the color of its parent business card.
- Click the underlined text in a business cards resume div to select and bring that skill postcard into view over the flock.


### version 0.4:   June 18, 2023

- scripted process to convert WordPress media dump xml file into a javascript file of img paths of resized local img files (not included in github) for html inclusion.
- scripted process to convert excel jobs.xlsx spreadsheet file (included in github) into a javascript file of job objects for html inclusion.
- right side now has fixed header and footer and an auto-scolling content.
- click on a any postcard or underlying buisness card to add a new deleteble resume div to the right column.


### version 0.3:   June 7, 2023

- downloads bizcards from local jobs.csv file  
  - BUT only works when running local instance of http-server from the version3 folder  
- click on a red-div to open a new pink resume-div in the right-column  


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

- randomized div sizes, locations, and z-index
- z-index affects opacity and brightness
- autogenerated imgs from web
- vertical stack of divs moved to canvas-container center on load and resize
- vertical scrollbar
- fat middle line for diagnositcs
- right column for diagnostics


## Resume Divs

The resume divs are created dynamically when a user clicks on a card in the left panel. Each resume div contains:

1. A content area that displays the card's information and description
2. A right column with control buttons (delete, follow)
3. Month indicators showing the duration of the position/project

Resume divs can be:
- Selected/deselected by clicking
- Deleted using the delete button
- Followed/unfollowed (for business cards) using the follow button
- Scrolled into view when selected

The styling and behavior of resume divs is controlled by CSS classes and JavaScript event handlers in main.js.

## Features in Detail

### Visual Effects

#### Motion Parallax
- Cards move in response to mouse position, creating a 3D depth effect
- Movement speed varies based on z-index - closer cards move more than distant ones
- Smooth easing transitions when the focal point changes
- Automatic depth-of-field blur effect based on distance from focal point

#### Dynamic Card Behavior
- Business cards float slowly in a contained area
- Skill cards orbit around their associated business cards
- Cards brighten on hover to indicate interactivity
- Selected cards animate to a prominent position above the flock
- Smooth transitions between card states and positions

#### Timeline Visualization
- Vertical timeline shows career progression
- Business cards align with their corresponding time periods
- Visual indicators for current position and duration
- Automatic scrolling when focal point nears timeline edges

### Interaction Model

#### Mouse Controls
- Move mouse to control viewpoint and parallax effect
- Hover over cards to highlight and show details
- Click cards to select and view full information
- Auto-scrolling when mouse approaches canvas edges

#### Card Selection
- Click any card to select it and view details
- Selected cards move above the flock for clear viewing
- Double-click to deselect and return card to flock
- Visual feedback for selection state

#### Resume Block Management
- Dynamic creation of resume divs when cards are selected
- Delete button to remove sections
- Follow button to navigate between related cards
- Automatic scrolling to keep selected content in view

### Technical Implementation

#### Data Structure
- Excel spreadsheet for easy content management
- Automatic conversion to JavaScript module
- Separation of content and presentation
- Efficient storage and retrieval of card relationships

#### Performance Optimization
- Efficient parallax calculations
- Smooth animation transitions
- Optimized card rendering
- Responsive design for different screen sizes

#### Markup System
- [Square brackets] for skill references
- (Parentheses) for web links
- {Curly braces} for image links
- Automatic conversion to interactive elements

#### Browser Compatibility
- Uses modern ES6 modules
- Compatible with major browsers
- Requires local server for development
- Lightweight implementation with no heavy frameworks

## Customization Options

### Visual Styling
- Customize card colors and gradients
- Adjust motion sensitivity and speed
- Modify card sizes and spacing
- Configure timeline appearance

### Content Structure
- Define custom skill categories
- Adjust card relationships
- Modify timeline scale
- Customize card layouts

### Interaction Settings
- Configure mouse sensitivity
- Adjust auto-scroll behavior
- Modify selection animations
- Customize navigation controls

## Development Guidelines

### Code Organization
- Modular ES6 structure
- Clear separation of concerns
- Consistent naming conventions
- Comprehensive documentation

### Best Practices
- Semantic HTML structure
- Efficient CSS selectors
- Optimized JavaScript performance
- Responsive design principles

### Testing
- Cross-browser compatibility
- Performance benchmarking
- Interaction testing
- Content validation

