import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

async function getResumeText(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } else if (ext === '.docx') {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } else {
        throw new Error('Unsupported file type');
    }
}

async function getResumeJobObjects(resumePath, jobsSchema) {
    const resumeText = await getResumeText(resumePath);
    const jobsSchemaString = typeof jobsSchema === 'object' ? JSON.stringify(jobsSchema) : fs.readFileSync(jobsSchema, 'utf-8');

    const prompt = `
        Resume Text:
        ${resumeText}

        Jobs Schema:
        ${jobsSchemaString}

        Please create a job_objects list based on the above resume and jobs schema.
    `;

    // Here you would call your LLM with the prompt and await the response
    // For example:
    // const jobObjects = await callLLM(prompt);

    // For now, we'll just return the prompt for demonstration purposes
    return prompt;
}

export default getResumeJobObjects;