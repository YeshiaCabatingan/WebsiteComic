(function () {
    const catalog = [
        {
            id: 'haven-ark-devils-blood',
            title: "Haven Ark: Devil's Blood",
            author: 'WebComics',
            description: 'Dark fantasy comic',
            route: 'bloodhaven.html'
        },
        {
            id: 'forest-connect',
            title: 'Forest Connect',
            author: 'WebComics',
            description: 'Fantasy web novel',
            route: 'Forestconnect.html'
        },
        {
            id: 'connect-alternate-world',
            title: 'Connect Alternate World',
            author: 'WebComics',
            description: 'Fantasy web novel',
            route: 'ForestAlternate.html'
        },
        {
            id: 'mysterious',
            title: 'Mysterious',
            author: 'WebComics',
            description: 'Fantasy survival comic',
            route: 'mysterious.html'
        }
    ];

    function getCommunityComics() {
        try {
            const comics = JSON.parse(localStorage.getItem('webcomics_list') || '[]');
            if (!Array.isArray(comics)) throw new Error('Community comics are not stored as a list.');
            return comics
                .filter(comic => comic && comic.id != null)
                .map(comic => ({
                    id: `community:${String(comic.id)}`,
                    title: comic.title || 'Untitled Comic',
                    author: comic.author || '',
                    description: comic.synopsis || 'Community comic',
                    comic
                }));
        } catch (error) {
            console.error('Unable to load community comics for search.', error);
            return [];
        }
    }

    function initializeSearch(container) {
        const input = container.querySelector('.search-input');
        const button = container.querySelector('.search-btn');
        let dropdown = container.querySelector('.search-dropdown');
        if (!input || !button) return;

        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'search-dropdown';
            container.appendChild(dropdown);
        }

        const rootPrefix = window.location.pathname.toLowerCase().includes('/bloodhaven/')
            ? '../'
            : '';
        let items = [...catalog, ...getCommunityComics()];
        let activeIndex = -1;
        let visibleResults = [];

        function refreshItems() {
            items = [...catalog, ...getCommunityComics()];
        }

        function showDropdown() {
            container.classList.add('active');
            input.setAttribute('aria-expanded', 'true');
        }

        function hideDropdown() {
            container.classList.remove('active');
            input.setAttribute('aria-expanded', 'false');
            input.removeAttribute('aria-activedescendant');
            activeIndex = -1;
        }

        function navigateTo(item) {
            if (item.comic) {
                try {
                    localStorage.setItem('active_comic', JSON.stringify(item.comic));
                } catch (error) {
                    console.error('Unable to open the selected community comic.', error);
                    alert('This comic could not be opened from browser storage.');
                    return;
                }
                window.location.href = `${rootPrefix}comic-details.html`;
                return;
            }
            window.location.href = rootPrefix + item.route;
        }

        function setActiveResult(index) {
            const options = dropdown.querySelectorAll('.search-result');
            if (!options.length) return;

            activeIndex = (index + options.length) % options.length;
            options.forEach((option, optionIndex) => {
                const active = optionIndex === activeIndex;
                option.classList.toggle('active', active);
                option.setAttribute('aria-selected', String(active));
            });
            input.setAttribute('aria-activedescendant', options[activeIndex].id);
            options[activeIndex].scrollIntoView({ block: 'nearest' });
        }

        function renderResults(query) {
            refreshItems();
            const normalizedQuery = query.trim().toLocaleLowerCase();
            const terms = normalizedQuery.split(/\s+/).filter(Boolean);
            visibleResults = terms.length
                ? items.filter(item => {
                    const text = `${item.title} ${item.author} ${item.description}`.toLocaleLowerCase();
                    return terms.every(term => text.includes(term));
                }).slice(0, 8)
                : items.slice(0, 5);
            activeIndex = -1;
            dropdown.replaceChildren();

            if (!visibleResults.length) {
                const empty = document.createElement('div');
                empty.className = 'search-empty';
                empty.textContent = 'No comics found. Try another title or creator.';
                dropdown.appendChild(empty);
                showDropdown();
                return;
            }

            visibleResults.forEach((item, index) => {
                const result = document.createElement('a');
                result.className = 'dropdown-item search-result';
                result.id = `search-result-${index}`;
                result.href = item.comic ? `${rootPrefix}comic-details.html` : rootPrefix + item.route;
                result.setAttribute('role', 'option');
                result.setAttribute('aria-selected', 'false');

                const title = document.createElement('span');
                title.className = 'search-result-title';
                title.textContent = item.title;
                const details = document.createElement('small');
                details.className = 'search-result-details';
                details.textContent = item.author
                    ? `${item.description} · ${item.author}`
                    : item.description;
                result.append(title, details);

                result.addEventListener('click', function (event) {
                    event.preventDefault();
                    navigateTo(item);
                });
                result.addEventListener('mouseenter', function () {
                    setActiveResult(index);
                });
                dropdown.appendChild(result);
            });
            showDropdown();
        }

        function submitSearch() {
            const query = input.value.trim();
            refreshItems();
            if (!query) {
                renderResults('');
                input.focus();
                return;
            }

            const terms = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
            const match = items.find(item => {
                const text = `${item.title} ${item.author} ${item.description}`.toLocaleLowerCase();
                return terms.every(term => text.includes(term));
            });
            if (match) {
                navigateTo(match);
                return;
            }
            renderResults(query);
        }

        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-autocomplete', 'list');
        input.setAttribute('aria-controls', 'searchDropdown');
        input.setAttribute('aria-expanded', 'false');
        dropdown.setAttribute('role', 'listbox');
        dropdown.id = dropdown.id || 'searchDropdown';
        dropdown.replaceChildren();

        input.addEventListener('focus', function () {
            renderResults(input.value);
        });
        input.addEventListener('click', function (event) {
            event.stopPropagation();
            renderResults(input.value);
        });
        input.addEventListener('input', function () {
            renderResults(input.value);
        });
        input.addEventListener('keydown', function (event) {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                if (!container.classList.contains('active')) renderResults(input.value);
                setActiveResult(activeIndex + 1);
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActiveResult(activeIndex < 0 ? visibleResults.length - 1 : activeIndex - 1);
            } else if (event.key === 'Enter') {
                event.preventDefault();
                if (activeIndex >= 0 && visibleResults[activeIndex]) {
                    navigateTo(visibleResults[activeIndex]);
                } else {
                    submitSearch();
                }
            } else if (event.key === 'Escape') {
                hideDropdown();
            }
        });
        button.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            submitSearch();
        });
        container.addEventListener('click', function (event) {
            event.stopPropagation();
            if (event.target === container) {
                input.focus();
                renderResults(input.value);
            }
        });
        document.addEventListener('click', function () {
            hideDropdown();
        });
        window.addEventListener('storage', function (event) {
            if (event.key === 'webcomics_list') renderResults(input.value);
        });
    }

    function initialize() {
        document.querySelectorAll('.search-container').forEach(initializeSearch);
        initializeColorModes();
    }

    function initializeColorModes() {
        if (!document.querySelector('.navbar') || document.querySelector('.color-mode-picker')) return;

        const modes = [
            { id: 'ember', label: 'Ember', color: '#ff8906' },
            { id: 'ocean', label: 'Ocean', color: '#38bdf8' },
            { id: 'forest', label: 'Forest', color: '#4ade80' },
            { id: 'violet', label: 'Violet', color: '#c084fc' },
            { id: 'rose', label: 'Rose', color: '#fb7185' }
        ];
        const picker = document.createElement('div');
        const toggle = document.createElement('button');
        const toggleMark = document.createElement('span');
        const options = document.createElement('div');

        picker.className = 'color-mode-picker';
        toggle.className = 'color-mode-toggle';
        toggle.type = 'button';
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Choose a color mode');
        options.className = 'color-mode-options';
        options.id = 'colorModeOptions';
        options.setAttribute('role', 'group');
        options.setAttribute('aria-label', 'Color modes');
        toggle.setAttribute('aria-controls', options.id);
        toggleMark.className = 'color-mode-toggle-mark';
        toggle.append(toggleMark, document.createTextNode('Colors'));

        let selectedMode = 'ember';
        try {
            const savedMode = localStorage.getItem('webcomics_color_mode');
            if (modes.some(mode => mode.id === savedMode)) selectedMode = savedMode;
        } catch (error) {
            console.error('Unable to load the saved color mode.', error);
        }

        function applyMode(mode) {
            document.body.dataset.colorMode = mode.id;
            selectedMode = mode.id;
            options.querySelectorAll('.color-mode-option').forEach(option => {
                option.setAttribute('aria-pressed', String(option.dataset.mode === selectedMode));
            });
            try {
                localStorage.setItem('webcomics_color_mode', selectedMode);
            } catch (error) {
                console.error('Unable to save the selected color mode.', error);
            }
        }

        modes.forEach(mode => {
            const option = document.createElement('button');
            const swatch = document.createElement('span');
            option.className = 'color-mode-option';
            option.type = 'button';
            option.dataset.mode = mode.id;
            option.setAttribute('aria-pressed', String(mode.id === selectedMode));
            swatch.className = 'color-mode-swatch';
            swatch.style.setProperty('--swatch-color', mode.color);
            option.append(swatch, document.createTextNode(mode.label));
            option.addEventListener('click', function () {
                applyMode(mode);
            });
            options.appendChild(option);
        });

        applyMode(modes.find(mode => mode.id === selectedMode));
        picker.append(toggle, options);
        document.body.appendChild(picker);

        toggle.addEventListener('click', function (event) {
            event.stopPropagation();
            const isOpen = picker.classList.toggle('active');
            toggle.setAttribute('aria-expanded', String(isOpen));
        });
        picker.addEventListener('click', function (event) {
            event.stopPropagation();
        });
        document.addEventListener('click', function () {
            picker.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
        });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                picker.classList.remove('active');
                toggle.setAttribute('aria-expanded', 'false');
                toggle.focus();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize, { once: true });
    } else {
        initialize();
    }
})();
