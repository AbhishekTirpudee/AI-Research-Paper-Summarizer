/**
 * ROUGE Score implementation in JavaScript.
 * Computes ROUGE-1, ROUGE-2, and ROUGE-L for summary quality evaluation.
 * 
 * ROUGE = Recall-Oriented Understudy for Gisting Evaluation
 * Compares generated summary against a reference (e.g., the paper's abstract).
 */

/**
 * Tokenize text into lowercase words
 */
function tokenize(text) {
    return (text || '').toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
}

/**
 * Get n-grams from a token array
 */
function getNgrams(tokens, n) {
    const ngrams = [];
    for (let i = 0; i <= tokens.length - n; i++) {
        ngrams.push(tokens.slice(i, i + n).join(' '));
    }
    return ngrams;
}

/**
 * Compute precision, recall, and F1 for n-gram overlap
 */
function computeNgramScore(reference, hypothesis, n) {
    const refTokens = tokenize(reference);
    const hypTokens = tokenize(hypothesis);

    const refNgrams = getNgrams(refTokens, n);
    const hypNgrams = getNgrams(hypTokens, n);

    if (refNgrams.length === 0 || hypNgrams.length === 0) {
        return { precision: 0, recall: 0, f1: 0 };
    }

    // Count overlapping n-grams
    const refSet = {};
    refNgrams.forEach(ng => { refSet[ng] = (refSet[ng] || 0) + 1; });

    const hypSet = {};
    hypNgrams.forEach(ng => { hypSet[ng] = (hypSet[ng] || 0) + 1; });

    let overlap = 0;
    for (const ng of Object.keys(hypSet)) {
        if (refSet[ng]) {
            overlap += Math.min(hypSet[ng], refSet[ng]);
        }
    }

    const precision = overlap / hypNgrams.length;
    const recall = overlap / refNgrams.length;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    return {
        precision: Math.round(precision * 10000) / 10000,
        recall: Math.round(recall * 10000) / 10000,
        f1: Math.round(f1 * 10000) / 10000,
    };
}

/**
 * Compute Longest Common Subsequence length
 */
function lcsLength(a, b) {
    const m = a.length;
    const n = b.length;
    // Use space-optimized LCS
    let prev = new Array(n + 1).fill(0);
    let curr = new Array(n + 1).fill(0);

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (a[i - 1] === b[j - 1]) {
                curr[j] = prev[j - 1] + 1;
            } else {
                curr[j] = Math.max(prev[j], curr[j - 1]);
            }
        }
        [prev, curr] = [curr, new Array(n + 1).fill(0)];
    }

    return prev.reduce((max, v) => Math.max(max, v), 0);
}

/**
 * Compute ROUGE-L (Longest Common Subsequence)
 */
function computeRougeL(reference, hypothesis) {
    const refTokens = tokenize(reference);
    const hypTokens = tokenize(hypothesis);

    if (refTokens.length === 0 || hypTokens.length === 0) {
        return { precision: 0, recall: 0, f1: 0 };
    }

    const lcs = lcsLength(refTokens, hypTokens);
    const precision = lcs / hypTokens.length;
    const recall = lcs / refTokens.length;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    return {
        precision: Math.round(precision * 10000) / 10000,
        recall: Math.round(recall * 10000) / 10000,
        f1: Math.round(f1 * 10000) / 10000,
    };
}

/**
 * Compute all ROUGE scores for a summary against a reference
 */
function computeRougeScores(reference, hypothesis) {
    return {
        rouge1: computeNgramScore(reference, hypothesis, 1),
        rouge2: computeNgramScore(reference, hypothesis, 2),
        rougeL: computeRougeL(reference, hypothesis),
    };
}

module.exports = { computeRougeScores, computeNgramScore, computeRougeL };
