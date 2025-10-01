// Shared TypeScript type definitions for the flock-of-postcards application

export interface Job {
  role: string;
  employer: string;
  'css RGB': string;
  'text color': string;
  end: string;
  start: string;
  'z-index': string;
  Description?: string;
}

export interface TagLink {
  text: string;
  img: string;
  url: string;
  bizcardDivId: string;
  html?: string;
  cardDivId?: string;
}

export interface DatedDivId {
  id: string;
  endDate: Date;
}

export interface CanvasContainerEventListener {
  eventType: string;
  listener: EventListener;
  options?: AddEventListenerOptions;
}

export interface Parallax {
  parallaxX: number;
  parallaxY: number;
}

export type StyleArray = [number, number, number, number, number, number, number, number, number];

// Declare global jobs array (imported from static_content/jobs.mjs)
declare global {
  const jobs: Job[];
}
