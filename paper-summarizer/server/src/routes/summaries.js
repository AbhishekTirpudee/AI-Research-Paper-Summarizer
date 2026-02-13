const express = require('express');
const router = express.Router();
const Paper = require('../models/Paper');
const Summary = require('../models/Summary');
const LitReview = require('../models/LitReview');
const { compressText } = require('../services/scaledown');
const { generateMultiLevelSummaries, generateLitReview } = require('../services/summarizer');
const { computeRougeScores } = require('../services/rouge');
const { getSectionLabel } = require('../services/sectionParser');

/**
 * POST /api/summaries/generate
 * Generate multi-level summaries for a paper.
 * 
 * FULL DATA FLOW:
 *   1. Client sends paperId + optional sectionName
 *   2. Server loads paper text from MongoDB
 *   3. Text is compressed via JS extractive compressor (~50% token reduction)
 *   4. Compressed text goes to HuggingFace API for summarization (3 levels)
 *   5. Results stored in MongoDB Summary collection
 *   6. Response sent back to client with summaries + compression stats
 */
router.post('/generate', async (req, res) => {
    try {
        const { paperId, sectionName } = req.body;

        if (!paperId) {
            return res.status(400).json({ success: false, error: 'paperId is required' });
        }

        const paper = await Paper.findById(paperId);
        if (!paper) {
            return res.status(404).json({ success: false, error: 'Paper not found' });
        }

        // Determine which text to summarize
        let textToProcess = '';
        let targetSection = sectionName || 'full';

        if (targetSection === 'full') {
            // Use abstract + intro + methodology + conclusion for full summary
            const sections = paper.sections || {};
            const keyParts = ['abstract', 'introduction', 'methodology', 'experiments', 'conclusion'];
            textToProcess = keyParts
                .map(k => sections[k] || '')
                .filter(Boolean)
                .join('\n\n');

            // Fallback to fullText or abstract
            if (!textToProcess) {
                textToProcess = paper.fullText || paper.abstract || '';
            }
        } else {
            textToProcess = (paper.sections && paper.sections[targetSection]) || '';
            if (!textToProcess) {
                return res.status(400).json({
                    success: false,
                    error: `Section "${targetSection}" not found in paper`
                });
            }
        }

        if (textToProcess.length < 50) {
            return res.status(400).json({ success: false, error: 'Not enough text to summarize' });
        }

        // STEP 1: Compress text (JS extractive compressor)
        const compressed = compressText(
            textToProcess,
            'Summarize the key findings, methodology, and conclusions'
        );

        // STEP 2: Generate multi-level summaries from compressed text
        const summaries = await generateMultiLevelSummaries(compressed.content, targetSection);

        // STEP 3: Save summaries to MongoDB
        const savedSummaries = [];
        for (const level of ['eli5', 'technical', 'expert']) {
            // Delete existing summary for this paper/level/section
            await Summary.deleteOne({ paperId, level, sectionName: targetSection });

            // Ensure content is never empty (Mongoose requires it)
            const content = summaries[level].content && summaries[level].content.trim().length > 0
                ? summaries[level].content
                : `Summary generation returned empty for ${level} level. Please retry.`;

            const saved = await Summary.create({
                paperId,
                level,
                sectionName: targetSection,
                content,
                originalTokens: compressed.originalTokens,
                compressedTokens: compressed.compressedTokens,
                compressionRatio: compressed.compressionRatio,
                processingTimeMs: summaries[level].processingTimeMs,
            });
            savedSummaries.push(saved);
        }

        res.json({
            success: true,
            data: {
                summaries: savedSummaries,
                compression: {
                    originalTokens: compressed.originalTokens,
                    compressedTokens: compressed.compressedTokens,
                    ratio: compressed.compressionRatio,
                    savedTokens: compressed.originalTokens - compressed.compressedTokens,
                },
            },
        });
    } catch (error) {
        console.error('Summary generation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/summaries/:paperId
 * Get all summaries for a paper
 */
router.get('/:paperId', async (req, res) => {
    try {
        const summaries = await Summary.find({ paperId: req.params.paperId })
            .sort({ level: 1, sectionName: 1 })
            .lean();

        res.json({ success: true, data: summaries });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/summaries/rouge/:paperId
 * Compute ROUGE scores comparing generated summaries vs the paper's abstract
 */
router.get('/rouge/:paperId', async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.paperId).lean();
        if (!paper) {
            return res.status(404).json({ success: false, error: 'Paper not found' });
        }

        const reference = paper.abstract || '';
        if (!reference) {
            return res.status(400).json({ success: false, error: 'Paper has no abstract to compare against' });
        }

        const summaries = await Summary.find({ paperId: req.params.paperId }).lean();

        const scores = summaries.map(summary => ({
            level: summary.level,
            sectionName: summary.sectionName,
            sectionLabel: getSectionLabel(summary.sectionName),
            scores: computeRougeScores(reference, summary.content),
        }));

        res.json({ success: true, data: scores });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/summaries/lit-review
 * Generate a literature review from multiple papers
 * 
 * FLOW: Multiple paperIds → Load abstracts → Combine → Summarize → Save
 */
router.post('/lit-review', async (req, res) => {
    try {
        const { paperIds, title } = req.body;

        if (!paperIds || !Array.isArray(paperIds) || paperIds.length < 2) {
            return res.status(400).json({ success: false, error: 'At least 2 paperIds are required' });
        }

        const papers = await Paper.find({ _id: { $in: paperIds } }).lean();
        if (papers.length < 2) {
            return res.status(400).json({ success: false, error: 'Not enough valid papers found' });
        }

        // Generate literature review
        const reviewContent = await generateLitReview(papers);

        const litReview = await LitReview.create({
            title: title || `Literature Review: ${papers.map(p => p.title).join(', ').substring(0, 100)}`,
            paperIds,
            content: reviewContent,
            themes: [],
            totalPapers: papers.length,
        });

        res.status(201).json({ success: true, data: litReview });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/summaries/lit-reviews/all
 * List all literature reviews
 */
router.get('/lit-reviews/all', async (req, res) => {
    try {
        const reviews = await LitReview.find()
            .populate('paperIds', 'title authors')
            .sort({ createdAt: -1 })
            .lean();

        res.json({ success: true, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
