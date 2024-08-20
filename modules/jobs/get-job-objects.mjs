import fs from 'fs';
import path from 'path';

// get a list of job objects from a jobs.json file
export function getJobObjects(jobsFilePath) {
  // Read jobs.json
  const jobsJson = JSON.parse(fs.readFileSync(jobsFilePath, 'utf8'));

  // Convert jobs to objects
  const jobObjects = jobsJson.map(job => ({
    employer: job.employer,
    role: job.role,
    cssRGB: job.cssRGB,
    textColor: job.textColor,
    endstart: job.endstart,
    index: job.index,
    description: job.description
  }));

  return jobObjects;
}
