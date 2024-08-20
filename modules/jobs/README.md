# This directory contains python code used to create a jobs.json file, which is loaded by the app at startup.

# The approach:
The `resume_parser.py` module prompts Anthropic's Claude LLM to extract structured data from a `resume.docx` file.

This structured data is verified against `resume-schema.json` and if valid is stored to this directory as `resume.json`.  

The `resume_parser.py` module then creates a `jobs.json` file from `resume.json`, `jobs-schema.json` and a `jobs-from-resume-mapping.yaml` file.  

When serverside detects any changes of any app files, the app is reloaded from scratch.  

At this time the app reads the `jobs.json` file and is used to define the app's list of job elements.  

