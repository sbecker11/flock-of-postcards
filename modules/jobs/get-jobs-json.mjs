const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

function generateRandomColor() {
  return '#' + Math.floor(Math.random()*16777215).toString(16);
}

function calculateTextColor(bgColor) {
  // Convert hex to RGB
  const r = parseInt(bgColor.slice(1, 3), 16);
  const g = parseInt(bgColor.slice(3, 5), 16);
  const b = parseInt(bgColor.slice(5, 7), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for light backgrounds, white for dark
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

function generateJobsJson() {
  const projectRoot = process.cwd();
  const staticContentPath = path.join(projectRoot, 'static_content', 'jobs');

  // Read resume.json
  const resumeJson = JSON.parse(fs.readFileSync(path.join(staticContentPath, 'resume.json'), 'utf8'));

  // Read jobs-from-resume-mapping.yaml
  const mapping = yaml.load(fs.readFileSync(path.join(staticContentPath, 'jobs-from-resume-mapping.yaml'), 'utf8'));

  // Create jobs array
  const jobs = [];

  // Apply mapping
  mapping.mapping.forEach(map => {
    if (map.source === 'workExperience') {
      resumeJson[map.source].forEach((workItem, index) => {
        const job = {};
        map.fields.forEach(field => {
          if (field.source === 'duration') {
            job[field.target] = `${workItem.duration.start} - ${workItem.duration.end}`;
          } else if (field.source === 'responsibilities') {
            job[field.target] = workItem[field.source].join('. ');
          } else {
            job[field.target] = workItem[field.source];
          }
        });
        
        // Set constants
        map.constants.forEach(constant => {
          if (constant.target === 'cssRGB') {
            job[constant.target] = generateRandomColor();
          } else if (constant.target === 'textColor') {
            job[constant.target] = calculateTextColor(job.cssRGB);
          } else if (constant.target === 'index') {
            job[constant.target] = index;
          } else {
            job[constant.target] = constant.value;
          }
        });
        
        jobs.push(job);
      });
    }
  });

  // Write jobs.json
  fs.writeFileSync(path.join(staticContentPath, 'jobs.json'), JSON.stringify(jobs, null, 2));

  console.log('jobs.json has been generated successfully.');
}

module.exports = generateJobsJson;
