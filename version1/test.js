var i;
var v;
var N = 10000;
var maxOffset = 10.0;
var minV = 100.0;
var maxV = -100.0;
var sumV = 0.0;

for (i = 0; i < N; i++) {
  v = Math.random() * 2 - 1;
  minV = Math.min(v,minV);
  maxV = Math.max(v,maxV);
  sumV += v;
}
console.log("minV:" + minV);
console.log("maxV:" + maxV);
console.log("avgV:" + sumV / N);