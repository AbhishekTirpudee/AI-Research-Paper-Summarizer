const axios = require('axios');
const xml2js = require('xml2js');

/**
 * Fetch paper metadata from arXiv API.
 * Accepts arXiv ID like "2301.13848" or full URL like "https://arxiv.org/abs/2301.13848"
 */
async function fetchArxivPaper(input) {
    // Extract arXiv ID from URL or raw ID
    let arxivId = input.trim();
    const urlMatch = arxivId.match(/arxiv\.org\/(?:abs|pdf)\/([\d.]+(?:v\d+)?)/);
    if (urlMatch) {
        arxivId = urlMatch[1];
    }
    // Remove version suffix if present for cleaner query
    const cleanId = arxivId.replace(/v\d+$/, '');

    // Validate format: arXiv IDs look like "2301.13848" or "hep-th/9901001"
    const isValidId = /^\d{4}\.\d{4,5}$/.test(cleanId) || /^[a-z-]+\/\d{7}$/.test(cleanId);
    if (!isValidId) {
        throw new Error(`Invalid arXiv ID format: "${cleanId}". Expected format like 2301.13848`);
    }

    const apiUrl = `http://export.arxiv.org/api/query?id_list=${cleanId}`;

    let response;
    try {
        response = await axios.get(apiUrl, { timeout: 15000 });
    } catch (err) {
        throw new Error('Failed to connect to arXiv. Please check your internet connection.');
    }

    const parsed = await xml2js.parseStringPromise(response.data, { explicitArray: false });
    const entry = parsed.feed.entry;

    // arXiv returns an entry even for invalid IDs, but with error markers
    if (!entry) {
        throw new Error(`Paper not found on arXiv for ID: ${cleanId}`);
    }

    // Check for arXiv error responses (they return entries with <title>Error</title>)
    const entryTitle = (entry.title || '').trim();
    const entrySummary = (entry.summary || '').trim();
    if (
        entryTitle.toLowerCase() === 'error' ||
        entrySummary.toLowerCase().includes('is not a valid arxiv identifier') ||
        entry['arxiv:comment'] === 'not found'
    ) {
        throw new Error(`Paper not found on arXiv for ID: ${cleanId}`);
    }

    // If entry has no meaningful title, it's likely not a real paper
    if (!entryTitle || entryTitle.length < 3) {
        throw new Error(`Paper not found on arXiv for ID: ${cleanId}`);
    }

    // Parse authors (can be string or array)
    let authors = [];
    if (entry.author) {
        const authorList = Array.isArray(entry.author) ? entry.author : [entry.author];
        authors = authorList.map(a => a.name || a);
    }

    // Find PDF link
    let pdfUrl = '';
    if (entry.link) {
        const links = Array.isArray(entry.link) ? entry.link : [entry.link];
        const pdfLink = links.find(l => l.$ && l.$.title === 'pdf');
        pdfUrl = pdfLink ? pdfLink.$.href : `https://arxiv.org/pdf/${cleanId}.pdf`;
    }

    return {
        title: entryTitle.replace(/\s+/g, ' '),
        authors,
        abstract: entrySummary.replace(/\s+/g, ' '),
        sourceId: cleanId,
        source: 'arxiv',
        pdfUrl,
        published: entry.published || '',
        categories: entry['arxiv:primary_category'] ? entry['arxiv:primary_category'].$.term : '',
    };
}

module.exports = { fetchArxivPaper };
