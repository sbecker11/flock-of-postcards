const fullNamePattern = /\b[A-Z][a-zA-Z]+(?:[-' ][A-Z][a-zA-Z]+)*\b/;
const emailPattern = /[\w.-]+@[\w.-]+\.\w+/;
const phonePattern = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
const titlePattern = /[A-Z\s\/]+/;
const introPattern = /.{200,}/;

function extractField(text, fieldName, pattern) {
    const match = text.match(pattern);
    if (match) {
      let result = match[0];
      result = result.replace(/\s+/g, ' ');
      result = result.trim();
      return result;
    } else {
      throw new Error(`Field ${fieldName} not found given pattern: ${pattern}`);
    }
}

function extractHeader(text) {
    const fullName = extractField(text, 'fullName', fullNamePattern);
    const email = extractField(text, 'email', emailPattern);
    const phone = extractField(text, 'phone', phonePattern);
    const title = extractField(text, 'title', titlePattern);
    const intro = extractField(text, 'intro', introPattern);

    const header = {
        fullName: fullName,
        email: email,
        phone: phone,
        title: title,
        intro: intro
    };

    return header;
}

async function main() {
    const testText = `
    
    123-456-7890   John Doe   john.doe@alum.mit.edu

    SOFTWARE             


        I was born in 1980 and have been working as a software developer for 10 years. I have a degree in Computer Science from MIT. I am proficient in Java, Python, and JavaScript. I am looking for a new opportunity to grow my career.
    
    `;

    try {
        const header = extractHeader(testText);
        console.log('Extracted header:', JSON.stringify(header, null, 2));
    } catch (err) {
        console.error('Error:', err);
    }
}

main();