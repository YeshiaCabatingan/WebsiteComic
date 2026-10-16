(function () {
    const defaultAvatar = 'img/people.png';

    function readStoredObject(key) {
        const value = localStorage.getItem(key);
        if (!value) return null;

        try {
            return JSON.parse(value);
        } catch (error) {
            console.error(`Unable to read ${key} from browser storage.`, error);
            return null;
        }
    }

    function getCurrentUser() {
        return readStoredObject('logged_in_user') || readStoredObject('current_user_profile');
    }

    function getCurrentAvatar() {
        const user = getCurrentUser();
        return user ? (user.avatar || localStorage.getItem('user_avatar') || '') : '';
    }

    function findUserByName(name) {
        const normalizedName = name.trim().toLowerCase();
        if (!normalizedName) return null;

        const users = readStoredObject('webcomics_users');
        if (Array.isArray(users)) {
            const registeredUser = users.find(user =>
                (user.username || user.name || '').trim().toLowerCase() === normalizedName
            );
            if (registeredUser) return registeredUser;
        }

        const currentUser = getCurrentUser();
        if (currentUser &&
            (currentUser.username || currentUser.name || '').trim().toLowerCase() === normalizedName) {
            return currentUser;
        }

        return null;
    }

    function setImage(image, src, alt) {
        if (!image) return;
        if (image.getAttribute('src') !== src) image.src = src;
        image.alt = alt;
        image.style.borderRadius = '50%';
        image.style.objectFit = 'cover';
    }

    function syncCurrentUserImages() {
        const user = getCurrentUser();
        const avatar = getCurrentAvatar();
        const accountName = user && (user.username || user.name) || 'Profile';

        document.querySelectorAll('#navUserIcon').forEach(image => {
            const fallbackAvatar = image.dataset.defaultAvatar || image.getAttribute('src') || defaultAvatar;
            image.dataset.defaultAvatar = fallbackAvatar;
            setImage(image, avatar || fallbackAvatar, avatar ? `${accountName}'s profile photo` : 'Account');
        });
        document.querySelectorAll('#accountAvatar, #commentFormAvatarImg').forEach(image => {
            const fallbackAvatar = image.dataset.defaultAvatar || image.getAttribute('src') || defaultAvatar;
            image.dataset.defaultAvatar = fallbackAvatar;
            setImage(image, avatar || fallbackAvatar, avatar ? `${accountName}'s profile photo` : 'Default profile avatar');
        });
    }

    function syncCommentAvatars() {
        document.querySelectorAll('.comment-item').forEach(comment => {
            const author = comment.querySelector('.comment-author');
            const avatar = comment.querySelector('.comment-avatar');
            if (!author || !avatar) return;

            const account = findUserByName(author.textContent || '');
            if (!account) return;

            const imageUrl = account.avatar || '';
            if (imageUrl) {
                let image = avatar.querySelector('img');
                if (!image) {
                    image = document.createElement('img');
                    image.style.width = '100%';
                    image.style.height = '100%';
                    image.style.objectFit = 'cover';
                    avatar.replaceChildren(image);
                }
                setImage(image, imageUrl, `${author.textContent.trim()}'s profile photo`);
                avatar.style.width = '40px';
                avatar.style.height = '40px';
                avatar.style.borderRadius = '50%';
                avatar.style.overflow = 'hidden';
                avatar.style.flexShrink = '0';
            } else if (avatar.querySelector('img')) {
                avatar.textContent = author.textContent.trim().charAt(0).toUpperCase() || '?';
                avatar.style.width = '40px';
                avatar.style.height = '40px';
                avatar.style.borderRadius = '50%';
                avatar.style.background = '#ff8906';
                avatar.style.color = '#0f0e17';
                avatar.style.display = 'flex';
                avatar.style.alignItems = 'center';
                avatar.style.justifyContent = 'center';
                avatar.style.fontWeight = 'bold';
                avatar.style.flexShrink = '0';
            }
        });
    }

    function synchronizeAvatars() {
        syncCurrentUserImages();
        syncCommentAvatars();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', synchronizeAvatars, { once: true });
    } else {
        synchronizeAvatars();
    }

    const observer = new MutationObserver(syncCommentAvatars);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('storage', synchronizeAvatars);
})();
