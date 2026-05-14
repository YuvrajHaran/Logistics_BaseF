/**
 * main.js — App Logic
 * Load order: api.js → auth.js → main.js
 */

$(document).ready(function () {
    initApp();
    loadPageData();
});

/* ========================================
   INIT
======================================== */
function initApp() {
    // Spin animation keyframe (once)
    if (!$('#spin-style').length) {
        $('<style id="spin-style">').text('@keyframes spin{to{transform:rotate(360deg)}}').appendTo('head');
    }
    // Sync user name in header (layout.js may have already done it, but run again after auth check)
    const user = getCurrentUser();
    if (user) {
        const name = user.username || user.email || 'Admin';
        $('#headerUserName, #sidebarUserName, .user-name').text(name);
    }
}

/* ========================================
   PAGE ROUTING
======================================== */
function loadPageData() {
    switch (getCurrentPage()) {
        case 'notifications': loadNotificationsData(); break;
        default: break; // all other pages use static HTML
    }
}

function getCurrentPage() {
    return window.location.pathname.split('/').pop().replace('.html', '') || 'index';
}

/* ========================================
   NOTIFICATIONS — Real API
======================================== */
let _alertRules = [];

function loadNotificationsData() {
    showLoader();
    apiRequest('/api/notifications/alert-rules/', 'GET', null, true)
        .done(function (res) {
            hideLoader();
            _alertRules = Array.isArray(res) ? res : (res.results || []);
            if (_alertRules.length) {
                renderNotifications(_alertRules);
                setupNotificationEvents();
            }
            // else keep static HTML
        })
        .fail(function (xhr) {
            hideLoader();
            if (xhr.status === 401) handleSessionExpired();
            // else keep static HTML as fallback
        });
}

function getUrgency(rule) {
    const today = new Date(); today.setHours(0,0,0,0);
    const task  = new Date(rule.task_date); task.setHours(0,0,0,0);
    const diff  = Math.ceil((task - today) / 86400000);
    if (diff <= 0) return 'urgent';
    if (diff <= (rule.remind_before_days || 7)) return 'warning';
    return 'info';
}

function urgencyIcon(u) { return u==='urgent'?'🔴':u==='warning'?'⚠️':'ℹ️'; }

function timeLabel(d) {
    const today = new Date(); today.setHours(0,0,0,0);
    const dt    = new Date(d); dt.setHours(0,0,0,0);
    const diff  = Math.ceil((dt - today) / 86400000);
    if (diff < 0)  return Math.abs(diff)+' day(s) overdue';
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return 'Due in '+diff+' days';
}

function renderNotifications(rules) {
    const container = $('#notificationsList');
    if (!rules.length) {
        container.html('<div style="text-align:center;padding:3rem;color:var(--gray-500)"><p style="font-size:2.5rem">🔔</p><p style="margin-top:.75rem">No notifications yet.</p></div>');
        updateNotifBadge(0); return;
    }
    const order = {urgent:0, warning:1, info:2};
    rules.sort((a,b) => order[getUrgency(a)] - order[getUrgency(b)]);

    let unread=0, urgent=0, warning=0, info=0, html='';
    rules.forEach(r => {
        const urg   = getUrgency(r);
        const isNew = !r.has_triggered;
        if (urg==='urgent')  urgent++;
        if (urg==='warning') warning++;
        if (urg==='info')    info++;
        if (isNew) unread++;
        html += `
        <div class="notif-card ${isNew?'unread':'read'} ${urg}" data-type="${urg}" data-id="${r.id}">
          <div class="notif-icon ${urg}">${urgencyIcon(urg)}</div>
          <div class="notif-content">
            <div class="notif-header">
              <h4>${escapeHtml(r.title)}</h4>
              <span class="notif-time">${timeLabel(r.task_date)}</span>
            </div>
            <p>${escapeHtml(r.message)}</p>
            <p style="font-size:.75rem;color:var(--gray-400);margin-bottom:.625rem">
              Task date: ${formatDate(r.task_date)} &nbsp;|&nbsp; Remind ${r.remind_before_days} day(s) before
            </p>
            <div class="notif-actions">
              ${isNew ? `<button class="btn btn-sm btn-outline mark-read-btn" data-id="${r.id}">✅ Mark as Read</button>` : '<span style="font-size:.75rem;color:var(--success)">✅ Read</span>'}
              <button class="btn btn-sm btn-danger delete-rule-btn" data-id="${r.id}">🗑 Delete</button>
            </div>
          </div>
          ${isNew ? '<div class="notif-unread-dot"></div>' : ''}
        </div>`;
    });
    container.html(html);
    updateNotifBadge(unread);
    updateTabCounts(rules.length, unread, urgent, warning, info);
}

function updateTabCounts(total, unread, urgent, warning, info) {
    $('#count-all').text(total);
    $('#count-unread').text(unread);
    $('#count-urgent').text(urgent);
    $('#count-warning').text(warning);
    $('#count-info').text(info);
}

