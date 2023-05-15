# """
# generate_html_page function

# Render a list of rectangles on an HTML page 
# using JavaScript.

# Each rectangle is a python dictionary with 
# integer properties width, height, x, and y

# Rectangles are positioned vertically along the y 
# axis starting at the top edge of the canvas 
# with gaps of gapHeight without overlapping. 

# Once vertical centers are defined, offset both 
# x and y coordinates of rectangle centers with 
# maxOffset so some rectangles  may partially 
# overlap its neighbors.

# Render the rounded x and y center coordinates
# at the center of each rectangle

# Fill each rectangle with an img with url of
# the form https://picsum.photos/{width}/{height}
# Give the html page a black background and add 
# a 3 pixel white border around each image.
# 
# make the html page fill the current full screen width

# allow vertical scrolling on vertical mouse drag
#
# x coordinates of rectangle centers should be near the center of full-screen width.

def generate_one_column_html_page(rectangles):
    rectangles_str = str(rectangles).replace("'", '"')
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Rectangles Rendering</title>
        <style>
            body {{
                background-color: black;
                margin: 0;
                padding: 0;
                overflow: hidden;
            }}
            #canvas {{
                position: absolute;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                border: 1px solid black;
                overflow-y: scroll;
            }}
            .rectangle {{
                position: absolute;
                border: 3px solid white;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }}
            .rectangle img {{
                width: 100%;
                height: 100%;
                object-fit: cover;
            }}
        </style>
    </head>
    <body>
        <div id="canvas"></div>
        <script>
            var isDragging = false;
            var startClientY;

            function handleMouseDown(event) {{
                isDragging = true;
                startClientY = event.clientY;
            }}

            function handleMouseUp() {{
                isDragging = false;
            }}

            function handleMouseMove(event) {{
                if (isDragging) {{
                    var deltaY = event.clientY - startClientY;
                    document.getElementById("canvas").scrollTop -= deltaY;
                    startClientY = event.clientY;
                }}
            }}

            window.onload = function() {{
                var canvas = document.getElementById("canvas");
                var rectangles = {rectangles};

                for (var i = 0; i < rectangles.length; i++) {{
                    var rectangle = rectangles[i];
                    var div = document.createElement("div");
                    div.className = "rectangle";
                    div.style.width = rectangle.width + "px";
                    div.style.height = rectangle.height + "px";
                    div.style.left = ((window.innerWidth / 2) + Math.round(rectangle.x) - rectangle.width / 2) + "px";
                    div.style.top = (Math.round(rectangle.y) - rectangle.height / 2) + "px";
                    var img = document.createElement("img");
                    img.src = "https://picsum.photos/" + rectangle.width + "/" + rectangle.height;
                    div.appendChild(img);
                    canvas.appendChild(div);
                }}

                canvas.addEventListener("mousedown", handleMouseDown);
                document.addEventListener("mouseup", handleMouseUp);
                document.addEventListener("mousemove", handleMouseMove);
            }};
        </script>
    </body>
    </html>
    """.format(rectangles=rectangles_str)

    return html

# Define generate_two_column_html_page() as a adaption of 
# the generate_one_column_html_page to generate two columns 
# of equal width.

# The sliding rect images are put into the left column. The 
# right column is static white text on a dark-grey background. 
# Right side vertical scollbar automatically shown when
# the height of static content exceeds the viewport height.

def generate_two_column_html_page(rectangles):
    rectangles_str = str(rectangles).replace("'", '"')
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Rectangles Rendering</title>
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
            .rectangle {{
                position: absolute;
                border: 3px solid white;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }}
            .rectangle img {{
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
            </div>
        </div>
        <script>
            var isDragging = false;
            var startClientY;

            function handleMouseDown(event) {{
                isDragging = true;
                startClientY = event.clientY;
            }}

            function handleMouseUp() {{
                isDragging = false;
            }}

            function handleMouseMove(event) {{
                if (isDragging) {{
                    var deltaY = event.clientY - startClientY;
                    document.getElementById("canvas").scrollTop -= deltaY;
                    startClientY = event.clientY;
                }}
            }}

            window.onload = function() {{
                var canvas = document.getElementById("canvas");
                var rectangles = {rectangles};

                for (var i = 0; i < rectangles.length; i++) {{
                    var rectangle = rectangles[i];
                    var div = document.createElement("div");
                    div.className = "rectangle";
                    div.style.width = rectangle.width + "px";
                    div.style.height = rectangle.height + "px";
                    div.style.left = (Math.round(rectangle.x) + rectangle.width / 2) + "px";
                    div.style.top = (Math.round(rectangle.y) - rectangle.height / 2) + "px";
                    var img = document.createElement("img");
                    img.src = "https://picsum.photos/" + rectangle.width + "/" + rectangle.height;
                    div.appendChild(img);
                    canvas.appendChild(div);
                }}

                canvas.addEventListener("mousedown", handleMouseDown);
                document.addEventListener("mouseup", handleMouseUp);
                document.addEventListener("mousemove", handleMouseMove);
            }};
        </script>
    </body>
    </html>
    """.format(rectangles=rectangles_str)

    return html

# """
# generate_rectangles function
# given N rectangles with independent width and height ranging  
# from minDim to maxDim with a uniform random distribution. 

# Rectangles are stacked vertically on the Y axis.  Give each 
# rectangle center a random offset with a normal
# distribution with 3rd stddev of maxOffset.

# Certainly! Below is a Python function that generates N rectangles 
# with random dimensions and offsets as described:
# Returns:
#     a list of rectangles where 
#     each rectangle is a python dictionary with 
#     integer properties width, height, x, and y
# """

import random
import numpy as np

def generate_rectangles(N, minDim, maxDim, maxOffsetX, maxOffsetY, gapHeight):
    rectangles = []
    y_position = 0

    for _ in range(N):
        width = random.randint(minDim, maxDim)
        height = random.randint(minDim, maxDim)
        x = random.gauss(0, maxOffsetX)
        y = y_position + random.gauss(0, maxOffsetY)
        y_position += height + gapHeight

        rectangle = {
            'width': width,
            'height': height,
            'x': x,
            'y': y
        }
        rectangles.append(rectangle)

    return rectangles


# """ Running this code will generate an rectangles.html file that, when 
# opened in a web browser, will display the rectangles rendered on a 
# canvas. The canvas has a size of 500x500 pixels, and the rectangles 
# will be positioned according to their x and y coordinates, with the 
# center of the canvas at (250, 250). The rectangles will be represented 
# by semi-transparent divd with random images.
# """

N = 100
minDim = 200
maxDim = 400
maxOffsetX = 100
maxOffsetY = 50
gapHeight = -25
rectangles = generate_rectangles(N, minDim, maxDim, maxOffsetX, maxOffsetY, gapHeight)

# Generate HTML page
html = generate_two_column_html_page(rectangles)

# Write HTML content to a file
with open('two_column_rectangles.html', 'w') as file:
    file.write(html)
    
