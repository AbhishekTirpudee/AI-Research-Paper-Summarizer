const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Paper = require('../models/Paper');
const Summary = require('../models/Summary');
const { fetchArxivPaper } = require('../services/arxiv');
const { extractTextFromBuffer, extractTextFromUrl } = require('../services/pdfParser');
const { parseSections } = require('../services/sectionParser');
const { estimateTokens } = require('../services/scaledown');

// Configure multer for PDF uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

/**
 * GET /api/papers
 * List all papers, newest first
 */
router.get('/', async (req, res) => {
    try {
        const papers = await Paper.find()
            .select('-fullText')  // Exclude large text field for listing
            .sort({ createdAt: -1 })
            .lean();

        // Attach summary count for each paper
        const papersWithCounts = await Promise.all(
            papers.map(async (paper) => {
                const summaryCount = await Summary.countDocuments({ paperId: paper._id });
                return { ...paper, summaryCount };
            })
        );

        res.json({ success: true, data: papersWithCounts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/papers/:id
 * Get a single paper with its sections and summaries
 */
router.get('/:id', async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id).lean();
        if (!paper) {
            return res.status(404).json({ success: false, error: 'Paper not found' });
        }

        const summaries = await Summary.find({ paperId: paper._id })
            .sort({ level: 1, sectionName: 1 })
            .lean();

        res.json({ success: true, data: { ...paper, summaries } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/papers/upload
 * Upload a PDF file, extract text, parse sections, save to DB
 * 
 * FLOW: PDF file → pdf-parse → section parser → MongoDB
 */
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No PDF file uploaded' });
        }

        // Extract text from PDF buffer
        const { text, pageCount } = await extractTextFromBuffer(req.file.buffer);
        if (!text || text.trim().length < 50) {
            return res.status(400).json({ success: false, error: 'Could not extract text from PDF' });
        }

        // Parse sections
        const sections = parseSections(text);

        // Create paper record
        const paper = await Paper.create({
            title: req.body.title || req.file.originalname.replace('.pdf', ''),
            authors: req.body.authors ? JSON.parse(req.body.authors) : [],
            source: 'upload',
            abstract: sections.abstract || '',
            fullText: text,
            sections,
            pageCount,
            totalTokens: estimateTokens(text),
        });

        res.status(201).json({ success: true, data: paper });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/papers/url
 * Fetch paper from arXiv URL or ID
 * 
 * FLOW: arXiv ID → arXiv API (metadata) → PDF download → text extraction → section parser → MongoDB
 */
router.post('/url', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url || !url.trim()) {
            return res.status(400).json({ success: false, error: 'Please enter an arXiv URL or paper ID' });
        }

        const trimmedUrl = url.trim();

        // Basic input validation before hitting arXiv API
        const looksLikeArxivId = /^\d{4}\.\d{4,5}(v\d+)?$/.test(trimmedUrl);
        const looksLikeArxivUrl = /arxiv\.org\/(abs|pdf)\/\d{4}\.\d{4,5}/i.test(trimmedUrl);
        const looksLikeOldArxivId = /^[a-z-]+\/\d{7}$/.test(trimmedUrl);

        if (!looksLikeArxivId && !looksLikeArxivUrl && !looksLikeOldArxivId) {
            return res.status(400).json({
                success: false,
                error: 'Invalid arXiv format. Please enter a valid arXiv ID (e.g., 2301.13848) or URL (e.g., https://arxiv.org/abs/2301.13848)'
            });
        }

        // Check if paper already exists
        const cleanId = trimmedUrl.replace(/.*arxiv\.org\/(?:abs|pdf)\//, '').replace(/v\d+$/, '').trim();
        const existing = await Paper.findOne({ sourceId: cleanId });
        if (existing) {
            return res.json({ success: true, data: existing, message: 'Paper already exists' });
        }

        // Fetch metadata from arXiv
        const metadata = await fetchArxivPaper(trimmedUrl);

        // Download and parse PDF
        let fullText = '';
        let sections = {};
        let pageCount = 0;

        if (metadata.pdfUrl) {
            try {
                const pdfData = await extractTextFromUrl(metadata.pdfUrl);
                fullText = pdfData.text;
                pageCount = pdfData.pageCount;
                sections = parseSections(fullText);
            } catch (pdfError) {
                console.error('PDF download failed, using abstract only:', pdfError.message);
                sections = { abstract: metadata.abstract };
            }
        }

        // Create paper record
        const paper = await Paper.create({
            title: metadata.title,
            authors: metadata.authors,
            source: 'arxiv',
            sourceId: metadata.sourceId,
            abstract: metadata.abstract || sections.abstract || '',
            fullText,
            sections: Object.keys(sections).length > 0 ? sections : { abstract: metadata.abstract },
            pdfUrl: metadata.pdfUrl,
            pageCount,
            totalTokens: estimateTokens(fullText || metadata.abstract),
        });

        res.status(201).json({ success: true, data: paper });
    } catch (error) {
        // Return friendly error message, not raw 500
        const message = error.message || 'Failed to fetch paper from arXiv';
        const statusCode = message.includes('not found') || message.includes('Invalid') ? 404 : 500;
        res.status(statusCode).json({ success: false, error: message });
    }
});

/**
 * DELETE /api/papers/:id
 * Delete a paper and all its summaries
 */
router.delete('/:id', async (req, res) => {
    try {
        const paper = await Paper.findByIdAndDelete(req.params.id);
        if (!paper) {
            return res.status(404).json({ success: false, error: 'Paper not found' });
        }
        await Summary.deleteMany({ paperId: req.params.id });
        res.json({ success: true, message: 'Paper and summaries deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
