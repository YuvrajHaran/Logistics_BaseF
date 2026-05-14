/**
 * API Configuration
 */
const API_BASE_URL = 'https://crm-logistics-backend-production-bb94.up.railway.app';

const API_ENDPOINTS = {
    // Auth
    REGISTER:   '/api/auth/register/',
    LOGIN:      '/api/auth/login/',
    REFRESH:    '/api/auth/refresh/',
    LOGOUT:     '/api/auth/logout/',

    // Vehicles — updated to /api/assets/
    VEHICLES:           '/api/assets/vehicles/',
    VEHICLE_DETAIL:     '/api/assets/vehicles/{id}/',

    // Vehicle Documents
    VEHICLE_DOCS:       '/api/assets/vehicle-documents/',
    VEHICLE_DOC_DETAIL: '/api/assets/vehicle-documents/{id}/',

    // Drivers
    DRIVERS:            '/api/assets/drivers/',
    DRIVER_DETAIL:      '/api/assets/drivers/{id}/',

    // Expenses / Notifications / Invoices / Dashboard (unchanged)
    EXPENSES:           '/api/v1/expenses/',
    NOTIFICATIONS:      '/api/v1/notifications/',
    INVOICES:           '/api/v1/invoices/',
    DASHBOARD_STATS:    '/api/v1/dashboard/stats/',
};

/** Main API Request — JSON */
function apiRequest(endpoint, method = 'GET', data = null, useAuth = true) {
    const ajaxOptions = {
        url: API_BASE_URL + endpoint,
        method: method,
        contentType: 'application/json',
        headers: {}
    };
    if (useAuth) {
        const token = getAccessToken();
        if (token) ajaxOptions.headers['Authorization'] = 'Bearer ' + token;
    }
    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) ajaxOptions.data = JSON.stringify(data);
    if (data && method === 'GET') ajaxOptions.url += '?' + $.param(data);
    return $.ajax(ajaxOptions);
}

/** Multipart/FormData request — used for file uploads */
function apiRequestFormData(endpoint, method = 'POST', formData, useAuth = true) {
    const ajaxOptions = {
        url: API_BASE_URL + endpoint,
        method: method,
        data: formData,
        processData: false,
        contentType: false,
        headers: {}
    };
    if (useAuth) {
        const token = getAccessToken();
        if (token) ajaxOptions.headers['Authorization'] = 'Bearer ' + token;
    }
    return $.ajax(ajaxOptions);
}

/** Token Management */
function saveTokens(a, r)  { localStorage.setItem('accessToken', a); localStorage.setItem('refreshToken', r); }
function getAccessToken()  { return localStorage.getItem('accessToken'); }
function getRefreshToken() { return localStorage.getItem('refreshToken'); }
function saveUserData(u)   { localStorage.setItem('userData', JSON.stringify(u)); }
function getCurrentUser()  { try { return JSON.parse(localStorage.getItem('userData')); } catch(e){ return null; } }
function clearTokens()     { ['accessToken','refreshToken','userData'].forEach(k => localStorage.removeItem(k)); }
function isLoggedIn()      { return !!getAccessToken(); }

function refreshAccessToken() {
    const rt = getRefreshToken();
    if (!rt) { handleSessionExpired(); return; }
    return $.ajax({
        url: API_BASE_URL + API_ENDPOINTS.REFRESH, method: 'POST',
        contentType: 'application/json', data: JSON.stringify({ refresh: rt }),
        success: function(r) { localStorage.setItem('accessToken', r.access); },
        error:   function()  { handleSessionExpired(); }
    });
}

function handleSessionExpired() {
    clearTokens();
    if (typeof showNotification === 'function') showNotification('Session expired. Please login again.', 'error');
    setTimeout(() => { window.location.href = 'index.html'; }, 1500);
}

$(document).ajaxError(function(e, xhr) {
    if (xhr.status === 403 && typeof showNotification === 'function') showNotification('Access denied!', 'error');
    if (xhr.status === 500 && typeof showNotification === 'function') showNotification('Server error! Please try again.', 'error');
});

/** API Methods */
const API = {
    // Dashboard
    getDashboardStats: () => apiRequest(API_ENDPOINTS.DASHBOARD_STATS),

    // Vehicles
    getVehicles:      (p={}) => apiRequest(API_ENDPOINTS.VEHICLES, 'GET', p),
    getVehicleDetail: (id)   => apiRequest(API_ENDPOINTS.VEHICLE_DETAIL.replace('{id}', id)),
    createVehicle:    (data) => apiRequest(API_ENDPOINTS.VEHICLES, 'POST', data),
    updateVehicle:    (id,d) => apiRequest(API_ENDPOINTS.VEHICLE_DETAIL.replace('{id}', id), 'PATCH', d),
    deleteVehicle:    (id)   => apiRequest(API_ENDPOINTS.VEHICLE_DETAIL.replace('{id}', id), 'DELETE'),

    // Vehicle Documents
    getVehicleDocs:   (p={}) => apiRequest(API_ENDPOINTS.VEHICLE_DOCS, 'GET', p),
    createVehicleDoc: (fd)   => apiRequestFormData(API_ENDPOINTS.VEHICLE_DOCS, 'POST', fd),
    getVehicleDoc:    (id)   => apiRequest(API_ENDPOINTS.VEHICLE_DOC_DETAIL.replace('{id}', id)),
    updateVehicleDoc: (id,fd)=> apiRequestFormData(API_ENDPOINTS.VEHICLE_DOC_DETAIL.replace('{id}', id), 'PUT', fd),
    deleteVehicleDoc: (id)   => apiRequest(API_ENDPOINTS.VEHICLE_DOC_DETAIL.replace('{id}', id), 'DELETE'),

    // Drivers
    getDrivers:      (p={}) => apiRequest(API_ENDPOINTS.DRIVERS, 'GET', p),
    createDriver:    (data) => apiRequest(API_ENDPOINTS.DRIVERS, 'POST', data),
    getDriverDetail: (id)   => apiRequest(API_ENDPOINTS.DRIVER_DETAIL.replace('{id}', id)),
    updateDriver:    (id,d) => apiRequest(API_ENDPOINTS.DRIVER_DETAIL.replace('{id}', id), 'PATCH', d),
    deleteDriver:    (id)   => apiRequest(API_ENDPOINTS.DRIVER_DETAIL.replace('{id}', id), 'DELETE'),

    // Expenses / Notifications / Invoices
    getAllExpenses:   (p={}) => apiRequest(API_ENDPOINTS.EXPENSES, 'GET', p),
    getNotifications:(p={}) => apiRequest(API_ENDPOINTS.NOTIFICATIONS, 'GET', p),
    getInvoices:     (p={}) => apiRequest(API_ENDPOINTS.INVOICES, 'GET', p),
    createInvoice:   (data) => apiRequest(API_ENDPOINTS.INVOICES, 'POST', data),
};
