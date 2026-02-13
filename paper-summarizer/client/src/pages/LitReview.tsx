import { useState, useEffect } from 'react';
import { useToast } from '../components/Toast';
import { fetchPapers, generateLitReview, fetchLitReviews } from '../lib/api';

interface Paper {
    _id: string;
    title: string;
    authors: string[];
    abstract: string;
}

interface Review {
    _id: string;
    title: string;
    content: string;
    totalPapers: number;
    createdAt: string;
}

export default function LitReview() {
    const [papers, setPapers] = useState<Paper[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [reviews, setReviews] = useState<Review[]>([]);
    const [generating, setGenerating] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [papersRes, reviewsRes] = await Promise.all([fetchPapers(), fetchLitReviews()]);
            setPapers(papersRes.data || []);
            setReviews(reviewsRes.data || []);
        } catch (err) {
            console.error('Failed to load data:', err);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleGenerate = async () => {
        if (selectedIds.size < 2) {
            showToast('Please select at least 2 papers', 'warning');
            return;
        }
        setGenerating(true);
        showToast('Generating literature review...', 'info');
        try {
            await generateLitReview(Array.from(selectedIds));
            setSelectedIds(new Set());
            showToast('Literature review generated successfully!', 'success');
            await loadData();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Failed to generate review', 'error');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1>Literature Review Generator</h1>
                <p>Select 2 or more papers to generate a comparative literature review</p>
            </div>

            {/* Paper Selection */}
            <div className="glass-card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                        Select Papers ({selectedIds.size} selected)
                    </h3>
                    <button
                        className="btn btn-primary"
                        onClick={handleGenerate}
                        disabled={generating || selectedIds.size < 2}
                    >
                        {generating ? (
                            <><span className="spinner" /> Generating...</>
                        ) : (
                            '📝 Generate Literature Review'
                        )}
                    </button>
                </div>

                {papers.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📚</div>
                        <h3>No papers available</h3>
                        <p>Upload papers from the Dashboard first</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {papers.map((paper) => (
                            <div
                                key={paper._id}
                                className={`checkbox-card ${selectedIds.has(paper._id) ? 'selected' : ''}`}
                                onClick={() => toggleSelection(paper._id)}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedIds.has(paper._id)}
                                    onChange={() => toggleSelection(paper._id)}
                                />
                                <div>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px' }}>{paper.title}</h4>
                                    {paper.authors?.length > 0 && (
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {paper.authors.slice(0, 3).join(', ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Past Reviews */}
            {reviews.length > 0 && (
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                        Past Reviews
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {reviews.map((review) => (
                            <div key={review._id} className="glass-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{review.title}</h3>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {review.totalPapers} papers • {new Date(review.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                                    {review.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
