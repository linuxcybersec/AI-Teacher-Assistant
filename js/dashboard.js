// Dashboard interactions: navigation, essay analysis, reports, profile
(function() {
    function requireAuthOrRedirect() {
        const teacher = window.AITA.getTeacher();
        if (!teacher) {
            window.location.href = 'index.html';
            return null;
        }
        return teacher;
    }

    async function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    async function callOpenAIForFeedback(essayText, options) {
        const apiKey = window.AITA.getOpenAIKey();
        const model = window.AITA.getModel();
        const rubric = options?.rubric || 'basic';
        const explain = !!options?.explain;
        if (!apiKey) {
            // Mock response
            await new Promise(r => setTimeout(r, 800));
            return {
                grammar: `Rubric: ${rubric}. Fixed several subject-verb agreements and punctuation errors.`,
                clarity: 'Suggested shorter sentences and clearer topic sentences per paragraph.' + (explain ? '\nWhy: shorter sentences aid processing; topic sentences improve coherence.' : ''),
                score: 87,
                raw: 'Mocked feedback without API key.'
            };
        }
        try {
            // Route analysis through backend to avoid exposing API key in browser
            const resp = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ essayText, rubric, explain, model })
            });
            if (!resp.ok) throw new Error('OpenAI request failed');
            const data = await resp.json();
            return data;
        } catch (e) {
            console.error(e);
            return {
                grammar: 'Error calling OpenAI. Using mock guidance: check punctuation and sentence variety.',
                clarity: 'Ensure each paragraph has a clear topic sentence and transitions.',
                score: 75,
                raw: 'Fallback due to error.'
            };
        }
    }

    function renderReportsTable() {
        const tbody = document.querySelector('#reportsTable tbody');
        if (!tbody) return;
        const q = (document.getElementById('reportSearch')?.value || '').toLowerCase().trim();
        const reports = window.AITA.getReports().filter(r => {
            if (!q) return true;
            return (
                r.studentName?.toLowerCase().includes(q) ||
                r.essayTitle?.toLowerCase().includes(q) ||
                (r.feedback || '').toLowerCase().includes(q)
            );
        });
        tbody.innerHTML = '';
        for (const r of reports) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${r.studentName}</td>
                <td>${r.essayTitle}</td>
                <td><div style="max-width:450px; white-space:pre-wrap">${(r.feedback || '').replace(/</g,'&lt;')}</div></td>
                <td><span class="badge text-bg-primary">${r.score}</span></td>
                <td>${new Date(r.createdAt).toLocaleString()}</td>`;
            tbody.appendChild(tr);
        }
    }

    function exportCSV() {
        const reports = window.AITA.getReports();
        const data = reports.map(r => ({
            studentName: r.studentName,
            essayTitle: r.essayTitle,
            feedback: r.feedback,
            score: r.score,
            date: new Date(r.createdAt).toISOString()
        }));
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ai-teacher-reports.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    function exportPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        const margin = 40;
        let y = margin;
        doc.setFontSize(16);
        doc.text('AI Teacher Assistant - Reports', margin, y);
        y += 20;
        const reports = window.AITA.getReports();
        doc.setFontSize(11);
        reports.forEach((r, idx) => {
            if (y > 760) { doc.addPage(); y = margin; }
            doc.text(`${idx + 1}. ${r.studentName} - ${r.essayTitle} (${r.score})`, margin, y);
            y += 14;
            const feedback = (r.feedback || '').replace(/\r?\n/g, ' ');
            const split = doc.splitTextToSize(feedback, 515);
            split.forEach(line => {
                if (y > 780) { doc.addPage(); y = margin; }
                doc.text(line, margin, y);
                y += 14;
            });
            y += 10;
        });
        doc.save('ai-teacher-reports.pdf');
    }

    document.addEventListener('DOMContentLoaded', function() {
        const teacher = requireAuthOrRedirect();
        if (!teacher) return;

        // Theme & accent
        const savedTheme = window.AITA.getTheme();
        if (savedTheme === 'dark') document.body.classList.add('theme-dark');
        const savedAccent = window.AITA.getAccent();
        document.body.setAttribute('data-accent', savedAccent);
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('theme-dark');
            const now = document.body.classList.contains('theme-dark') ? 'dark' : 'light';
            window.AITA.setTheme(now);
        });

        // Nav mini profile
        const miniName = document.getElementById('miniName');
        const miniAvatar = document.getElementById('miniAvatar');
        if (miniName) miniName.textContent = teacher.name || '';
        if (miniAvatar) miniAvatar.src = teacher.picture || '';

        // Sidebar nav
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                const target = link.getAttribute('data-section');
                document.querySelectorAll('main section').forEach(sec => sec.classList.add('d-none'));
                document.getElementById(target).classList.remove('d-none');
                if (target === 'reportsSection') renderReportsTable();
                if (target === 'profileSection') {
                    // Populate profile
                    const pName = document.getElementById('profileName');
                    const pEmail = document.getElementById('profileEmail');
                    const pAvatar = document.getElementById('profileAvatar');
                    if (pName) pName.textContent = teacher.name || '';
                    if (pEmail) pEmail.textContent = teacher.email || '';
                    if (pAvatar) pAvatar.src = teacher.picture || '';
                    const nameInput = document.getElementById('profileNameInput');
                    const emailReadonly = document.getElementById('profileEmailReadonly');
                    if (nameInput) nameInput.value = teacher.name || '';
                    if (emailReadonly) emailReadonly.value = teacher.email || '';
                }
            });
        });

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                window.AITA.clearAll();
                window.location.href = 'index.html';
            });
        }

        // Save profile (name only)
        const saveProfileBtn = document.getElementById('saveProfileBtn');
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', function() {
                const nameInput = document.getElementById('profileNameInput');
                const newName = nameInput.value.trim();
                if (!newName) { alert('Name cannot be empty.'); return; }
                const existing = window.AITA.getTeacher() || {};
                const updated = { ...existing, name: newName };
                window.AITA.saveTeacher(updated);
                // Reflect immediately
                const pName = document.getElementById('profileName');
                const miniName = document.getElementById('miniName');
                if (pName) pName.textContent = newName;
                if (miniName) miniName.textContent = newName;
                const toastEl = document.getElementById('globalToast');
                if (toastEl) {
                    toastEl.querySelector('.toast-body').textContent = 'Profile updated';
                    (new bootstrap.Toast(toastEl)).show();
                } else {
                    alert('Profile updated');
                }
            });
        }

        // Essay form
        const form = document.getElementById('essayForm');
        const fileInput = document.getElementById('essayFile');
        const essayText = document.getElementById('essayText');
        const feedbackArea = document.getElementById('feedbackArea');
        const scoreArea = document.getElementById('scoreArea');
        const approveBtn = document.getElementById('approveBtn');
        const progressBar = document.getElementById('progressBar');
        const dropzone = document.getElementById('dropzone');
        const charCount = document.getElementById('charCount');

        if (fileInput) {
            fileInput.addEventListener('change', async function() {
                const file = fileInput.files?.[0];
                if (file) {
                    const text = await readFileAsText(file);
                    essayText.value = text;
                    essayText.dispatchEvent(new Event('input'));
                }
            });
        }

        if (essayText && charCount) {
            const updateCount = () => {
                const len = essayText.value.length;
                charCount.textContent = String(len);
                charCount.parentElement.classList.toggle('over', len > 8000);
            };
            essayText.addEventListener('input', updateCount);
            updateCount();
            // Autosave
            essayText.value = window.AITA.getDraft() || essayText.value;
            updateCount();
            essayText.addEventListener('input', () => window.AITA.setDraft(essayText.value));
        }

        if (dropzone) {
            ;['dragenter','dragover'].forEach(ev => dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.add('dragover'); }));
            ;['dragleave','drop'].forEach(ev => dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.remove('dragover'); }));
            dropzone.addEventListener('drop', async e => {
                const file = e.dataTransfer?.files?.[0];
                if (file && file.type === 'text/plain') {
                    const text = await readFileAsText(file);
                    essayText.value = text;
                    essayText.dispatchEvent(new Event('input'));
                }
            });
            dropzone.addEventListener('click', () => fileInput?.click());
        }

        let lastResult = null;
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                const studentName = document.getElementById('studentName').value.trim();
                const essayTitle = document.getElementById('essayTitle').value.trim();
                const text = essayText.value.trim();
                const rubricPreset = document.getElementById('rubricPreset')?.value || 'basic';
                const explainToggle = document.getElementById('explainToggle')?.checked || false;
                if (!studentName || !essayTitle || !text) {
                    alert('Please fill student name, essay title, and essay text.');
                    return;
                }

                const modal = new bootstrap.Modal(document.getElementById('analysisModal'));
                modal.show();
                approveBtn.disabled = true;
                feedbackArea.textContent = 'Analyzing...';
                scoreArea.textContent = '';
                lastResult = null;
                if (progressBar) progressBar.style.width = '5%';
                const res = await callOpenAIForFeedback(text, { rubric: rubricPreset, explain: explainToggle });
                modal.hide();
                lastResult = res;
                const feedbackText = `Rubric: ${rubricPreset}${explainToggle ? ' (explained)' : ''}\n\nGrammar/Corrections\n${res.grammar}\n\nClarity Suggestions\n${res.clarity || '—'}`;
                // typing animation
                feedbackArea.textContent = '';
                const chars = feedbackText.split('');
                let i = 0;
                const typeTimer = setInterval(() => {
                    feedbackArea.textContent += chars[i] || '';
                    i++;
                    if (i >= chars.length) clearInterval(typeTimer);
                }, 5);
                scoreArea.textContent = String(res.score);
                approveBtn.disabled = false;
                if (progressBar) progressBar.style.width = '100%';

                // Attach approve handler
                approveBtn.onclick = function() {
                    const toSave = {
                        studentName,
                        essayTitle,
                        essayText: text,
                        feedback: feedbackText,
                        score: res.score,
                        createdAt: Date.now()
                    };
                    window.AITA.addReport(toSave);
                    window.AITA.setDraft('');
                    // Toast
                    const toastEl = document.getElementById('globalToast');
                    if (toastEl) {
                        toastEl.querySelector('.toast-body').textContent = 'Saved to Reports';
                        (new bootstrap.Toast(toastEl)).show();
                    } else {
                        alert('Saved to Reports.');
                    }
                    // switch to reports
                    document.querySelector('[data-section="reportsSection"]').click();
                };
            });
        }

        // Reports search
        const search = document.getElementById('reportSearch');
        if (search) search.addEventListener('input', renderReportsTable);

        // Exports
        const pdfBtn = document.getElementById('exportPdfBtn');
        const csvBtn = document.getElementById('exportCsvBtn');
        if (pdfBtn) pdfBtn.addEventListener('click', exportPDF);
        if (csvBtn) csvBtn.addEventListener('click', exportCSV);

        // Initial render
        renderReportsTable();

        // Remove now-unused listeners if elements not present (no-op)

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                const btn = document.getElementById('analyzeBtn');
                if (btn) btn.click();
            }
        });

        // PWA
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js').catch(()=>{});
        }
    });
})();


