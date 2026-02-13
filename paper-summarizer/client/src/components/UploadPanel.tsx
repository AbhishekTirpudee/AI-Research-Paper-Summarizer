import { useState, useRef } from 'react';

interface UploadPanelProps {
    onUpload: (file: File) => void;
    onUrlSubmit: (url: string) => void;
    loading: boolean;
}

export default function UploadPanel({ onUpload, onUrlSubmit, loading }: UploadPanelProps) {
    const [dragover, setDragover] = useState(false);
    const [url, setUrl] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragover(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            onUpload(file);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onUpload(file);
    };

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            onUrlSubmit(url.trim());
            setUrl('');
        }
    };

    return (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div
                className={`upload-panel ${dragover ? 'dragover' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
                onDragLeave={() => setDragover(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
            >
                <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />
                <span className="upload-icon">📤</span>
                <h3>{loading ? 'Processing...' : 'Drop a PDF or Click to Upload'}</h3>
                <p>Max PDF size: 50 MB</p>

                {loading && (
                    <div style={{ marginTop: '1rem' }}>
                        <span className="spinner" />
                    </div>
                )}
            </div>

            <div style={{ padding: '0 2rem 1.5rem' }}>
                <form onSubmit={handleUrlSubmit} className="url-input-group" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste arXiv URL or ID (e.g., 2301.13848)"
                        disabled={loading}
                    />
                    <button type="submit" className="btn btn-primary" disabled={loading || !url.trim()}>
                        {loading ? <span className="spinner" /> : '🔍'} Fetch
                    </button>
                </form>
            </div>
        </div>
    );
}
