# """
# generate_html_page function

# Render a list of postcards on an HTML page 
# using JavaScript.

# Each postcard is a python dictionary with 
# integer properties width, height, x, and y

# postcards are positioned vertically along the y 
# axis starting at the top edge of the canvas 
# with gaps of gapHeight without overlapping. 

# Once vertical centers are defined, offset both 
# x and y coordinates of postcard centers with 
# maxOffset so some postcards  may partially 
# overlap its neighbors.

# Render the rounded x and y center coordinates
# at the center of each postcard

# Fill each postcard with an img with url of
# the form https://picsum.photos/{width}/{height}
# Give the html page a black background and add 
# a 3 pixel white border around each image.
# 
# make the html page fill the current full screen width

# allow vertical scrolling on vertical mouse drag
#
# x coordinates of postcard centers should be near the center of full-screen width.


# Define generate_two_column_html_page() as a adaption of 
# the generate_one_column_html_page to generate two columns 
# of equal width.

# The sliding rect images are put into the left column. The 
# right column is static white text on a dark-grey background. 
# Right side vertical scollbar automatically shown when
# the height of static content exceeds the viewport height.

def generate_two_column_html_page(postcards):
    postcards_str = str(postcards).replace("'", '"')
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>postcards Rendering</title>
        <style>
            body {{
                background-color: black;
                margin: 0;
                padding: 0;
                overflow: hidden;
            }}
            #container {{
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                height: 100vh;
                width: 100vw;
            }}
            #canvas-container {{
                overflow-y: scroll;
                position: relative;
                display: flex;
                justify-content: center;
            }}
            #canvas {{
                position: relative;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border: 1px solid black;
            }}
            .postcard-line {{
                position: absolute;
                border: 10px dashed rgba(255, 255, 255, .5);;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }}
            .postcard {{
                position: absolute;
                border: 3px solid white;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }}
            .postcard img {{
                width: 100%;
                height: 100%;
                object-fit: cover;
            }}
            #fixed-content {{
                background-color: darkgray;
                color: white;
                padding: 20px;
                height: 100%;
                overflow: auto;
            }}
        </style>
    </head>
    <body>
        <div id="container">
            <div id="canvas-container">
                <div id="canvas"></div>
            </div>
            <div id="fixed-content">
                <!-- Your fixed webpage content goes here -->
                <h1>Fixed Content</h1>
                <p>This is the fixed content in the right column.</p>
                <div><p id="report-info-element">WIDTH_VALUE:</p></div>
            </div>
        </div>
        <script>
        
            function reportInfo(message) {{
                var reportInfoElement = document.getElementById("report-info-element");
                reportInfoElement.innerHTML = message;
            }}
            
            function position_children() {{
                var canvas = document.getElementById("canvas");
                canvas.innerHTML = "";
                
                var postcards = {postcards};
                var col_half_width = window.innerWidth / 4;

                for (var i = 0; i < postcards.length; i++) {{
                    var postcard = postcards[i];
                    var div = document.createElement("div");
                    div.className = "postcard";
                    if ( postcard.width == 0.0 ) {{
                        div.className = "postcard-line";
                    }}
                                        
                    div.style.width = postcard.width + "px";
                    div.style.height = postcard.height + "px";

                    var card_half_width = postcard.width / 2;
                    var maxOffsetX = postcard.offsetX;
                    var offset_x = (col_half_width > maxOffsetX) ? maxOffsetX :
                                   (col_half_width >= card_half_width) ? col_half_width - card_half_width :
                                   0.0;
                    div.style.left = Math.round(col_half_width + offset_x - card_half_width) + "px";
                    div.style.top = (Math.round(postcard.y) - postcard.height / 2) + "px";
                    div.style.zIndex = postcard.z;
                    div.style["filter"] = "brightness(" + postcard.brightness + ")";
                    var img = document.createElement("img");
                    img.src = "https://picsum.photos/" + postcard.width + "/" + postcard.height;
                    img.style = "filter:blur(" + (-postcard.z) + "px)";
                    div.appendChild(img);
                    canvas.appendChild(div);
                    
                }}
                reportInfo("children centered on " + col_half_width);

            }}
            
            var timeOutFunctionId;
                        
            window.onload = function() {{
                position_children();
                
                window.addEventListener("resize", function() {{
                    clearTimeout(timeOutFunctionId);
                    timeOutFunctionId = setTimeout(position_children, 500);
                }});
            }};
        </script>
    </body>
    </html>
    """.format(postcards=postcards_str)

    return html

# """
# generate_postcards function
# given N postcards with independent width and height ranging  
# from minDim to maxDim with a uniform random distribution. 

# postcards are stacked vertically on the Y axis.  Give each 
# postcard center a random offset with a normal
# distribution with 3rd stddev of maxOffset.

# Certainly! Below is a Python function that generates N postcards 
# with random dimensions and offsets as described:
# Returns:
#     a list of postcards where 
#     each postcard is a python dictionary with 
#     integer properties width, height, x, and y
# """

import random
import numpy as np

def generate_postcards(N, minDim, maxDim, maxOffsetX, maxOffsetY, gapHeight):
    postcards = []
    y_position = 0

    for _ in range(N):
        width = random.randint(minDim, maxDim)
        height = random.randint(minDim, maxDim)
        x = random.gauss(0, maxOffsetX)
        y = max(y_position + random.gauss(0, maxOffsetY), height/2)
        z = random.randint(-3,0) * 2
        a = 8+z
        b = a / 8.0
        brightness =  b
        print(f"z:{z:4} a:{a:4} b:{b:4}  brightness:{brightness:0.2}")

        postcard = {
            'width': width,
            'height': height,
            'offsetX': x,
            'y': y,
            'z': z,
            'brightness': brightness
        }
        postcards.append(postcard)
        
        # increment position for next postcard
        y_position += height + gapHeight

    # add final vertical bar
    height = y_position - gapHeight
    postcard = {
        'width': 0.0,
        'height': height,
        'offsetX': 0.0,
        'y': height/2,
        'z': 10,
        'brightness':1.0
    }
    postcards.append(postcard)

    return postcards


# """ 
# Running this code will generate a postcards.html file that, when 
# opened in a web browser, will display the postcards rendered on
# either a two-column canvas or a single-column canvas.
# """

N = 100
minDim = 200
maxDim = 400
maxOffsetX = 100
maxOffsetY = 50
gapHeight = -25
postcards = generate_postcards(N, minDim, maxDim, maxOffsetX, maxOffsetY, gapHeight)

# Generate HTML page
html = generate_two_column_html_page(postcards)

# Write HTML content to filename
filename = 'postcards.html'
with open(filename, 'w') as file:
    file.write(html)

# Open the HTML file
print(f"open {filename}")
