$(function () {
    var allVehicles = [], filtered = [], deleteTargetId = null;



    function openModal(id) { $('#' + id).addClass('open'); $('body').css('overflow', 'hidden'); }
    function closeModal(id) { $('#' + id).removeClass('open'); $('body').css('overflow', ''); }
    $('.crm-modal-overlay').on('click', function (e) { if ($(e.target).hasClass('crm-modal-overlay')) closeModal($(this).attr('id')); });

    function generateAlerts(vehicles) {
        const alerts = [];
        const today = new Date();
        const REMINDER_DAYS = [10, 5, 2, 0];

        vehicles.forEach(vehicle => {
            (vehicle.documents || []).forEach(doc => {
                if (!doc.expiry_date) return;

                const expiry = new Date(doc.expiry_date);
                const diffTime = expiry - today;
                const daysLeft = diffTime < 0 ? 0 : Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (REMINDER_DAYS.includes(daysLeft)) {
                    alerts.push({
                        vehicleId: vehicle.id,
                        vehicleNo: vehicle.vehicle_number,
                        type: doc.document_type || "document",
                        daysLeft: daysLeft,
                        message: daysLeft == 0 ? `${doc.type || "Document"} is expired` : `${doc.type || "Document"} expires in ${daysLeft} days`
                    });
                }
            });
        });

        return alerts;
    }
    function loadVehicles() {
        $('#vehiclesGrid').html('<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div>');
        $('#paginationBar').hide();
        apiRequest(API_ENDPOINTS.VEHICLES, 'GET', null, true)
            .done(function (res) {
                allVehicles = Array.isArray(res) ? res : (res.results || []);
                filtered = allVehicles.slice();


                window.alerts = generateAlerts(allVehicles);
                // document.dispatchEvent(new CustomEvent('alertsReady', { detail: window.alerts })); -->This can also be done 
                sessionStorage.setItem('alerts', JSON.stringify(window.alerts));
                applyFilters();
            })
            .fail(function (xhr) {
                if (xhr.status === 401) { handleSessionExpired(); return; }
                $('#vehiclesGrid').html('<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--gray-500)"><p style="font-size:2.5rem">⚠️</p><p style="margin:.5rem 0 1rem">Failed to load vehicles.</p><button class="btn btn-primary" id="retryBtn">🔄 Retry</button></div>');
                $('#retryBtn').on('click', loadVehicles);
            });
    }

    function renderVehicles(list) {
        if (!list.length) {
            $('#vehiclesGrid').html('<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--gray-500)"><p style="font-size:3rem">🚛</p><h3 style="margin:.75rem 0 .5rem;color:var(--gray-700)">No vehicles found</h3><button class="btn btn-primary" id="emptyAddBtn" style="margin-top:.75rem">+ Add First Vehicle</button></div>');
            $('#emptyAddBtn').on('click', openAddModal);
            $('#paginationBar').hide();
            return;
        }
        var html = list.map(function (v) {
            var sc = { active: 'active', idle: 'idle', maintenance: 'maintenance' }[v.status] || 'idle';
            var sl = v.status ? v.status.charAt(0).toUpperCase() + v.status.slice(1) : 'Unknown';
            var driverName = (v.driver && v.driver.name) ? v.driver.name : 'No Driver Assigned'; return '<div class="vehicle-card" data-id="' + v.id + '" data-status="' + (v.status || '') + '">'
                + '<div class="vehicle-header"><div class="vehicle-number">' + (v.vehicle_number || '—') + '</div><span class="status-badge ' + sc + '">' + sl + '</span></div>'
                + '<div class="vehicle-icon">🚛</div>'
                + '<div class="vehicle-info">'
                + '<p class="vehicle-type">' + (v.vehicle_type || '—') + '</p>'
                + '<p class="vehicle-location">📍 ' + (v.location || '—') + '</p>'
                + '<p class="vehicle-driver">👤 ' + driverName + '</p>'
                + '</div>'
                + '<div class="vehicle-alerts"><span class="alert-badge success">✅ No Alerts</span></div>'
                + '<div class="vehicle-card-actions">'
                + '<a href="vehicle-detail.html?id=' + v.id + '" class="btn btn-sm btn-outline">View</a>'
                + '<button class="btn btn-sm btn-outline edit-vehicle-btn" data-id="' + v.id + '">✏️ Edit</button>'
                + '<button class="btn btn-sm btn-danger delete-vehicle-btn" data-id="' + v.id + '" data-number="' + (v.vehicle_number || v.id) + '">🗑</button>'
                + '</div></div>';
        }).join('');
        $('#vehiclesGrid').html(html);
        $('#paginationBar').show();
        $('#paginationInfo').text('Showing ' + list.length + ' of ' + allVehicles.length + ' vehicles');
    }

    function applyFilters() {
        var q = $('#searchVehicle').val().toLowerCase(), s = $('#filterStatus').val();
        filtered = allVehicles.filter(function (v) {
            var mQ = !q || (v.vehicle_number || '').toLowerCase().includes(q) || (v.current_driver_name || '').toLowerCase().includes(q);
            var mS = !s || (v.status || '') === s;
            return mQ && mS;
        });
        renderVehicles(filtered);
    }
    $('#searchVehicle').on('input', applyFilters);
    $('#filterStatus').on('change', applyFilters);
    $('#refreshBtn').on('click', function () { $('#searchVehicle').val(''); $('#filterStatus').val(''); loadVehicles(); });

    function openAddModal() {
        $('#vehicleModalTitle').text('+ Add Vehicle');
        $('#vehicleForm')[0].reset();
        $('#vehicleEditId').val('');
        openModal('vehicleModalOverlay');
    }
    $('#addVehicleBtn').on('click', openAddModal);
    $('#closeVehicleModal,#cancelVehicleModal').on('click', function () { closeModal('vehicleModalOverlay'); });

    $(document).on('click', '.edit-vehicle-btn', function () {
        var id = $(this).data('id'), v = allVehicles.find(function (x) { return x.id == id; });
        if (!v) { showNotification('Vehicle not found', 'error'); return; }
        $('#vehicleModalTitle').text('✏️ Edit Vehicle');
        $('#vehicleEditId').val(v.id);
        $('#vNumber').val(v.vehicle_number || '');
        $('#vType').val(v.vehicle_type || '');
        $('#vBrand').val(v.brand || '');
        $('#vModel').val(v.model || '');
        $('#vYear').val(v.year || '');
        $('#vLocation').val(v.location || '');
        $('#vStatus').val(v.status || 'active');
        $('#vPrice').val(v.purchase_price || '');
        $('#vPurchaseDate').val(v.purchase_date || '');
        $('#vChassis').val(v.chassis_number || '');
        $('#vEngine').val(v.engine_number || '');
        openModal('vehicleModalOverlay');
    });

    $('#saveVehicleBtn').on('click', function () {
        var number = $('#vNumber').val().trim(), type = $('#vType').val(), location = $('#vLocation').val().trim();
        if (!number) { showNotification('Vehicle number is required', 'error'); $('#vNumber').focus(); return; }
        if (!type) { showNotification('Vehicle type is required', 'error'); $('#vType').focus(); return; }
        if (!location) { showNotification('Location is required', 'error'); $('#vLocation').focus(); return; }

        var payload = { vehicle_number: number, vehicle_type: type, location: location, status: $('#vStatus').val() };
        if ($('#vBrand').val().trim()) payload.brand = $('#vBrand').val().trim();
        if ($('#vModel').val().trim()) payload.model = $('#vModel').val().trim();
        if ($('#vYear').val()) payload.year = Number($('#vYear').val());
        if ($('#vPrice').val()) payload.purchase_price = $('#vPrice').val();
        if ($('#vPurchaseDate').val()) payload.purchase_date = $('#vPurchaseDate').val();
        if ($('#vChassis').val().trim()) payload.chassis_number = $('#vChassis').val().trim();
        if ($('#vEngine').val().trim()) payload.engine_number = $('#vEngine').val().trim();

        var editId = $('#vehicleEditId').val(), isEdit = !!editId;
        var btn = $(this); btn.text('Saving…').prop('disabled', true);
        var endpoint = isEdit ? API_ENDPOINTS.VEHICLE_DETAIL.replace('{id}', editId) : API_ENDPOINTS.VEHICLES;
        var method = isEdit ? 'PATCH' : 'POST';

        apiRequest(endpoint, method, payload, true)
            .done(function () {
                btn.text('💾 Save Vehicle').prop('disabled', false);
                showNotification(isEdit ? 'Vehicle updated!' : 'Vehicle added!', 'success');
                closeModal('vehicleModalOverlay');
                loadVehicles();
            })
            .fail(function (xhr) {
                btn.text('💾 Save Vehicle').prop('disabled', false);
                if (xhr.status === 401) { handleSessionExpired(); return; }
                var err = xhr.responseJSON, msg = 'Failed to save vehicle.';
                if (err) { var first = Object.values(err)[0]; msg = Array.isArray(first) ? first[0] : first || msg; }
                showNotification(msg, 'error');
            });
    });

    $(document).on('click', '.delete-vehicle-btn', function () {
        deleteTargetId = $(this).data('id');
        $('#deleteVehicleNum').text($(this).data('number'));
        openModal('deleteVehicleOverlay');
    });
    $('#confirmDeleteBtn').on('click', function () {
        if (!deleteTargetId) return;
        var btn = $(this); btn.text('Deleting…').prop('disabled', true);
        apiRequest(API_ENDPOINTS.VEHICLE_DETAIL.replace('{id}', deleteTargetId), 'DELETE', null, true)
            .done(function () {
                btn.text('🗑 Yes, Delete').prop('disabled', false);
                showNotification('Vehicle deleted!', 'success');
                closeModal('deleteVehicleOverlay');
                loadVehicles(); deleteTargetId = null;
            })
            .fail(function (xhr) {
                btn.text('🗑 Yes, Delete').prop('disabled', false);
                if (xhr.status === 401) { handleSessionExpired(); return; }
                showNotification('Failed to delete vehicle.', 'error');
            });
    });
    $('#closeDeleteModal,#cancelDeleteModal').on('click', function () { closeModal('deleteVehicleOverlay'); });

    loadVehicles();
});