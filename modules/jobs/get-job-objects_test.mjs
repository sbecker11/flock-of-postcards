import { getJobObjects } from './get-job-objects.mjs';
import path from 'path';
import fs from 'fs';
import { describe, it, expect } from 'vitest';

describe('getJobObjects', () => {
  it('should return job objects from jobs.json file', () => {
    const jobsFilePath = path.join(__dirname, 'test-data', 'jobs.json');
    
    // Sample jobs.json content for testing
    const sampleJobsJson = [
      {
        employer: "Company A",
        role: "Developer",
        cssRGB: "rgb(255, 255, 255)",
        textColor: "#000000",
        endstart: "2023-01-01",
        index: 1,
        description: "Job description A"
      },
      {
        employer: "Company B",
        role: "Designer",
        cssRGB: "rgb(0, 0, 0)",
        textColor: "#FFFFFF",
        endstart: "2023-02-01",
        index: 2,
        description: "Job description B"
      }
    ];

    // Write sample jobs.json to test-data directory
    const testDataDir = path.join(__dirname, 'test-data');
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir);
    }
    fs.writeFileSync(jobsFilePath, JSON.stringify(sampleJobsJson, null, 2));

    const result = getJobObjects(jobsFilePath);
    expect(result).toEqual(sampleJobsJson);
  });
});