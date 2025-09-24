// Landing page behavior
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        const teacher = window.AITA.getTeacher();
        if (teacher) {
            window.location.href = 'dashboard.html';
            return;
        }
        // Apply saved theme/accent
        const theme = window.AITA.getTheme();
        if (theme === 'dark') document.body.classList.add('theme-dark');
        const accent = window.AITA.getAccent();
        document.body.setAttribute('data-accent', accent);
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.addEventListener('click', () => {
                document.body.classList.toggle('theme-dark');
                const now = document.body.classList.contains('theme-dark') ? 'dark' : 'light';
                window.AITA.setTheme(now);
            });
        }
        // PWA
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js').catch(()=>{});
        }
        const mockBtn = document.getElementById('mockLoginBtn');
        if (mockBtn) {
            mockBtn.addEventListener('click', function() {
                const mock = {
                    name: 'Demo Teacher',
                    email: 'demo.teacher@example.com',
                    picture: 'https://i.pravatar.cc/150?img=5'
                };
                window.AITA.saveTeacher(mock);
                window.location.href = 'dashboard.html';
            });
        }
    });
})();


