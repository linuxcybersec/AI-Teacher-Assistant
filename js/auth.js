// Auth and storage helpers
(function() {
    const STORAGE_KEYS = {
        teacher: 'aita_teacher',
        openaiKey: 'aita_openai_key',
        reports: 'aita_reports',
        theme: 'aita_theme',
        accent: 'aita_accent',
        draft: 'aita_draft',
        model: 'aita_model'
    };

    function saveTeacher(teacher) {
        localStorage.setItem(STORAGE_KEYS.teacher, JSON.stringify(teacher));
    }

    function getTeacher() {
        const raw = localStorage.getItem(STORAGE_KEYS.teacher);
        return raw ? JSON.parse(raw) : null;
    }

    function clearAll() {
        localStorage.removeItem(STORAGE_KEYS.teacher);
        // keep reports across sessions; only clear on explicit action if needed
    }

    function saveOpenAIKey(key) {
        if (key) localStorage.setItem(STORAGE_KEYS.openaiKey, key);
    }

    function getOpenAIKey() {
        return localStorage.getItem(STORAGE_KEYS.openaiKey) || '';
    }

    function ensureReportsInit() {
        if (!localStorage.getItem(STORAGE_KEYS.reports)) {
            localStorage.setItem(STORAGE_KEYS.reports, JSON.stringify([]));
        }
    }

    function getReports() {
        ensureReportsInit();
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.reports));
    }

    function addReport(report) {
        const current = getReports();
        current.unshift(report);
        localStorage.setItem(STORAGE_KEYS.reports, JSON.stringify(current));
    }

    // Expose globally
    window.AITA = {
        saveTeacher,
        getTeacher,
        clearAll,
        saveOpenAIKey,
        getOpenAIKey,
        getReports,
        addReport,
        STORAGE_KEYS,
        getTheme: () => localStorage.getItem(STORAGE_KEYS.theme) || 'light',
        setTheme: (t) => localStorage.setItem(STORAGE_KEYS.theme, t),
        getAccent: () => localStorage.getItem(STORAGE_KEYS.accent) || '#0d6efd',
        setAccent: (c) => localStorage.setItem(STORAGE_KEYS.accent, c),
        getDraft: () => localStorage.getItem(STORAGE_KEYS.draft) || '',
        setDraft: (v) => localStorage.setItem(STORAGE_KEYS.draft, v),
        getModel: () => localStorage.getItem(STORAGE_KEYS.model) || 'gpt-4o-mini',
        setModel: (m) => localStorage.setItem(STORAGE_KEYS.model, m)
    };

    // Google Sign-In callback
    window.onGoogleSignIn = async function(response) {
        try {
            // Verify ID token server-side for security
            const credential = response.credential;
            const verifyResp = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential })
            });
            if (!verifyResp.ok) throw new Error('Token verification failed');
            const data = await verifyResp.json();
            saveTeacher(data.teacher);
            window.location.href = 'dashboard.html';
        } catch (e) {
            console.error('Google sign-in failed', e);
            alert('Google sign-in failed. Please try again.');
        }
    };
})();


