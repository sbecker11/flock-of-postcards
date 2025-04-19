export const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const getRandomSign = () => Math.random() < 0.5 ? -1 : 1;
export const shuffle = arr => [...arr].sort(() => Math.random() - 0.5); 