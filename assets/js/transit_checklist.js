/**
 * transit_checklist.js
 * Uses cl-* CSS classes from transit_checklist_style.css
 */

/* ── Checklist items ── */
const checkItems = [
    'चेक वी बेल्ट',
    'चेक व्हील नट',
    'चेक इंजिन',
    'चेक प्रोपेलर शाफ्ट',
    'चेक होसेस',
    'कॅरी एंड होसेस',
    'कॅरी एंड मिक्सर',
    'इंजिन ऑईल',
    'पाण्याचे तापमान'
];

/* Set today's date */
document.addEventListener('DOMContentLoaded', function () {
    const d = document.getElementById('entryDate');
    if (d) d.value = new Date().toISOString().split('T')[0];
});

/* ── Build checklist ── */
const cl = document.getElementById('checklist');
if (cl) {
    checkItems.forEach((item, i) => {
        cl.innerHTML += `
        <div class="check-item">
            <label for="chk${i}">${item}</label>
            <input type="checkbox" class="toggle-checkbox" id="chk${i}">
        </div>`;
    });
}

/* ════════════════════════════════════════
   MOBILE TRIP CARDS
════════════════════════════════════════ */
let tripCount = 0;

function createMobileTrip() {
    tripCount++;
    const id = tripCount;
    const div = document.createElement('div');
    div.className = 'trip-card';
    div.dataset.tripId = id;
    div.innerHTML = `
    <div class="trip-card-header">
        <span class="trip-number">चालन #${id}</span>
        ${id > 1 ? `<button class="trip-delete" onclick="deleteTrip(${id})">✕</button>` : ''}
    </div>
    <div class="trip-card-body">
        <div class="cl-form-group" style="margin-bottom:10px">
            <label class="cl-label">पार्टीचे नाव</label>
            <input type="text" class="cl-input" placeholder="पार्टीचे नाव">
        </div>

        <div class="cl-section-label">वेळ</div>
        <div class="cl-form-grid">
            <div class="cl-form-group"><label class="cl-label">प्लांट निघणे</label><input type="time" class="cl-input plant-leave"></div>
            <div class="cl-form-group"><label class="cl-label">साईट पोहोच</label><input type="time" class="cl-input site-arrive"></div>
            <div class="cl-form-group"><label class="cl-label">साईट निघणे</label><input type="time" class="cl-input site-leave"></div>
            <div class="cl-form-group"><label class="cl-label">प्लांट पोहोच</label><input type="time" class="cl-input plant-arrive"></div>
        </div>
        <div class="cl-form-group" style="margin-top:8px">
            <label class="cl-label">एकूण वेळ (मिनिटे)</label>
            <input type="text" class="cl-input calc-field total-time-m" placeholder="स्वयं-गणना" readonly>
        </div>

        <div class="cl-section-label">किलोमीटर</div>
        <div class="cl-form-grid cols-3">
            <div class="cl-form-group"><label class="cl-label">सुरुवात</label><input type="number" class="cl-input start-km" placeholder="0"></div>
            <div class="cl-form-group"><label class="cl-label">शेवट</label><input type="number" class="cl-input end-km" placeholder="0"></div>
            <div class="cl-form-group"><label class="cl-label">एकूण</label><input type="number" class="cl-input calc-field total-km-m" placeholder="0" readonly></div>
        </div>

        <div class="cl-section-label">डिझेल</div>
        <div class="cl-form-grid">
            <div class="cl-form-group"><label class="cl-label">सुरुवात</label><input type="number" class="cl-input" placeholder="0"></div>
            <div class="cl-form-group"><label class="cl-label">शेवट</label><input type="number" class="cl-input" placeholder="0"></div>
        </div>

        <div class="cl-form-grid" style="margin-top:10px">
            <div class="cl-form-group">
                <label class="cl-label">एकूण रनिंग</label>
                <input type="number" class="cl-input calc-field running-m" placeholder="0" readonly style="background:#f0fdf4;color:#166534;font-weight:600">
            </div>
            <div class="cl-form-group"><label class="cl-label">नग</label><input type="number" class="cl-input" placeholder="0"></div>
        </div>
    </div>`;

    /* Auto-calc km */
    div.querySelectorAll('.start-km, .end-km').forEach(inp => {
        inp.addEventListener('input', () => {
            const s = parseFloat(div.querySelector('.start-km').value) || 0;
            const e = parseFloat(div.querySelector('.end-km').value)   || 0;
            const t = Math.max(0, e - s);
            div.querySelector('.total-km-m').value = t || '';
            div.querySelector('.running-m').value  = t || '';
        });
    });

    /* Auto-calc time */
    div.querySelectorAll('.plant-leave, .plant-arrive').forEach(inp => {
        inp.addEventListener('input', () => {
            const t1 = div.querySelector('.plant-leave').value;
            const t2 = div.querySelector('.plant-arrive').value;
            if (t1 && t2) {
                const [h1,m1] = t1.split(':').map(Number);
                const [h2,m2] = t2.split(':').map(Number);
                let diff = (h2*60+m2) - (h1*60+m1);
                if (diff < 0) diff += 1440;
                div.querySelector('.total-time-m').value = `${Math.floor(diff/60)}h ${diff%60}m`;
            }
        });
    });

    return div;
}

