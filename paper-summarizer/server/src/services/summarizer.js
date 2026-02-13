const axios = require('axios');

/**
 * Summarizer service using Hugging Face's free inference API.
 * Uses facebook/bart-large-cnn for summarization (free, no API key needed).
 * 
 * DATA FLOW:
 *   Compressed text → HuggingFace API → Raw summary → Level-adjusted summary
 */

const HF_API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';

/**
 * Generate a summary using HuggingFace's free inference API
 */
async function generateSummary(text, maxLength = 300, minLength = 80) {
    if (!text || text.trim().length < 50) {
        return text && text.trim().length > 0 ? text : 'Insufficient text for summarization.';
    }

    // HuggingFace has a ~1024 token input limit for free tier, truncate if needed
    const truncated = text.length > 4000 ? text.substring(0, 4000) : text;

    try {
        const response = await axios.post(HF_API_URL, {
            inputs: truncated,
            parameters: {
                max_length: maxLength,
                min_length: minLength,
                do_sample: false,
            }
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 60000,
        });

        if (Array.isArray(response.data) && response.data[0]?.summary_text) {
            const summary = response.data[0].summary_text;
            if (summary && summary.trim().length > 0) {
                return summary;
            }
        }

        // Model might be loading (cold start)
        const errorMsg = response.data?.error || '';
        if (typeof errorMsg === 'string' && errorMsg.includes('loading')) {
            console.log('HuggingFace model is loading, retrying in 20s...');
            await new Promise(r => setTimeout(r, 20000));
            return generateSummary(text, maxLength, minLength);
        }

        // If API returned something unexpected, use fallback
        console.warn('HuggingFace returned unexpected response:', JSON.stringify(response.data).substring(0, 200));
        return fallbackSummarize(truncated, maxLength);
    } catch (error) {
        console.error('HuggingFace API error:', error.message);
        // Fallback: simple extractive summarization
        return fallbackSummarize(truncated, maxLength);
    }
}

/**
 * Generate multi-level summaries for paper text.
 * 
 * Levels:
 *   - ELI5: Simple, non-technical, short (like explaining to a 5-year-old)
 *   - Technical: Standard academic summary with key findings
 *   - Expert: Detailed analysis with methodology critique
 */
async function generateMultiLevelSummaries(text, sectionName = 'full') {
    const startTime = Date.now();

    const [eli5, technical, expert] = await Promise.all([
        // ELI5: Short, simple
        generateSummary(
            `Explain simply: ${text}`,
            150, 50
        ),
        // Technical: Standard length
        generateSummary(text, 300, 100),
        // Expert: Detailed
        generateSummary(text, 500, 150),
    ]);

    const processingTime = Date.now() - startTime;

    return {
        eli5: {
            content: eli5,
            level: 'eli5',
            sectionName,
            processingTimeMs: processingTime,
        },
        technical: {
            content: technical,
            level: 'technical',
            sectionName,
            processingTimeMs: processingTime,
        },
        expert: {
            content: expert,
            level: 'expert',
            sectionName,
            processingTimeMs: processingTime,
        },
    };
}

/**
 * Fallback extractive summarization when API is unavailable.
 * Picks the most important sentences based on length and position.
 */
function fallbackSummarize(text, maxLength = 300) {
    if (!text || text.trim().length === 0) {
        return 'No text available for summarization.';
    }

    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    // Score sentences: prefer longer ones from the beginning and end
    const scored = sentences.map((s, i) => ({
        text: s.trim(),
        score: s.trim().length * (i < 3 ? 2 : i >= sentences.length - 2 ? 1.5 : 1),
        index: i,
    }));

    scored.sort((a, b) => b.score - a.score);

    let result = '';
    const selected = [];
    for (const s of scored) {
        if ((result + s.text).length > maxLength) break;
        selected.push(s);
        result += s.text + ' ';
    }

    // Return in original order
    selected.sort((a, b) => a.index - b.index);
    const summary = selected.map(s => s.text).join(' ').trim();
    return summary.length > 0 ? summary : text.substring(0, maxLength).trim();
}

/**
 * Generate a literature review from multiple paper summaries
 */
async function generateLitReview(papers) {
    const combinedText = papers.map(p =>
        `Title: ${p.title}\nAbstract: ${p.abstract}\n`
    ).join('\n---\n');

    const review = await generateSummary(
        `Compare and synthesize the following research papers:\n${combinedText}`,
        500, 200
    );

    return review;
}

module.exports = { generateSummary, generateMultiLevelSummaries, generateLitReview, fallbackSummarize };