function setupNotificationEvents() {
    // Tab filter
    $('.notif-tab').off('click').on('click', function () {
        $('.notif-tab').removeClass('active'); $(this).addClass('active');
        const f = $(this).data('filter');
        if (f==='all')    { $('.notif-card').show(); }
        else if(f==='unread') { $('.notif-card').hide(); $('.notif-card.unread').show(); }
        else { $('.notif-card').hide(); $(`.notif-card[data-type="${f}"]`).show(); }
    });

    // Mark single read
    $(document).off('click','.mark-read-btn').on('click','.mark-read-btn', function(){
        const id = $(this).data('id'), card = $(this).closest('.notif-card');
        const rule = _alertRules.find(r => r.id == id); if(!rule) return;
        const btn = $(this); btn.text('Saving…').prop('disabled',true);
        apiRequest(`/api/notifications/alert-rules/${id}/`,'PUT',{
            title:rule.title, message:rule.message, task_date:rule.task_date,
            remind_before_days:rule.remind_before_days, has_triggered:true
        },true)
        .done(() => {
            rule.has_triggered=true;
            card.removeClass('unread').addClass('read');
            card.find('.notif-unread-dot').remove();
            btn.replaceWith('<span style="font-size:.75rem;color:var(--success)">✅ Read</span>');
            const cnt = Math.max(0,$('.notif-card.unread').length);
            updateNotifBadge(cnt);
            showNotification('Marked as read','success');
        })
        .fail(() => { btn.text('✅ Mark as Read').prop('disabled',false); showNotification('Failed','error'); });
    });

    // Delete rule
    $(document).off('click','.delete-rule-btn').on('click','.delete-rule-btn', function(){
        const id=$(this).data('id'), card=$(this).closest('.notif-card');
        if(!confirm('Delete this notification?')) return;
        const btn=$(this); btn.text('…').prop('disabled',true);
        apiRequest(`/api/notifications/alert-rules/${id}/`,'DELETE',null,true)
        .done(() => {
            _alertRules = _alertRules.filter(r=>r.id!=id);
            card.fadeOut(300,function(){ $(this).remove(); updateNotifBadge($('.notif-card.unread').length); });
            showNotification('Deleted','success');
        })
        .fail(() => { btn.text('🗑 Delete').prop('disabled',false); showNotification('Failed','error'); });
    });

    // Mark all read
    $('#markAllReadBtn').off('click').on('click', function(){
        const unread = _alertRules.filter(r=>!r.has_triggered);
        if(!unread.length){ showNotification('All already read','info'); return; }
        const btn=$(this); btn.text('Marking…').prop('disabled',true);
        const promises = unread.map(r => apiRequest(`/api/notifications/alert-rules/${r.id}/`,'PUT',{
            title:r.title, message:r.message, task_date:r.task_date,
            remind_before_days:r.remind_before_days, has_triggered:true
        },true));
        $.when(...promises)
        .done(() => {
            _alertRules.forEach(r=>r.has_triggered=true);
            $('.notif-card').removeClass('unread').addClass('read');
            $('.notif-unread-dot').remove();
            $('.mark-read-btn').replaceWith('<span style="font-size:.75rem;color:var(--success)">✅ Read</span>');
            updateNotifBadge(0);
            btn.text('✅ Mark All Read').prop('disabled',false);
            showNotification('All notifications marked as read','success');
        })
        .fail(() => { btn.text('✅ Mark All Read').prop('disabled',false); showNotification('Some failed','error'); });
    });
}

function updateNotifBadge(count) {
    const c = count > 0 ? count : 0;
    $('#notifBadge, #sidebarNotifBadge, #bottomNotifBadge, .notif-badge').text(c);
}

/* ========================================
   LOADER
======================================== */
function showLoader() {
    if ($('.page-loader').length) return;
    $('body').append(`
      <div class="page-loader" style="position:fixed;inset:0;background:rgba(255,255,255,.85);
        display:flex;align-items:center;justify-content:center;z-index:9998">
        <div style="width:44px;height:44px;border:4px solid var(--gray-200);border-top-color:var(--primary);
          border-radius:50%;animation:spin .8s linear infinite"></div>
      </div>`);
}
function hideLoader() { $('.page-loader').fadeOut(200, function(){ $(this).remove(); }); }

/* ========================================
   UTILITIES
======================================== */
function formatNumber(n) {
    if (!n && n !== 0) return '0';
    n = Math.round(n);
    const s = n.toString();
    if (s.length <= 3) return s;
    return s.slice(0,-3).replace(/\B(?=(\d{2})+(?!\d))/g,',')+','+s.slice(-3);
}
function formatCurrency(n) { return '₹'+formatNumber(n); }
function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN',{year:'numeric',month:'short',day:'numeric'});
}
function capitalizeFirst(s) { return s ? s.charAt(0).toUpperCase()+s.slice(1) : ''; }
function escapeHtml(s) {
    if (!s) return '';
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function debounce(fn, wait=300) {
    let t; return function(...a){ clearTimeout(t); t=setTimeout(()=>fn.apply(this,a),wait); };
}
function exportToPDF()   { showNotification('PDF export coming soon!','info'); }
function exportToExcel() { showNotification('Excel export coming soon!','info'); }
function printPage()     { window.print(); }