function deleteTrip(id) {
    const el = document.querySelector(`[data-trip-id="${id}"]`);
    if (el) el.remove();
}

const addMobile = document.getElementById('add-row-mobile');
if (addMobile) addMobile.addEventListener('click', () => {
    document.getElementById('trips-container').appendChild(createMobileTrip());
});

/* Init first trip */
const tripsContainer = document.getElementById('trips-container');
if (tripsContainer) tripsContainer.appendChild(createMobileTrip());

/* ════════════════════════════════════════
   DESKTOP TABLE ROWS
════════════════════════════════════════ */
let deskCount = 0;

function createDesktopRow() {
    deskCount++;
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${deskCount}</td>
        <td><input type="text" class="cl-input" placeholder="पार्टी नाव" style="width:120px"></td>
        <td><input type="time" class="cl-input"></td>
        <td><input type="time" class="cl-input"></td>
        <td><input type="time" class="cl-input"></td>
        <td><input type="time" class="cl-input"></td>
        <td><input type="text" class="cl-input calc-field dsk-time" readonly style="width:80px"></td>
        <td><input type="number" class="cl-input dsk-start" placeholder="0" style="width:75px"></td>
        <td><input type="number" class="cl-input dsk-end"   placeholder="0" style="width:75px"></td>
        <td><input type="number" class="cl-input calc-field dsk-total" readonly style="width:75px"></td>
        <td><input type="number" class="cl-input" placeholder="0" style="width:70px"></td>
        <td><input type="number" class="cl-input" placeholder="0" style="width:70px"></td>
        <td><input type="number" class="cl-input calc-field dsk-running" readonly style="width:75px"></td>
        <td><input type="number" class="cl-input" placeholder="0" style="width:55px"></td>`;

    tr.querySelectorAll('.dsk-start, .dsk-end').forEach(inp => {
        inp.addEventListener('input', () => {
            const s = parseFloat(tr.querySelector('.dsk-start').value) || 0;
            const e = parseFloat(tr.querySelector('.dsk-end').value)   || 0;
            const t = Math.max(0, e - s);
            tr.querySelector('.dsk-total').value   = t || '';
            tr.querySelector('.dsk-running').value = t || '';
        });
    });

    /* Time calc from col 3 (plant-leave) and col 6 (plant-arrive) */
    const timeInputs = tr.querySelectorAll('input[type="time"]');
    if (timeInputs.length >= 4) {
        [timeInputs[0], timeInputs[3]].forEach(inp => {
            inp.addEventListener('input', () => {
                const t1 = timeInputs[0].value, t2 = timeInputs[3].value;
                if (t1 && t2) {
                    const [h1,m1] = t1.split(':').map(Number);
                    const [h2,m2] = t2.split(':').map(Number);
                    let diff = (h2*60+m2) - (h1*60+m1);
                    if (diff < 0) diff += 1440;
                    tr.querySelector('.dsk-time').value = `${Math.floor(diff/60)}h ${diff%60}m`;
                }
            });
        });
    }

    return tr;
}

const addDesktop = document.getElementById('add-row-desktop');
if (addDesktop) addDesktop.addEventListener('click', () => {
    document.getElementById('desktop-tbody').appendChild(createDesktopRow());
});

const desktopTbody = document.getElementById('desktop-tbody');
if (desktopTbody) desktopTbody.appendChild(createDesktopRow());

/* ════════════════════════════════════════
   PRINT / PDF
════════════════════════════════════════ */
function preparePrint() {
    document.getElementById('p-vehicle').innerText = document.getElementById('vehicleNum').value;
    document.getElementById('p-branch').innerText  = document.getElementById('branchName').value;
    document.getElementById('p-date').innerText    = document.getElementById('entryDate').value;

    /* Table rows */
    const tbody = document.getElementById('print-body');
    tbody.innerHTML = '';
    document.querySelectorAll('#desktop-tbody tr').forEach((tr, i) => {
        const inputs = tr.querySelectorAll('input');
        tbody.innerHTML += `
        <tr>
            <td>${i+1}</td>
            <td>${inputs[0]?.value||''}</td>
            <td>${inputs[1]?.value||''}</td>
            <td>${inputs[2]?.value||''}</td>
            <td>${inputs[3]?.value||''}</td>
            <td>${inputs[4]?.value||''}</td>
            <td>${inputs[6]?.value||''}</td>
            <td>${inputs[7]?.value||''}</td>
            <td>${inputs[8]?.value||''}</td>
        </tr>`;
    });

    /* Checklist */
    const pcl = document.getElementById('p-checklist');
    pcl.innerHTML = '';
    document.querySelectorAll('#checklist input').forEach((chk, i) => {
        pcl.innerHTML += `<div>${chk.checked ? '✔' : '☐'} ${checkItems[i]||''}</div>`;
    });

    document.getElementById('print-layout').style.display = 'block';
    window.print();
    document.getElementById('print-layout').style.display = 'none';
}
