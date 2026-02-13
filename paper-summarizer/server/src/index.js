require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/papers', require('./routes/papers'));
app.use('/api/summaries', require('./routes/summaries'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Paper Summarizer API',
        timestamp: new Date().toISOString(),
    });
});

// Stats endpoint
app.get('/api/stats', async (req, res) => {
    try {
        const Paper = require('./models/Paper');
        const Summary = require('./models/Summary');

        const totalPapers = await Paper.countDocuments();
        const totalSummaries = await Summary.countDocuments();

        // Calculate total tokens saved
        const tokenStats = await Summary.aggregate([
            {
                $group: {
                    _id: null,
                    totalOriginalTokens: { $sum: '$originalTokens' },
                    totalCompressedTokens: { $sum: '$compressedTokens' },
                }
            }
        ]);

        const stats = tokenStats[0] || { totalOriginalTokens: 0, totalCompressedTokens: 0 };

        res.json({
            success: true,
            data: {
                totalPapers,
                totalSummaries,
                totalOriginalTokens: stats.totalOriginalTokens,
                totalCompressedTokens: stats.totalCompressedTokens,
                tokensSaved: stats.totalOriginalTokens - stats.totalCompressedTokens,
                avgCompressionRatio: stats.totalOriginalTokens > 0
                    ? (stats.totalCompressedTokens / stats.totalOriginalTokens).toFixed(2)
                    : 0,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.message);
    res.status(500).json({ success: false, error: err.message });
});

// Connect to MongoDB, then start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`
    ╔══════════════════════════════════════════╗
    ║  📄 Paper Summarizer API                 ║
    ║  🚀 Running on http://localhost:${PORT}     ║
    ║  📊 Health: http://localhost:${PORT}/api/health ║
    ╚══════════════════════════════════════════╝
    `);
    });
});
