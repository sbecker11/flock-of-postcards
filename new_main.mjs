// Path to the jobs.json file
const jobsJsonFilePath = path.join(__dirname, 'jobs.json');

// load jobs.json into global jobs variable
jobs = json2obj(jobsJsonFilePath);
