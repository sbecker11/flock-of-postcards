// Application-wide constants for the flock-of-postcards application

// Miscellaneous
export const BULLET_DELIMITER = "\u2022";
export const BULLET_JOINER = ' ' + BULLET_DELIMITER + ' ';

// Animation
export const NUM_ANIMATION_FRAMES = 0;
export const ANIMATION_DURATION_MILLIS = 0;

// BizcardDiv dimensions (in pixels)
export const BIZCARD_WIDTH = 200;
export const BIZCARD_INDENT = 29;
export const MIN_BIZCARD_HEIGHT = 200;

// CardDiv dimensions and positioning
export const ESTIMATED_NUMBER_CARD_DIVS = 159;
export const MAX_CARD_POSITION_OFFSET = 200;
export const MEAN_CARD_LEFT = 0;
export const MEAN_CARD_HEIGHT = 75;
export const MEAN_CARD_WIDTH = 100;
export const MAX_CARD_SIZE_OFFSET = 20;
export const CARD_BORDER_WIDTH = 3;

// Parallax
export const PARALLAX_X_EXAGGERATION_FACTOR = 0.05;
export const PARALLAX_Y_EXAGGERATION_FACTOR = 0.1;

// Z-depth levels
export const ALL_CARDS_MAX_Z = 15;
export const BIZCARD_MAX_Z = 14;
export const BIZCARD_MIN_Z = 12;
export const CARD_MAX_Z = 8;
export const CARD_MIN_Z = 1;
export const ALL_CARDS_MIN_Z = 1;

// Visual effects
export const MIN_BRIGHTNESS_PERCENT = 75;
export const BLUR_Z_SCALE_FACTOR = 4;

// Selected card Z-level
export const SELECTED_CARD_DIV_Z = -10;

// Autoscroll
export const AUTOSCROLL_REPEAT_MILLIS = 10;
export const MAX_AUTOSCROLL_VELOCITY = 10.0;
export const MIN_AUTOSCROLL_VELOCITY = 2.0;
export const AUTOSCROLL_CHANGE_THRESHOLD = 2.0;
