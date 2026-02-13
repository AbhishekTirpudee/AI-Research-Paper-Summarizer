const mongoose = require('mongoose');

const paperSchema = new mongoose.Schema({
    title: { type: String, required: true },
    authors: [{ type: String }],
    source: { type: String, enum: ['arxiv', 'upload', 'url'], default: 'upload' },
    sourceId: { type: String },           // arXiv ID if from arXiv
    abstract: { type: String, default: '' },
    fullText: { type: String, default: '' },
    sections: { type: mongoose.Schema.Types.Mixed, default: {} },
    pdfUrl: { type: String },
    pageCount: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
}, { timestamps: true });

paperSchema.index({ title: 'text', abstract: 'text' });

module.exports = mongoose.model('Paper', paperSchema);
