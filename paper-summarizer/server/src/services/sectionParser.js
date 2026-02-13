/**
 * Section-aware parser for academic papers.
 * Detects common section headings and splits paper text into structured sections.
 */

// Common academic paper section headings (case-insensitive patterns)
const SECTION_PATTERNS = [
    { key: 'abstract', pattern: /^(?:\d+[\.\)]\s*)?abstract\s*$/im },
    { key: 'introduction', pattern: /^(?:\d+[\.\)]\s*)?introduction\s*$/im },
    { key: 'related_work', pattern: /^(?:\d+[\.\)]\s*)?(?:related\s+work|literature\s+review|background|previous\s+work)\s*$/im },
    { key: 'methodology', pattern: /^(?:\d+[\.\)]\s*)?(?:method(?:ology|s)?|approach|proposed\s+(?:method|approach|framework|system))\s*$/im },
    { key: 'experiments', pattern: /^(?:\d+[\.\)]\s*)?(?:experiment(?:s|al)?(?:\s+(?:results|setup|evaluation))?|evaluation|results(?:\s+and\s+(?:discussion|analysis))?)\s*$/im },
    { key: 'discussion', pattern: /^(?:\d+[\.\)]\s*)?(?:discussion|analysis)\s*$/im },
    { key: 'conclusion', pattern: /^(?:\d+[\.\)]\s*)?(?:conclusion(?:s)?(?:\s+and\s+future\s+work)?|summary(?:\s+and\s+(?:conclusion|future\s+work))?|future\s+work)\s*$/im },
    { key: 'references', pattern: /^(?:\d+[\.\)]\s*)?(?:references|bibliography)\s*$/im },
];

/**
 * Parse full paper text into sections.
 * Returns an object like:
 * {
 *   abstract: "...",
 *   introduction: "...",
 *   methodology: "...",
 *   ...
 * }
 */
function parseSections(fullText) {
    if (!fullText || typeof fullText !== 'string') {
        return { full: '' };
    }

    const lines = fullText.split('\n');
    const sections = {};
    let currentSection = 'preamble';
    let currentContent = [];

    for (const line of lines) {
        const trimmed = line.trim();
        let matched = false;

        for (const { key, pattern } of SECTION_PATTERNS) {
            if (pattern.test(trimmed)) {
                // Save previous section
                if (currentContent.length > 0) {
                    const text = currentContent.join('\n').trim();
                    if (text.length > 0) {
                        sections[currentSection] = text;
                    }
                }
                currentSection = key;
                currentContent = [];
                matched = true;
                break;
            }
        }

        if (!matched) {
            currentContent.push(line);
        }
    }

    // Save last section
    if (currentContent.length > 0) {
        const text = currentContent.join('\n').trim();
        if (text.length > 0) {
            sections[currentSection] = text;
        }
    }

    // If no sections were detected, put everything under 'full'
    if (Object.keys(sections).length <= 1 && sections.preamble) {
        sections.full = sections.preamble;
        delete sections.preamble;
    }

    // Remove references section (not useful for summarization)
    delete sections.references;

    return sections;
}

/**
 * Get a human-readable label for a section key
 */
function getSectionLabel(key) {
    const labels = {
        preamble: 'Preamble',
        abstract: 'Abstract',
        introduction: 'Introduction',
        related_work: 'Related Work',
        methodology: 'Methodology',
        experiments: 'Experiments & Results',
        discussion: 'Discussion',
        conclusion: 'Conclusion',
        full: 'Full Paper',
    };
    return labels[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
}

module.exports = { parseSections, getSectionLabel };
