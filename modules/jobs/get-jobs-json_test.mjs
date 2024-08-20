import { generateJobsJson } from './generate-jobs-json.mjs';
import assert from 'assert';

describe('generateJobsJson', () => {
  it('should generate jobs JSON', async () => {
    const jobs = await generateJobsJson();
    assert(Array.isArray(jobs));
    assert(jobs.length > 0);
    assert(jobs[0].employer);
    assert(jobs[0].role);
    assert(jobs[0].cssRGB);
    assert(jobs[0].textColor);
    assert(jobs[0].endstart);
    assert(typeof jobs[0].index === 'number');
    assert(jobs[0].description);
  });
});
