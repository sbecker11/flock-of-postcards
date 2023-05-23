
// the global postcards array
var postcards = [];

//
// create_postcards() creates postcards 
// using the given arguments and saves them
// into the global postcards array
//
function create_postcards(N, minDim, maxDim, maxOffsetX, maxOffsetY, gapHeight, zIndexLevels) {
    postcards = [];
    var y_position = 0;

    for (var i = 0; i < N; i++) {
        var width = getRandomInt(minDim, maxDim);
        var height = getRandomInt(minDim, maxDim);

        var x_offset = getRandomGaussian(0, maxOffsetX);
        var y_center = Math.max(y_position + getRandomGaussian(0, maxOffsetY), height / 2);

        // top-most z-index is zero
        var zIndex = getRandomInt(-(zIndexLevels - 1), 0) * 2;
        var zNum2 = zIndexLevels * 2;

        // a brightness factor that ranges from 0 = black to 100% = original colors
        var brightnessPct = 100.0 * (zNum2 + zIndex) / zNum2;

        // depth-senstive blur ranges from -ZIndex pixels to zero pixels
        var blurPx = -zIndex;

        console.log("z: " + zIndex + " brightnessPct: " + brightnessPct.toFixed(2));

        var postcard = {
            'width': width,
            'height': height,
            'offsetX': x_offset,
            'y': y_center,
            'zIndex': zIndex,
            'brightnessPct': brightnessPct,
            'blurPx': blurPx,
            'classname': 'postcard'
        };
        postcards.push(postcard);

        // increment y_position for next postcard
        y_position += height + gapHeight;
    }

    // The last postcard is a zero-width vertical line used to display container center 
    // and to define total container height.
    var height = y_position - gapHeight;
    var lastPostcard = {
        'width': 0.0,
        'height': height,
        'offsetX': 0.0,
        'y': height / 2,
        'zIndex': 10,
        'brightnessPct': 100.0,
        'blurPx': 0,
        'classname': "postcard-line"
    };
    postcards.push(lastPostcard);
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
    var reportInfoElement = document.getElementById("report-info-element");
    reportInfoElement.innerHTML = message;
}

//
// render_postcards() uses the current 
// window.innerWidth to render postcards of the  
// global postcards array as HTML elements centered 
// within the document's canvas" element.
//
function render_postcards() {
    var canvas = document.getElementById("canvas");
    canvas.innerHTML = "";

    var col_half_width = window.innerWidth / 4;

    for (var i = 0; i < postcards.length; i++) {
        var postcard = postcards[i];
        var div = document.createElement("div");
        div.className = postcard.classname;

        div.style.width = postcard.width + "px";
        div.style.height = postcard.height + "px";

        var card_half_width = postcard.width / 2;
        var maxOffsetX = postcard.offsetX;
        var offset_x = (col_half_width > maxOffsetX) ? maxOffsetX :
            (col_half_width >= card_half_width) ? col_half_width - card_half_width :
                0.0;
        div.style.left = Math.round(col_half_width + offset_x - card_half_width) + "px";
        div.style.top = (Math.round(postcard.y) - postcard.height / 2) + "px";
        div.style.zIndex = postcard.zIndex;
        div.style["filter"] = "brightness(" + postcard.brightnessPct / 100.0 + ")";
        var img = document.createElement("img");
        img.src = "https://picsum.photos/" + postcard.width + "/" + postcard.height;
        img.style = "filter:blur(" + postcard.blurPx + "px)";
        div.appendChild(img);
        canvas.appendChild(div);
    }
    reportInfo("render_postcards centered on " + col_half_width);
}

var timeOutFunctionId;

window.onload = function () {
    reportInfo("window.onload start");

    var N = 100;
    var minDim = 200;
    var maxDim = 400;
    var maxOffsetX = 100;
    var maxOffsetY = 20;
    var gapHeight = -35;
    var zIndexLevels = 4;

    reportInfo("calling create_postcards");
    create_postcards(N, minDim, maxDim, maxOffsetX, maxOffsetY, gapHeight, zIndexLevels);

    reportInfo("calling render_postcards");
    render_postcards();

    reportInfo("adding resize listener");
    window.addEventListener("resize", function () {
        clearTimeout(timeOutFunctionId);
        timeOutFunctionId = setTimeout(render_postcards, 500);
    });

    reportInfo("window.onload finish");
};
