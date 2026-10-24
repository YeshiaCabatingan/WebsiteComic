(function () {
    const scriptUrl = document.currentScript && document.currentScript.src;
    const registerUrl = scriptUrl ? new URL('../register.html', scriptUrl).href : 'register.html';
    let redirecting = false;

    function hasAccountSession() {
        for (const key of ['logged_in_user', 'current_user_profile']) {
            const storedAccount = localStorage.getItem(key);
            if (!storedAccount) continue;

            try {
                const account = JSON.parse(storedAccount);
                if (account && (account.username || account.name)) return true;
            } catch (error) {
                console.error(`Unable to read ${key} from browser storage.`, error);
            }
        }

        return false;
    }

    function requireAccount(event) {
        if (hasAccountSession()) return true;

        event.preventDefault();
        event.stopImmediatePropagation();

        redirectToRegistration();
        return false;
    }

    function redirectToRegistration() {
        if (!redirecting) {
            redirecting = true;
            alert('You need an account to use this feature. Sign up to continue.');
            window.location.assign(registerUrl);
        }
    }

    document.addEventListener('click', function (event) {
        const target = event.target;
        if (!(target instanceof Element)) return;

        const profileLink = target.closest('.profile-icon-btn');
        const actionLink = target.closest('a[href]');
        const isAccountLink = profileLink || (actionLink && /(?:^|\/)account\.html$/i.test(new URL(actionLink.href, document.baseURI).pathname));
        const isPublishLink = actionLink && /(?:^|\/)publishcomic\.html$/i.test(new URL(actionLink.href, document.baseURI).pathname);
        const isBookmarkLink = actionLink && /(?:^|\/)bookmark\.html$/i.test(new URL(actionLink.href, document.baseURI).pathname);

        if (isAccountLink || isPublishLink || isBookmarkLink) {
            requireAccount(event);
            return;
        }

        if (target.closest('.comment-form, #commentForm, .bookmark-toggle, .remove-bookmark')) {
            requireAccount(event);
        }
    }, true);

    document.addEventListener('submit', function (event) {
        const form = event.target;
        if (form instanceof HTMLFormElement && (form.matches('.comment-form, #commentForm, #publishForm'))) {
            requireAccount(event);
        }
    }, true);

    if (/(?:^|\/)bookmark\.html$/i.test(window.location.pathname) && !hasAccountSession()) {
        redirectToRegistration();
    }
})();
