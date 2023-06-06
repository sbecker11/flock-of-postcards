
// canvas_container is the auto-scrolling viewport with
// dimensions that only change when the window size changes.
const canvas_container = document.getElementById('canvas-container');

// canvas scrolls inside of canvas container
// all postcards are rendered and re-rendered on the canvas
var canvas = document.getElementById('canvas');

// globals to hold global canvas current center
var canvas_container_center_x, canvas_container_center_y;

 // globals to hold global current mouse position
var mouse_x, mouse_y;    

// updated after all postcards are initialized
var canvas_total_height_px; 

// initialize globals
const N = 100; 
var postcards = [];

// image size range
const MIN_IMG_SIZE = 100;
const MAX_IMG_SIZE = 200;

// vertical gap between image centers before randomization
const GAP_HEIGHT = -25; 

// stddev of random y offset from image center
const Y_STDDEV = 10;

// z ranges from zero to MAX_Z
const MAX_Z = 8;

// constant Z vars
var z_index = div_Z = blurPx = brightnessPct = []; 
for ( var z=0; z<= MAX_Z; z++ ) {
    // top-most level is zero, furthest level is MAX_Z
    z_index[z] = -z; // 
    // 0.1 to 0 - parallax decreases as depth increases
    div_Z[z] = linear_interp(z, 0,0.1, MAX_Z,0); 
    // blur increases as depth increases
    blurPx[z] = z; 
    // 100 to 40 percent - brightness dims as depth increases
    brightnessPct[z] = linear_interp(z, 0,100, MAX_Z,40); 
}

//
// use globals to re-initialize the postcard array
//
function initialize_postcards() {
    postcards = [];

    // starting y_position
    var y_position = MIN_IMG_SIZE / 2;

    for (var i = 0; i < N; i++) {
        var img_width = getRandomInt(MIN_IMG_SIZE, MAX_IMG_SIZE);
        var img_height = getRandomInt(MIN_IMG_SIZE, MAX_IMG_SIZE);
        var img_src = "https://picsum.photos/" +img_width + "/" + img_height;

        // x_rand used during rendering is uniform random float between [-1,1]
        var x_rand = Math.random() * 2 - 1;

        var y_center = y_position;
        // random gaussian offset with mean 0
        y_center += getRandomGaussian(0, Y_STDDEV);

        // uniform random int betweeen 0 and MAX_Z
        var Z = getRandomInt(0,MAX_Z);

        var postcard = {
            'img_width': img_width,
            'img_height': img_height,
            'img_src': img_src,
            'x_rand': x_rand,
            'y': y_center,
            'Z': Z,
            'z_index': z_index[Z],
            'div_Z': div_Z[Z],
            'blurPx': blurPx[Z],
            'brightnessPct': brightnessPct[Z],
            'classname': 'postcard'
        };
        postcards.push(postcard);

        // increment y_position for next postcard
        y_position += img_height + GAP_HEIGHT;
    }
    // updated after each initialization
    canvas_total_height_px = y_position;
}

function render_postcards() {

    // first use the globals to compute the h,v parallax offset for each Z level
    var mx2 = (mouse_x - canvas_container_center_x)^2;
    var my2 = (mouse_y - canvas_container_center_y)^2;
    h_parallax = [];
    v_parallax = [];
    for (var z=0; z<=MAX_Z; z++ ) {
        h_parallax[z] = -mx2*div_Z[z];
        v_parallax[z] = -my2*div_Z[z];
    }

    // now clear the canvas
    canvas.innerHTML = ""

    // for each postcard object use the current h and v_parallax
    // to create and add a new div child to the canvas.
    for ( var id=0; id<postcards.length; id++ ) {
        var postcard = postcards[id]
        var Z = postcard.Z

        div = window.document.createElement("div");
        div.id = id;
        div.style.width=postcard.img_width + 'px';
        div.style.height=postcard.img_height + 'px';
        div.style.top=postcard.orig_top + v_parallax[Z] + 'px';
        div.style.left=postcard.orig_left + h_parallax[Z] + 'px';
        div.style.z_index=postcard.z_index;
        div.style["filter"] = "brightness(" + postcard.brightnessPct + ")";
        div.className = postcard.className;

        var img = window.document.createElement("img");
        img.width = postcard.img_width + 'px';
        img.height = postcard.img_height + 'px';
        img.src = postcard.img_src;
        img.style["filter"] = "blur(" + postcard.blurPx + "px)";
        div.appendChild(img);

        canvas.appendChild(div);
    }

    // add the postcard center line
    div = window.document.createElement("div");
    div.style.width = "0px";
    div.style.height = ontainer_total_height_px + "px";
    div.style.top = "0px";
    div.style.left = col_half_width+"px";
    div.style.z_index = z_index[MAX_Z];
    div.className = "postcard-line";
    canvas.addChild(div);

    // update the canvas styling
    canvas.style.top = "0px";
    canvas.style.height = canvas_total_height_px + "px";
    
    reportInfo("flock" + "size:" + (postcards.length - 1) + 
        "<br/>center:" + col_half_width + "px" + 
        "<br/>height:" + canvas.style.height );

}


function linear_interp(x, x0,y0,x1,y1) {
    return  (y1 - y0) / (x1 - x0) * (x - x0) + y0;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomGaussian(mean, stdDev) {
    var u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    var num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return num * stdDev + mean;
}

function reportInfo(message) {
    var reportInfoElement = window.window.document.getElementById("report-info-element");
    reportInfoElement.innerHTML = message;
}

var timeOutFunctionId;

function getCanvas() {
    if ( canvas == null )
        canvas = document.getElementById('canvas');
    return canvas;
}

function updateContainerCenter() {
    canvas = getCanvas();
    canvas_container_center_x = canvas.offsetWidth / 2;
    canvas_container_center_y = canvas.offsetHeight / 2;
}

function handleContainerResize() {
    updateContainerCenter();
    render_postcards();
}

window.onload = function () {

    // re-initialize postcards on every window refresh
    initialize_postcards();

    // initial resize
    handleContainerResize();

    // call handleContainerResize 500 millis after each window resize
    window.addEventListener("resize", function () {
        clearTimeout(timeOutFunctionId);
        timeOutFunctionId = setTimeout(handleContainerResize, 500);
    });

    // re-render on mousemove
    window.addEventListener("mousemove", function(event) {
        mouse_x = event.clientX;
        mouse_y = event.clientY;
        render_postcards();
    });
};
