(function () {
    const storageKey = 'webcomics_bookmarks';
    const legacyBookmarkIds = [
        'haven-ark-devils-blood',
        'forest-connect',
        'connect-alternate-world',
        'mysterious'
    ];

    const builtInComics = {
        'bloodhaven.html': {
            id: 'haven-ark-devils-blood',
            title: "Haven Ark: Devil's Blood",
            type: 'Comic',
            route: 'bloodhaven.html',
            cover: 'img/HavenArk_DevilsBlood.jpg',
            description: 'Dark fantasy comic'
        },
        'forestconnect.html': {
            id: 'forest-connect',
            title: 'Forest Connect',
            type: 'Web Novel',
            route: 'Forestconnect.html',
            cover: 'img/Untitled.png',
            description: 'Fantasy web novel'
        },
        'forestalternate.html': {
            id: 'connect-alternate-world',
            title: 'Connect Alternate World',
            type: 'Web Novel',
            route: 'ForestAlternate.html',
            cover: 'img/UntitledA.jpg',
            description: 'Fantasy web novel'
        },
        'mysterious.html': {
            id: 'mysterious',
            title: 'Mysterious',
            type: 'Comic',
            route: 'mysterious.html',
            cover: 'img/mysterious.jpg',
            description: 'Fantasy survival comic'
        }
    };

    function readBookmarks() {
        try {
            const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
            if (!Array.isArray(stored)) throw new Error('Saved bookmarks are not a list.');

            const bookmarks = stored.filter(item => item && typeof item.id === 'string');
            legacyBookmarkIds.forEach(id => {
                if (localStorage.getItem(`bookmark_${id}`) !== 'true') return;
                if (bookmarks.some(bookmark => bookmark.id === id)) return;
                const legacy = Object.values(builtInComics).find(comic => comic.id === id);
                if (legacy) bookmarks.push({ ...legacy, kind: 'built-in' });
            });
            return bookmarks;
        } catch (error) {
            console.error('Unable to load bookmarks from browser storage.', error);
            return [];
        }
    }

    function saveBookmarks(bookmarks) {
        try {
            localStorage.setItem(storageKey, JSON.stringify(bookmarks));
            return true;
        } catch (error) {
            console.error('Unable to save bookmarks to browser storage.', error);
            alert('Your bookmark could not be saved. Browser storage may be full.');
            return false;
        }
    }

    function getCurrentComic() {
        const currentFile = window.location.pathname.split('/').pop().toLowerCase();
        const builtIn = builtInComics[currentFile];
        if (builtIn) return { ...builtIn, kind: 'built-in' };

        if (currentFile === 'comic-details.html') {
            try {
                const comic = JSON.parse(localStorage.getItem('active_comic') || 'null');
                if (comic && comic.id != null) {
                    return {
                        id: `community:${String(comic.id)}`,
                        comicId: String(comic.id),
                        title: comic.title || 'Untitled Comic',
                        type: comic.type || 'comic',
                        kind: 'community'
                    };
                }
            } catch (error) {
                console.error('Unable to read the active comic for bookmarking.', error);
            }
        }

        return null;
    }

    function isSaved(id, bookmarks) {
        return bookmarks.some(bookmark => bookmark.id === id);
    }

    function updateButton(button, saved) {
        button.classList.toggle('bookmarked-green', saved);
        button.setAttribute('aria-pressed', String(saved));
        button.setAttribute('aria-label', saved ? 'Remove bookmark' : 'Add bookmark');
        const text = button.querySelector('.btn-text');
        if (text) text.textContent = 'Bookmark';
        const icon = button.querySelector('.btn-icon');
        if (icon) icon.src = saved ? 'img/bookmark_check.png' : 'img/bookmark_24.png';
    }

    function setupToggle() {
        const button = document.querySelector('.bookmark-toggle');
        const comic = getCurrentComic();
        if (!button || !comic) return;

        const bookmarks = readBookmarks();
        const saved = isSaved(comic.id, bookmarks)
            || (comic.kind === 'built-in' && localStorage.getItem(`bookmark_${comic.id}`) === 'true');
        updateButton(button, saved);

        button.addEventListener('click', function (event) {
            event.preventDefault();
            const currentBookmarks = readBookmarks();
            const currentlySaved = isSaved(comic.id, currentBookmarks);
            const updated = currentlySaved
                ? currentBookmarks.filter(bookmark => bookmark.id !== comic.id)
                : [...currentBookmarks, comic];

            if (!saveBookmarks(updated)) return;

            if (comic.kind === 'built-in') {
                localStorage.setItem(`bookmark_${comic.id}`, String(!currentlySaved));
            }
            updateButton(button, !currentlySaved);
        });
    }

    function getCommunityComics() {
        try {
            const comics = JSON.parse(localStorage.getItem('webcomics_list') || '[]');
            return Array.isArray(comics) ? comics : [];
        } catch (error) {
            console.error('Unable to read community comics for bookmarks.', error);
            return [];
        }
    }

    function createBookmarkCard(bookmark, comic, onRemove) {
        const card = document.createElement('article');
        card.className = 'card';

        const link = document.createElement('a');
        link.className = 'bookmark-card-link';
        link.href = bookmark.kind === 'community' ? 'comic-details.html' : bookmark.route;
        if (bookmark.kind === 'community') {
            link.addEventListener('click', function () {
                localStorage.setItem('active_comic', JSON.stringify(comic));
            });
        }

        const image = document.createElement('img');
        image.src = (comic && (comic.cover || comic.image)) || bookmark.cover || 'img/Untitled.png';
        image.alt = comic && comic.title ? `${comic.title} cover` : `${bookmark.title} cover`;
        image.loading = 'lazy';

        const info = document.createElement('div');
        info.className = 'card-info';
        const title = document.createElement('h3');
        title.textContent = (comic && comic.title) || bookmark.title || 'Untitled Comic';
        const description = document.createElement('p');
        if (bookmark.kind === 'community') {
            const chapterCount = Array.isArray(comic.chapters) ? comic.chapters.length : 0;
            description.textContent = `${comic.author || 'Community creator'} · ${chapterCount} chapters`;
        } else {
            description.textContent = bookmark.description || bookmark.type || 'Saved comic';
        }
        info.append(title, description);
        link.append(image, info);

        const remove = document.createElement('button');
        remove.className = 'remove-bookmark';
        remove.type = 'button';
        remove.textContent = 'Remove';
        remove.setAttribute('aria-label', `Remove ${title.textContent} from bookmarks`);
        remove.addEventListener('click', onRemove);

        card.append(link, remove);
        return card;
    }

    function setupBookmarkList() {
        const comicGrid = document.getElementById('comicBookmarkGrid');
        const novelGrid = document.getElementById('novelBookmarkGrid');
        if (!comicGrid || !novelGrid) return;

        const bookmarks = readBookmarks();
        const communityComics = getCommunityComics();
        const resolvedBookmarks = [];
        const bookmarkGrids = {
            comic: comicGrid,
            novel: novelGrid
        };
        comicGrid.replaceChildren();
        novelGrid.replaceChildren();

        bookmarks.forEach(bookmark => {
            const comic = bookmark.kind === 'community'
                ? communityComics.find(item => String(item.id) === bookmark.comicId)
                : null;
            if (bookmark.kind === 'community' && !comic) return;

            resolvedBookmarks.push(bookmark);
            const type = (comic && comic.type) || bookmark.type || '';
            const category = String(type).toLowerCase().includes('novel') ? 'novel' : 'comic';
            const grid = bookmarkGrids[category];
            const card = createBookmarkCard(bookmark, comic, function (event) {
                event.preventDefault();
                event.stopPropagation();
                const updated = readBookmarks().filter(item => item.id !== bookmark.id);
                if (bookmark.kind === 'built-in') {
                    localStorage.setItem(`bookmark_${bookmark.id}`, 'false');
                }
                if (saveBookmarks(updated)) setupBookmarkList();
            });
            grid.appendChild(card);
        });

        if (resolvedBookmarks.length !== bookmarks.length) {
            saveBookmarks(resolvedBookmarks);
        }

        if (comicGrid.childElementCount === 0) {
            const empty = document.createElement('p');
            empty.className = 'empty-message';
            empty.textContent = 'No comics bookmarked yet.';
            comicGrid.appendChild(empty);
        }
        if (novelGrid.childElementCount === 0) {
            const empty = document.createElement('p');
            empty.className = 'empty-message';
            empty.textContent = 'No web novels bookmarked yet.';
            novelGrid.appendChild(empty);
        }
    }

    function initialize() {
        setupToggle();
        setupBookmarkList();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize, { once: true });
    } else {
        initialize();
    }

    window.addEventListener('storage', function (event) {
        if (event.key === storageKey || event.key && event.key.startsWith('bookmark_') || event.key === 'webcomics_list') {
            setupBookmarkList();
            const button = document.querySelector('.bookmark-toggle');
            const comic = getCurrentComic();
            if (button && comic) updateButton(button, isSaved(comic.id, readBookmarks()));
        }
    });
})();
