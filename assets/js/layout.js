/**
 * layout.js — Shared Navigation Component
 * Injects header + sidebar + mobile bottom nav into every page.
 */
(function () {
    'use strict';

    const NAV_ITEMS = [
        { href: 'dashboard.html',         icon: '📊', text: 'Dashboard',  id: 'dashboard' },
        { href: 'vehicles.html',          icon: '🚛', text: 'Vehicles',   id: 'vehicles' },
        { href: 'drivers.html',           icon: '👥', text: 'Drivers',    id: 'drivers' },
        { href: 'expenses.html',          icon: '💰', text: 'Expenses',   id: 'expenses' },
        { href: 'billing.html',           icon: '🧾', text: 'Billing',    id: 'billing' },
        { href: 'reports.html',           icon: '📈', text: 'Reports',    id: 'reports' },
        { href: 'transit_checklist.html', icon: '📋', text: 'Checklist',  id: 'transit_checklist' },
        { href: 'notifications.html',     icon: '🔔', text: 'Alerts',     id: 'notifications' },
        { href: 'settings.html',          icon: '⚙️', text: 'Settings',   id: 'settings' },
    ];

    // Bottom nav — 5 most-used items
    const BOTTOM_NAV = [
        { href: 'dashboard.html',     icon: '📊', text: 'Home',      id: 'dashboard' },
        { href: 'vehicles.html',      icon: '🚛', text: 'Vehicles',  id: 'vehicles' },
        { href: 'drivers.html',       icon: '👥', text: 'Drivers',   id: 'drivers' },
        { href: 'expenses.html',      icon: '💰', text: 'Expenses',  id: 'expenses' },
        { href: 'notifications.html', icon: '🔔', text: 'Alerts',    id: 'notifications' },
    ];

    function getCurrentPage() {
        const p = window.location.pathname.split('/').pop().replace('.html', '');
        return p || 'index';
    }

    function isActive(itemId) {
        const cur = getCurrentPage();
        if (itemId === 'vehicles' && cur === 'vehicle-detail') return true;
        return cur === itemId;
    }

    function buildHeader() {
        return `
<header class="app-header" id="appHeader">
  <div class="header-left">
    <button class="hamburger" id="menuToggle" aria-label="Toggle menu">
      <span></span><span></span><span></span>
    </button>
    <a href="dashboard.html" class="logo-link">
      <div class="logo">🚛 <span>LogisticsPro</span></div>
    </a>
  </div>
  <div class="header-right">
    <a href="notifications.html" class="notif-btn" id="notificationBtn">
      <span class="notif-icon">🔔</span>
      <span class="notif-badge" id="notifBadge">8</span>
    </a>
    <div class="user-menu">
      <button class="user-btn" id="userBtn">
        <span class="user-avatar">👤</span>
        <span class="user-name" id="headerUserName">Admin</span>
        <span class="chevron">▾</span>
      </button>
      <div class="user-dropdown" id="userDropdown">
        <a href="settings.html" class="dropdown-item">⚙️ Settings</a>
        <div class="dropdown-divider"></div>
        <a href="#" id="logoutBtn" class="dropdown-item danger">🚪 Logout</a>
      </div>
    </div>
  </div>
</header>`;
    }

    function buildSidebar() {
        const navItems = NAV_ITEMS.map(item => `
    <a href="${item.href}" class="nav-item${isActive(item.id) ? ' active' : ''}">
      <span class="nav-icon">${item.icon}</span>
      <span class="nav-text">${item.text}</span>
      ${item.id === 'notifications' ? '<span class="nav-badge" id="sidebarNotifBadge">8</span>' : ''}
    </a>`).join('');

        return `
<aside class="sidebar" id="sidebar">
  <div class="sidebar-header">
    <div class="logo">🚛 <span>LogisticsPro</span></div>
    <button class="sidebar-close" id="sidebarClose" aria-label="Close sidebar">✕</button>
  </div>
  <nav class="sidebar-nav">${navItems}</nav>
  <div class="sidebar-footer">
    <div class="sidebar-user">
      <span class="sidebar-user-avatar">👤</span>
      <div class="sidebar-user-info">
        <p class="sidebar-user-name" id="sidebarUserName">Admin</p>
        <p class="sidebar-user-role">Fleet Manager</p>
      </div>
    </div>
    <a href="#" id="sidebarLogout" class="sidebar-logout">🚪</a>
  </div>
</aside>
<div class="sidebar-overlay" id="sidebarOverlay"></div>`;
    }

    function buildBottomNav() {
        const items = BOTTOM_NAV.map(item => `
  <a href="${item.href}" class="bottom-nav-item${isActive(item.id) ? ' active' : ''}">
    <span class="bottom-nav-icon">${item.icon}</span>
    <span class="bottom-nav-text">${item.text}</span>
    ${item.id === 'notifications' ? '<span class="bottom-nav-badge" id="bottomNotifBadge">8</span>' : ''}
  </a>`).join('');
        return `<nav class="bottom-nav" id="bottomNav">${items}</nav>`;
    }

    function inject() {
        const body = document.body;
        // Skip login page
        if (body.classList.contains('login-page') || getCurrentPage() === 'index' || getCurrentPage() === '') return;
        // Inject
        body.insertAdjacentHTML('afterbegin', buildHeader() + buildSidebar() + buildBottomNav());
        setupSidebar();
        setupUserMenu();
        updateUserDisplay();
    }

    function setupSidebar() {
        const toggle   = document.getElementById('menuToggle');
        const sidebar  = document.getElementById('sidebar');
        const overlay  = document.getElementById('sidebarOverlay');
        const closeBtn = document.getElementById('sidebarClose');

        function openSidebar()  { sidebar.classList.add('open');    overlay.classList.add('open');    document.body.style.overflow = 'hidden'; }
        function closeSidebar() { sidebar.classList.remove('open'); overlay.classList.remove('open'); document.body.style.overflow = ''; }

        if (toggle)   toggle.addEventListener('click', openSidebar);
        if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
        if (overlay)  overlay.addEventListener('click', closeSidebar);

        ['logoutBtn', 'sidebarLogout'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', function (e) {
                e.preventDefault();
                if (typeof handleLogout === 'function') handleLogout();
                else { if (typeof clearTokens === 'function') clearTokens(); window.location.href = 'index.html'; }
            });
        });
    }

    function setupUserMenu() {
        const btn      = document.getElementById('userBtn');
        const dropdown = document.getElementById('userDropdown');
        if (!btn || !dropdown) return;
        btn.addEventListener('click', function (e) { e.stopPropagation(); dropdown.classList.toggle('open'); });
        document.addEventListener('click', function () { dropdown.classList.remove('open'); });
    }

    function updateUserDisplay() {
        try {
            const user = JSON.parse(localStorage.getItem('userData') || '{}');
            const name = user.username || user.email || 'Admin';
            ['headerUserName', 'sidebarUserName'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = name;
            });
        } catch (e) {}
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }
})();
