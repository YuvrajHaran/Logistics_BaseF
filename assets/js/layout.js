/**
 * layout.js — Shared Navigation Component
 * Injects header + sidebar + mobile bottom nav into every page.
 * Also fetches and caches vehicle alerts for the notification badge.
 */

(function () {
  'use strict';

  const NAV_ITEMS = [
    { href: 'dashboard.html', icon: '📊', text: 'Dashboard', id: 'dashboard' },
    { href: 'vehicles.html', icon: '🚛', text: 'Vehicles', id: 'vehicles' },
    { href: 'drivers.html', icon: '👥', text: 'Drivers', id: 'drivers' },
    { href: 'expenses.html', icon: '💰', text: 'Expenses', id: 'expenses' },
    { href: 'billing.html', icon: '🧾', text: 'Billing', id: 'billing' },
    { href: 'reports.html', icon: '📈', text: 'Reports', id: 'reports' },
    { href: 'transit_checklist.html', icon: '📋', text: 'Checklist', id: 'transit_checklist' },
    { href: 'notifications.html', icon: '🔔', text: 'Alerts', id: 'notifications' },
    { href: 'settings.html', icon: '⚙️', text: 'Settings', id: 'settings' },
  ];

  const BOTTOM_NAV = [
    { href: 'dashboard.html', icon: '📊', text: 'Home', id: 'dashboard' },
    { href: 'vehicles.html', icon: '🚛', text: 'Vehicles', id: 'vehicles' },
    { href: 'drivers.html', icon: '👥', text: 'Drivers', id: 'drivers' },
    { href: 'expenses.html', icon: '💰', text: 'Expenses', id: 'expenses' },
    { href: 'notifications.html', icon: '🔔', text: 'Alerts', id: 'notifications' },
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
      <span class="notif-badge" id="notifBadge" style="display:none">0</span>
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
      ${item.id === 'notifications' ? '<span class="nav-badge" id="sidebarNotifBadge" style="display:none">0</span>' : ''}
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
    ${item.id === 'notifications' ? '<span class="bottom-nav-badge" id="bottomNotifBadge" style="display:none">0</span>' : ''}
  </a>`).join('');
    return `<nav class="bottom-nav" id="bottomNav">${items}</nav>`;
  }

  function updateNotifBadge() {
    try {
      const stored = sessionStorage.getItem('alerts');
      const alerts = stored ? JSON.parse(stored) : [];
      const count = alerts.length;
      ['notifBadge', 'sidebarNotifBadge', 'bottomNotifBadge'].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) {
          el.textContent = count;
          el.style.display = count === 0 ? 'none' : '';
        }
      });
    } catch (e) { }
  }


  function generateAlerts(vehicles) {
    // Read user preference
    var prefs = {};
    try { prefs = JSON.parse(localStorage.getItem('notifPrefs')) || {}; } catch (e) { }

    var docExpiryEnabled = prefs.docExpiry ? prefs.docExpiry.enabled : true;
    var docExpiryDays = prefs.docExpiry ? parseInt(prefs.docExpiry.days, 10) : 10;

    // Always alert on expiry day (0) and at the user-chosen threshold.
    // If alerts are disabled entirely, use empty set so nothing shows.
    var REMINDER_DAYS = docExpiryEnabled ? [0, docExpiryDays] : [];

    // Deduplicate in case user chose 0 (same as expiry day)
    REMINDER_DAYS = REMINDER_DAYS.filter(function (v, i, a) { return a.indexOf(v) === i; });

    var alerts = [];
    var today = new Date();

    vehicles.forEach(function (vehicle) {
      (vehicle.documents || []).forEach(function (doc) {
        if (!doc.expiry_date) return;
        var expiry = new Date(doc.expiry_date);
        var diffTime = expiry - today;
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysLeft <= 0 || REMINDER_DAYS.includes(daysLeft)) {
          alerts.push({
            vehicleId: vehicle.id,
            vehicleNo: vehicle.vehicle_number,
            type: doc.document_type || 'document',
            daysLeft: daysLeft,
            expiry_date: doc.expiry_date,   // ← make sure this is here
            message: daysLeft <= 0
              ? (doc.document_type || 'Document') + ' expired on ' + formatExpiry(doc.expiry_date)
              : (doc.document_type || 'Document') + ' expires in ' + daysLeft + ' days'
          });
        }
      });
    });

    return alerts;
  }

  // ── Background fetch — runs on every page load ────────────────────────────
  // Skips the API call if alerts are already cached in this session.
  // vehicles.js will also call this after its own fetch to keep data fresh.

  function fetchAndCacheAlerts() {
    // Already cached — just paint the badge and return
    if (sessionStorage.getItem('alerts') !== null) {
      updateNotifBadge();
      return;
    }

    // Wait until jQuery + api.js are ready (they load after layout.js)
    var attempts = 0;
    var interval = setInterval(function () {
      attempts++;
      if (typeof apiRequest === 'function' && typeof API_ENDPOINTS !== 'undefined') {
        clearInterval(interval);
        apiRequest(API_ENDPOINTS.VEHICLES, 'GET', null, true)
          .done(function (res) {
            var vehicles = Array.isArray(res) ? res : (res.results || []);
            var alerts = generateAlerts(vehicles);
            sessionStorage.setItem('alerts', JSON.stringify(alerts));
            updateNotifBadge();
          })
          .fail(function () { /* silent — badge stays hidden */ });
      }
      if (attempts >= 30) clearInterval(interval);
    }, 100);
  }

  // ── Listen for vehicles.js signalling a fresh fetch ───────────────────────
  // vehicles.js dispatches 'alertsReady' after its own loadVehicles() call,
  // so the badge stays in sync even when the vehicle list changes.
  document.addEventListener('alertsReady', function () {
    updateNotifBadge();
  });

  // ── Expose generateAlerts globally so vehicles.js can reuse it ───────────
  window.generateAlerts = generateAlerts;

  // ── Main inject ───────────────────────────────────────────────────────────

  function inject() {
    const body = document.body;
    if (body.classList.contains('login-page') || getCurrentPage() === 'index' || getCurrentPage() === '') return;

    body.insertAdjacentHTML('afterbegin', buildHeader() + buildSidebar() + buildBottomNav());
    setupSidebar();
    setupUserMenu();
    updateUserDisplay();
    updateNotifBadge();       // paint cached value immediately (0 on first ever load)
    fetchAndCacheAlerts();    // fetch in background if cache is empty
  }

  function setupSidebar() {
    const toggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const closeBtn = document.getElementById('sidebarClose');

    function openSidebar() { sidebar.classList.add('open'); overlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function closeSidebar() { sidebar.classList.remove('open'); overlay.classList.remove('open'); document.body.style.overflow = ''; }

    if (toggle) toggle.addEventListener('click', openSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);

    ['logoutBtn', 'sidebarLogout'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', function (e) {
        e.preventDefault();
        if (typeof handleLogout === 'function') handleLogout();
        else { if (typeof clearTokens === 'function') clearTokens(); window.location.href = 'index.html'; }
      });
    });
  }

  function setupUserMenu() {
    const btn = document.getElementById('userBtn');
    const dropdown = document.getElementById('userDropdown');
    if (!btn || !dropdown) return;
    btn.addEventListener('click', function (e) { e.stopPropagation(); dropdown.classList.toggle('open'); });
    document.addEventListener('click', function () { dropdown.classList.remove('open'); });
  }

  function updateUserDisplay() {
    try {
      const user = JSON.parse(localStorage.getItem('userData') || '{}');
      const name = user.username || user.email || 'Admin';
      ['headerUserName', 'sidebarUserName'].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) el.textContent = name;
      });
    } catch (e) { }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

})();