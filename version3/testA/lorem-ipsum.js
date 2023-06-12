var loremIpsumSentences = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  "Maecenas tincidunt fringilla quam, vitae interdum sem ultricies nec.",
  "Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae.",
  "Cras et velit non mauris tristique semper.",
  "Phasellus vulputate massa in nibh pharetra condimentum.",
  "Nullam nec magna vestibulum, hendrerit lectus ut, lacinia tellus.",
  "Quisque nec urna in nunc lacinia malesuada.",
  "Vestibulum a nunc tristique, sollicitudin diam vitae, finibus urna.",
  "Duis ac felis non purus vehicula finibus in eu tellus.",
  "Etiam iaculis purus nec aliquam dictum.",
  "Fusce id enim in diam tempor hendrerit sed vel risus.",
  "Curabitur ultrices felis ut lectus dictum sagittis.",
  "Pellentesque pellentesque nunc in commodo venenatis.",
  "Suspendisse varius enim et justo viverra, eget condimentum ipsum efficitur.",
  "Vivamus eu tellus congue, maximus felis et, volutpat enim.",
  "Sed fermentum nisi id elit varius, eget sollicitudin justo finibus.",
  "In at eros a ex tincidunt laoreet.",
  "Cras dapibus felis et sagittis pellentesque.",
  "Praesent vel sem maximus, posuere arcu et, rutrum neque.",
  "Vivamus malesuada augue vitae venenatis tincidunt.",
  "Morbi ut dui id orci consequat auctor vitae sit amet purus.",
  "Duis lacinia mauris eget mauris tempus, ac lacinia velit ultricies.",
  "Nam ultricies odio a malesuada dictum.",
  "Vestibulum id nisl tincidunt, iaculis leo at, rutrum est.",
  "Donec dignissim quam et volutpat luctus.",
];

function getRandomWords(min, max) {
  var randomSentence =
    loremIpsumSentences[Math.floor(Math.random() * loremIpsumSentences.length)];
  var words = randomSentence.split(" ");
  var randomWordCount = Math.floor(Math.random() * (max - min + 1)) + min;
  var randomWords = words.slice(0, randomWordCount).join(" ");
  return randomWords;
}

// Export the getRandomColor function
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
  module.exports = {
    getRandomWords: getRandomWords,
  };
}
