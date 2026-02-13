import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UploadPanel from '../components/UploadPanel';
import { useToast } from '../components/Toast';
import { fetchPapers, fetchStats, uploadPaper, submitArxivUrl } from '../lib/api';

interface Paper {
    _id: string;
    title: string;
    authors: string[];
    source: string;
    abstract: string;
    pageCount: number;
    totalTokens: number;
    summaryCount: number;
    createdAt: string;
}

interface Stats {
    totalPapers: number;
    totalSummaries: number;
    tokensSaved: number;
    avgCompressionRatio: string;
}

export default function Dashboard() {
    const [papers, setPapers] = useState<Paper[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const loadData = async () => {
        try {
            const [papersRes, statsRes] = await Promise.all([fetchPapers(), fetchStats()]);
            setPapers(papersRes.data || []);
            setStats(statsRes.data || null);
        } catch (err) {
            console.error('Failed to load data:', err);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleUpload = async (file: File) => {
        setLoading(true);
        try {
            await uploadPaper(file);
            showToast(`Paper "${file.name}" uploaded successfully!`, 'success');
            await loadData();
        } catch (err: any) {
            const msg = err.response?.data?.error || 'Upload failed. Please try again.';
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUrlSubmit = async (url: string) => {
        setLoading(true);
        try {
            const res = await submitArxivUrl(url);
            if (res.message === 'Paper already exists') {
                showToast('This paper already exists in your library!', 'info');
            } else {
                showToast(`Paper "${res.data?.title || 'Unknown'}" fetched from arXiv!`, 'success');
            }
            await loadData();
        } catch (err: any) {
            const msg = err.response?.data?.error || 'Paper not found. Please check the arXiv ID or URL.';
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>Academic Paper Summarizer</h1>
                <p>Upload papers or paste arXiv URLs for AI-powered multi-level summarization</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card cyan">
                    <div className="stat-value">{stats?.totalPapers || 0}</div>
                    <div className="stat-label">Papers Processed</div>
                </div>
                <div className="stat-card purple">
                    <div className="stat-value">{stats?.totalSummaries || 0}</div>
                    <div className="stat-label">Summaries Generated</div>
                </div>
                <div className="stat-card emerald">
                    <div className="stat-value">{stats?.tokensSaved ? (stats.tokensSaved / 1000).toFixed(1) + 'K' : '0'}</div>
                    <div className="stat-label">Tokens Saved</div>
                </div>
                <div className="stat-card amber">
                    <div className="stat-value">{stats?.avgCompressionRatio ? (100 - parseFloat(stats.avgCompressionRatio) * 100).toFixed(0) + '%' : '0%'}</div>
                    <div className="stat-label">Avg Compression</div>
                </div>
            </div>

            {/* Upload Panel */}
            <UploadPanel onUpload={handleUpload} onUrlSubmit={handleUrlSubmit} loading={loading} />

            {/* Papers List */}
            <div style={{ marginTop: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                    Recent Papers
                </h2>

                {papers.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📚</div>
                        <h3>No papers yet</h3>
                        <p>Upload a PDF or paste an arXiv URL to get started</p>
                    </div>
                ) : (
                    <div className="papers-grid">
                        {papers.map((paper) => (
                            <Link to={`/paper/${paper._id}`} key={paper._id} className="paper-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h3>{paper.title}</h3>
                                    <span className={`paper-source ${paper.source}`}>{paper.source}</span>
                                </div>
                                {paper.authors.length > 0 && (
                                    <div className="paper-meta">
                                        <span>👤 {paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ' et al.' : ''}</span>
                                    </div>
                                )}
                                <div className="paper-meta">
                                    {paper.pageCount > 0 && <span>📃 {paper.pageCount} pages</span>}
                                    <span>🔢 {paper.totalTokens?.toLocaleString() || 0} tokens</span>
                                    <span>📝 {paper.summaryCount} summaries</span>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {paper.abstract || 'No abstract available'}
                                </p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
