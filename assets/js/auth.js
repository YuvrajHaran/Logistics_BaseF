/**
 * auth.js — Authentication Handler
 * Runs on every page load after api.js
 */

$(document).ready(function () {
    checkAuth();

    $(document).on('click', '#logoutBtn, #sidebarLogout', function (e) {
        e.preventDefault();
        handleLogout();
    });
});

/* ---- Auth check on every page ---- */
function checkAuth() {
    const token = getAccessToken();
    const page  = getCurrentPageName();
    const isLogin = (page === 'index' || page === '');

    if (isLogin && token) { window.location.href = 'dashboard.html'; return; }
    if (!isLogin && !token) { window.location.href = 'index.html'; return; }

    if (token) {
        const user = getCurrentUser();
        if (user) {
            const name = user.username || user.email || 'Admin';
            // Update any header name elements injected by layout.js
            $('#headerUserName, #sidebarUserName').text(name);
            $('.user-name').text(name);
        }
    }
}

/* ---- Login ---- */
function handleLogin() {
    const username = $('#email').val().trim();
    const password = $('#password').val().trim();
    if (!username || !password) { showNotification('Please enter username and password', 'error'); return; }

    const btn = $('#loginForm button[type="submit"]');
    btn.html('<span class="btn-loader"></span>Logging in…').prop('disabled', true);

    $.ajax({
        url: API_BASE_URL + API_ENDPOINTS.LOGIN,
        method: 'POST', contentType: 'application/json',
        data: JSON.stringify({ username, password }),
        success(res) {
            saveTokens(res.access, res.refresh);
            saveUserData({ username, email: res.email || '' });
            showNotification('Login successful! Redirecting…', 'success');
            setTimeout(() => window.location.href = 'dashboard.html', 800);
        },
        error(xhr) {
            btn.html('Login').prop('disabled', false);
            let msg = 'Login failed. Please try again.';
            if (xhr.status === 401) msg = 'Invalid username or password';
            else if (xhr.status === 0) msg = 'Cannot connect to server.';
            else { const r = xhr.responseJSON; if (r) { if (r.detail) msg = r.detail; else if (r.non_field_errors) msg = r.non_field_errors[0]; } }
            showNotification(msg, 'error');
        }
    });
}

/* ---- Logout ---- */
function handleLogout() {
    showNotification('Logging out…', 'info');
    $.ajax({
        url: API_BASE_URL + API_ENDPOINTS.LOGOUT,
        method: 'POST', contentType: 'application/json',
        headers: { 'Authorization': 'Bearer ' + getAccessToken() },
        data: JSON.stringify({ refresh: getRefreshToken() }),
        complete() { clearTokens(); window.location.href = 'index.html'; }
    });
}

/* ---- Helpers ---- */
function getCurrentPageName() {
    return window.location.pathname.split('/').pop().replace('.html', '') || 'index';
}

/* ---- showNotification (single source of truth) ---- */
function showNotification(message, type = 'info') {
    $('.app-notification').remove();
    const colors = { success: '#10b981', error: '#ef4444', info: '#3b82f6', warning: '#f59e0b' };
    const el = $(`<div class="app-notification" style="background:${colors[type]||colors.info}">${message}</div>`);
    $('body').append(el);
    // add spin keyframe once
    if (!$('#notif-style').length) {
        $('<style id="notif-style">').text('@keyframes slideInRight{from{opacity:0;transform:translateX(80px)}to{opacity:1;transform:translateX(0)}} @keyframes spin{to{transform:rotate(360deg)}}').appendTo('head');
    }
    setTimeout(() => el.fadeOut(300, function () { $(this).remove(); }), 3500);
    el.on('click', () => el.remove());
}

/* ---- confirmDialog helper ---- */
function confirmDialog(msg, cb) { if (confirm(msg)) cb(); }
