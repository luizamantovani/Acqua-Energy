document.getElementById('toggleTheme').addEventListener('click', () => {
    const currentTheme = document.getElementById('themeStylesheet').getAttribute('href');
    if (currentTheme === '../style.css') {
        document.getElementById('themeStylesheet').setAttribute('href', '../style-escuro.css');
        document.getElementById('toggleTheme').innerText = 'Modo Claro';
    } else {
        document.getElementById('themeStylesheet').setAttribute('href', '../style.css');
        document.getElementById('toggleTheme').innerText = 'Modo Escuro';
    }
});
