
function report() {
  var reportElement = document.getElementById('report');
  var redDivs = document.querySelectorAll('.red-div');
  var canvas = document.getElementById('canvas');
  var column = document.querySelector('.right-column');

  var redDivRect = redDivs[0].getBoundingClientRect();
  var canvasRect = canvas.getBoundingClientRect();
  var columnRect = column.getBoundingClientRect();
  var windowRect = {
    top: window.screenY,
    left: window.screenX,
    width: window.outerWidth,
    height: window.outerHeight
  };

  var reportText = 'Red Div Center: ' + (redDivRect.left + redDivRect.width / 2) + ',\n' +
                   'Canvas: ' + JSON.stringify(canvasRect) + ',\n' +
                   'Column: ' + JSON.stringify(columnRect) + ',\n' +
                   'Window: ' + JSON.stringify(windowRect);
  
  reportElement.textContent = reportText;
}

window.addEventListener('load', function() {
  report();
  
  // Create 20 red divs
  var redDivsContainer = document.getElementById('red-divs-container');
  for (var i = 0; i < 20; i++) {
    var redDiv = document.createElement('div');
    redDiv.classList.add('red-div');
    redDiv.style.width = '200px';
    redDiv.style.height = '200px';
    redDiv.style.margin = '20px';
    redDiv.style.backgroundColor = 'red';
    redDivsContainer.appendChild(redDiv);
  }
});

window.addEventListener('resize', function() {
  report();
});
