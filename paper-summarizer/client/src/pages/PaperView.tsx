import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SummaryCard from '../components/SummaryCard';
import LevelToggle from '../components/LevelToggle';
import SectionNav from '../components/SectionNav';
import RougeScores from '../components/RougeScores';
import { useToast, ConfirmModal } from '../components/Toast';
import { fetchPaper, generateSummary, fetchRougeScores, deletePaper } from '../lib/api';

const SECTION_LABELS: Record<string, string> = {
    full: 'Full Paper',
    preamble: 'Preamble',
    abstract: 'Abstract',
    introduction: 'Introduction',
    related_work: 'Related Work',
    methodology: 'Methodology',
    experiments: 'Experiments & Results',
    discussion: 'Discussion',
    conclusion: 'Conclusion',
};

export default function PaperView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [paper, setPaper] = useState<any>(null);
    const [summaries, setSummaries] = useState<any[]>([]);
    const [activeLevel, setActiveLevel] = useState('technical');
    const [activeSection, setActiveSection] = useState('full');
    const [rougeScores, setRougeScores] = useState<any>(null);
    const [generating, setGenerating] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const loadPaper = async () => {
        if (!id) return;
        try {
            const res = await fetchPaper(id);
            setPaper(res.data);
            setSummaries(res.data.summaries || []);
        } catch (err) {
            showToast('Failed to load paper', 'error');
        }
    };

    const loadRouge = async () => {
        if (!id) return;
        try {
            const res = await fetchRougeScores(id);
            setRougeScores(res.data);
        } catch {
            // ROUGE might fail if no summaries yet
        }
    };

    useEffect(() => {
        loadPaper();
    }, [id]);

    useEffect(() => {
        if (summaries.length > 0) loadRouge();
    }, [summaries.length]);

    const handleGenerate = async (sectionName?: string) => {
        if (!id) return;
        setGenerating(true);
        showToast('Generating summary... This may take a minute.', 'info');
        try {
            const res = await generateSummary(id, sectionName || activeSection);
            setSummaries((prev) => {
                const newSummaries = res.data.summaries || [];
                const filtered = prev.filter(
                    (s: any) => s.sectionName !== (sectionName || activeSection)
                );
                return [...filtered, ...newSummaries];
            });
            showToast('Summary generated successfully!', 'success');
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Summary generation failed', 'error');
        } finally {
            setGenerating(false);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        setShowDeleteModal(false);
        try {
            await deletePaper(id);
            showToast('Paper deleted successfully', 'success');
            navigate('/');
        } catch {
            showToast('Failed to delete paper', 'error');
        }
    };

    if (!paper) {
        return (
            <div className="loading-overlay">
                <span className="spinner" />
                <p>Loading paper...</p>
            </div>
        );
    }

    // Build sections list from paper.sections
    const sectionKeys = paper.sections ? Object.keys(paper.sections) : [];
    const sections = [
        { key: 'full', label: 'Full Paper' },
        ...sectionKeys
            .filter((k: string) => k !== 'preamble')
            .map((k: string) => ({ key: k, label: SECTION_LABELS[k] || k })),
    ];

    // Filter summaries for the active level and section
    const filteredSummary = summaries.find(
        (s: any) => s.level === activeLevel && s.sectionName === activeSection
    );

    // Find ROUGE scores for the active level
    const activeRouge = rougeScores?.find(
        (r: any) => r.level === activeLevel && r.sectionName === activeSection
    );

    return (
        <div>
            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={showDeleteModal}
                title="Delete Paper"
                message="Are you sure you want to delete this paper and all its summaries? This action cannot be undone."
                confirmLabel="Delete"
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteModal(false)}
                danger
            />

            {/* Paper Header */}
            <div className="paper-detail-header">
                <h1>{paper.title}</h1>
                {paper.authors?.length > 0 && (
                    <p className="authors-list">
                        👤 {paper.authors.join(', ')}
                    </p>
                )}
                <div className="paper-meta" style={{ marginBottom: '0.5rem' }}>
                    <span className={`paper-source ${paper.source}`}>{paper.source}</span>
                    {paper.pageCount > 0 && <span>📃 {paper.pageCount} pages</span>}
                    <span>🔢 {paper.totalTokens?.toLocaleString()} tokens</span>
                    {paper.sourceId && <span>ID: {paper.sourceId}</span>}
                </div>
                <div className="paper-detail-actions">
                    <button
                        className="btn btn-primary"
                        onClick={() => handleGenerate()}
                        disabled={generating}
                    >
                        {generating ? (
                            <><span className="spinner" /> Generating...</>
                        ) : (
                            '🧠 Generate Summary'
                        )}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteModal(true)}>
                        🗑️ Delete
                    </button>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="two-col-layout">
                {/* Sidebar: Section Navigator */}
                <div>
                    <SectionNav
                        sections={sections}
                        activeSection={activeSection}
                        onSectionChange={setActiveSection}
                    />
                </div>

                {/* Main Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Level Toggle */}
                    <LevelToggle activeLevel={activeLevel} onLevelChange={setActiveLevel} />

                    {/* Abstract Card */}
                    {paper.abstract && activeSection === 'full' && (
                        <div className="glass-card">
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Original Abstract
                            </h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                                {paper.abstract}
                            </p>
                        </div>
                    )}

                    {/* Summary Display */}
                    {filteredSummary ? (
                        <SummaryCard
                            level={filteredSummary.level}
                            content={filteredSummary.content}
                            sectionName={filteredSummary.sectionName}
                            originalTokens={filteredSummary.originalTokens}
                            compressedTokens={filteredSummary.compressedTokens}
                            processingTimeMs={filteredSummary.processingTimeMs}
                        />
                    ) : (
                        <div className="glass-card" style={{ textAlign: 'center', padding: '2rem' }}>
                            <p style={{ color: 'var(--text-muted)' }}>
                                {generating
                                    ? '⏳ Generating summary... This may take a minute.'
                                    : `No ${activeLevel} summary for "${SECTION_LABELS[activeSection] || activeSection}" yet. Click "Generate Summary" to create one.`}
                            </p>
                        </div>
                    )}

                    {/* ROUGE Scores */}
                    <RougeScores scores={activeRouge?.scores || null} level={activeLevel} />

                    {/* Section Content Preview */}
                    {activeSection !== 'full' && paper.sections?.[activeSection] && (
                        <div className="glass-card">
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                📄 Section Content — {SECTION_LABELS[activeSection] || activeSection}
                            </h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.7, maxHeight: '300px', overflow: 'auto' }}>
                                {paper.sections[activeSection].substring(0, 2000)}
                                {paper.sections[activeSection].length > 2000 ? '...' : ''}
                            </p>
                            <button
                                className="btn btn-secondary btn-sm"
                                style={{ marginTop: '1rem' }}
                                onClick={() => handleGenerate(activeSection)}
                                disabled={generating}
                            >
                                {generating ? 'Generating...' : `Summarize ${SECTION_LABELS[activeSection] || activeSection}`}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
