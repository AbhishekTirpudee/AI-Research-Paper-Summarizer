const pdfParse = require('pdf-parse');
const axios = require('axios');
const fs = require('fs');

/**
 * Extract text from a PDF buffer (uploaded file)
 */
async function extractTextFromBuffer(buffer) {
    const data = await pdfParse(buffer);
    return {
        text: data.text || '',
        pageCount: data.numpages || 0,
    };
}

/**
 * Extract text from a PDF file path
 */
async function extractTextFromFile(filePath) {
    const buffer = fs.readFileSync(filePath);
    return extractTextFromBuffer(buffer);
}

/**
 * Download PDF from URL and extract text
 */
async function extractTextFromUrl(pdfUrl) {
    const response = await axios.get(pdfUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
            'User-Agent': 'PaperSummarizer/1.0'
        }
    });
    const buffer = Buffer.from(response.data);
    return extractTextFromBuffer(buffer);
}

module.exports = { extractTextFromBuffer, extractTextFromFile, extractTextFromUrl };
