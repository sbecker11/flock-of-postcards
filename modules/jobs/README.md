# This directory contains python code used to create a jobs.json file, which is loaded by the app at startup.

# The approach:
The `resume_parser.py` module prompts Anthropic's Claude LLM to extract structured data from a `resume.docx` file.

This structured data is verified against `resume-schema.json` and if valid is stored to this directory as `resume.json`.  

The `resume_parser.py` module then creates a `jobs.json` file from `resume.json`, `jobs-schema.json` and a `jobs-from-resume-mapping.yaml` file.  

When serverside detects any changes of any app files, the app is reloaded from scratch.  

At this time the app reads the `jobs.json` file and is used to define the app's list of job elements.  

 ~/workspace-parallax/flock-of-postcards  version-1.2 !6 ?7                                                                                                   20:25:34 
> npm run run:json_utils
Debugger attached.

> flock-of-postcards@0.8.0 run:json_utils
> node modules/jobs/json_utils.mjs

Debugger attached.
Waiting for the debugger to disconnect...
node:internal/modules/esm/resolve:839
  throw new ERR_MODULE_NOT_FOUND(packageName, fileURLToPath(base), null);
        ^

Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'modules' imported from /Users/sbecker11/workspace-parallax/flock-of-postcards/modules/jobs/json_utils.mjs
    at packageResolve (node:internal/modules/esm/resolve:839:9)
    at moduleResolve (node:internal/modules/esm/resolve:908:18)
    at defaultResolve (node:internal/modules/esm/resolve:1038:11)
    at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:554:12)
    at ModuleLoader.resolve (node:internal/modules/esm/loader:523:25)
    at ModuleLoader.getModuleJob (node:internal/modules/esm/loader:246:38)
    at ModuleJob._link (node:internal/modules/esm/module_job:126:49) {
  code: 'ERR_MODULE_NOT_FOUND'
}

Node.js v22.7.0
Waiting for the debugger to disconnect...

 ~/workspace-parallax/flock-of-postcards  version-1.2 !6 ?7                                                                                                   20:25:37 
> tree . --gitignore
.
├── 404.shtml
├── Dockerfile
├── README.md
├── eslint.config.js
├── favicon.ico
├── git-log-summarize.py
├── index.html
├── modules
│   ├── alerts.css
│   ├── alerts.mjs
│   ├── css_colors.mjs
│   ├── focal_point.mjs
│   ├── index.mjs
│   ├── jobs
│   │   ├── README.md
│   │   ├── json_utils.mjs
│   │   ├── json_utils_test.mjs
│   │   ├── logger.mjs
│   │   ├── messages.mjs
│   │   ├── resume-inputs
│   │   │   ├── resume-schema.json
│   │   │   ├── resume.docx
│   │   ├── resume-outputs
│   │   │   └── resume.docx.json
│   │   └── test-files
│   │       ├── abbr-resume.docx
│   │       └── special_chars.docx
│   ├── main.mjs
│   ├── monoColor.mjs
│   ├── timeline.css
│   ├── timeline.mjs
│   └── utils.mjs
├── package-lock.json
├── package.json
├── parsed_resumes
├── pre_run_checks.sh
├── requirements.txt

16 directories, 83 files

 ~/workspace-parallax/flock-of-postcards  version-1.2 !6 ?7                                                                                                   20:28:11 
> 