import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ai-research-paper-summarizer-server.onrender.com/api';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 120000, // 2 min timeout for long summarization tasks
});

// ===== PAPERS =====
export async function fetchPapers() {
    const res = await api.get('/papers');
    return res.data;
}

export async function fetchPaper(id: string) {
    const res = await api.get(`/papers/${id}`);
    return res.data;
}

export async function uploadPaper(file: File, title?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    const res = await api.post('/papers/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
}

export async function submitArxivUrl(url: string) {
    const res = await api.post('/papers/url', { url });
    return res.data;
}

export async function deletePaper(id: string) {
    const res = await api.delete(`/papers/${id}`);
    return res.data;
}

// ===== SUMMARIES =====
export async function generateSummary(paperId: string, sectionName?: string) {
    const res = await api.post('/summaries/generate', { paperId, sectionName });
    return res.data;
}

export async function fetchSummaries(paperId: string) {
    const res = await api.get(`/summaries/${paperId}`);
    return res.data;
}

export async function fetchRougeScores(paperId: string) {
    const res = await api.get(`/summaries/rouge/${paperId}`);
    return res.data;
}

// ===== LITERATURE REVIEW =====
export async function generateLitReview(paperIds: string[], title?: string) {
    const res = await api.post('/summaries/lit-review', { paperIds, title });
    return res.data;
}

export async function fetchLitReviews() {
    const res = await api.get('/summaries/lit-reviews/all');
    return res.data;
}

// ===== STATS =====
export async function fetchStats() {
    const res = await api.get('/stats');
    return res.data;
}
