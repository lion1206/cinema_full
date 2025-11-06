document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE_URL = 'api';
    const ticketsContainer = document.getElementById('ticketsContainer');
    const noTicketsMessage = document.getElementById('noTicketsMessage');
    const logoutBtn = document.getElementById('logoutBtn');

    // References for Desktop Nav and Mobile Burger Menu are obtained globally from script.js via window.updateNavVisibility.
    // However, for direct interaction from lk.js, we still need local references for modal elements.
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const loginUsernameInput = document.getElementById('loginUsername');
    const loginPasswordInput = document.getElementById('loginPassword');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
    const loginErrorEl = document.getElementById('loginError');
    const registerUsernameInput = document.getElementById('registerUsername');
    const registerEmailInput = document.getElementById('registerEmail');
    const registerPasswordInput = document.getElementById('registerPassword');
    const registerConfirmPasswordInput = document.getElementById('registerConfirmPassword');
    const registerSubmitBtn = document.getElementById('registerSubmitBtn');
    const registerErrorEl = document.getElementById('registerError');
    const openRegisterModalLink = document.getElementById('openRegisterModal');
    const openLoginModalLink = document.getElementById('openLoginModal');


    // Using global functions from script.js (ensure script.js loads first)
    const getAccessToken = () => localStorage.getItem('access_token');
    const isLoggedIn = window.isLoggedIn;
    const openModal = window.openModal;
    const closeModal = window.closeModal;
    const updateNavVisibility = window.updateNavVisibility;


    // --- Modal event listeners for LK page (ensure they exist here for local modal elements) ---
    if (loginModal) loginModal.querySelector('.modal-close').addEventListener('click', () => closeModal(loginModal));
    if (loginModal) loginModal.querySelector('.modal-backdrop').addEventListener('click', () => closeModal(loginModal));
    if (registerModal) registerModal.querySelector('.modal-close').addEventListener('click', () => closeModal(registerModal));
    if (registerModal) registerModal.querySelector('.modal-backdrop').addEventListener('click', () => closeModal(registerModal));
    if (openRegisterModalLink) {
        openRegisterModalLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(loginModal);
            openModal(registerModal);
        });
    }
    if (openLoginModalLink) {
        openLoginModalLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(registerModal);
            openModal(loginModal);
        });
    }
    // --- End Modal event listeners ---

    // Authentication functions for LK page (copied from script.js, should ideally be in a shared utility file)
    async function loginUser(username, password) {
        if (loginErrorEl) loginErrorEl.textContent = '';
        try {
            const response = await fetch(`${API_BASE_URL}/users/token/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                closeModal(loginModal);
                updateNavVisibility(); // Call the global function
                await fetchUserTickets(); // Re-fetch tickets after login
                console.log('Login successful:', data);
                return true;
            } else {
                if (loginErrorEl) loginErrorEl.textContent = data.detail || data.error || 'Ошибка входа';
                console.error('Login failed:', data);
                return false;
            }
        } catch (error) {
            if (loginErrorEl) loginErrorEl.textContent = 'Сетевая ошибка. Проверьте подключение к бэкенду.';
            console.error('Network error during login:', error);
            return false;
        }
    }
    if (loginSubmitBtn) {
        loginSubmitBtn.addEventListener('click', async () => {
            const username = loginUsernameInput.value;
            const password = loginPasswordInput.value;
            if (username && password) {
                await loginUser(username, password);
            } else {
                if (loginErrorEl) loginErrorEl.textContent = 'Пожалуйста, введите логин и пароль.';
            }
        });
    }
    async function registerUser(username, email, password) {
        if (registerErrorEl) registerErrorEl.textContent = '';
        try {
            const response = await fetch(`${API_BASE_URL}/users/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                closeModal(registerModal);
                updateNavVisibility(); // Call the global function
                await fetchUserTickets(); // Re-fetch tickets after registration
                alert('Регистрация прошла успешно! Вы вошли в систему.');
                return true;
            } else {
                let errorMessage = data.error || 'Ошибка регистрации.';
                if (data.username && Array.isArray(data.username)) errorMessage = `Имя пользователя: ${data.username.join(', ')}.`;
                else if (data.email && Array.isArray(data.email)) errorMessage = `Почта: ${data.email.join(', ')}.`;
                else if (data.password && Array.isArray(data.password)) errorMessage = `Пароль: ${data.password.join(', ')}.`;
                if (registerErrorEl) registerErrorEl.textContent = errorMessage;
                console.error('Registration failed:', data);
                return false;
            }
        } catch (error) {
            if (registerErrorEl) registerErrorEl.textContent = 'Сетевая ошибка. Проверьте подключение к бэкенду.';
            console.error('Network error during registration:', error);
            return false;
        }
    }
    if (registerSubmitBtn) {
        registerSubmitBtn.addEventListener('click', async () => {
            const username = registerUsernameInput.value;
            const email = registerEmailInput.value;
            const password = registerPasswordInput.value;
            const confirmPassword = registerConfirmPasswordInput.value;
            if (!username || !password || !email) { if (registerErrorEl) registerErrorEl.textContent = 'Все поля обязательны для заполнения.'; return; }
            if (password !== confirmPassword) { if (registerErrorEl) registerErrorErrorEl.textContent = 'Пароли не совпадают.'; return; }
            await registerUser(username, email, password);
        });
    }


    async function fetchUserTickets() {
        if (!ticketsContainer || !noTicketsMessage) {
            console.error("Tickets container or message element not found on LK page.");
            return; // Exit if essential elements are missing
        }

        ticketsContainer.innerHTML = ''; // Clear previous tickets
        noTicketsMessage.textContent = ''; // Clear previous messages

        if (!isLoggedIn()) {
            noTicketsMessage.textContent = 'Для просмотра билетов необходимо войти в аккаунт.';
            // This redirect logic is specifically for the LK page.
            // If not logged in and on lk.html, redirect.
            if (window.location.pathname.includes('lk.html')) {
                window.location.href = 'index.html';
            }
            return;
        }

        const accessToken = getAccessToken();
        if (!accessToken) {
            noTicketsMessage.textContent = 'Ошибка аутентификации. Пожалуйста, войдите снова.';
            if (window.location.pathname.includes('lk.html')) {
                // If on LK page and no token, redirect to home and open login modal
                window.location.href = 'index.html';
                // The script.js on index.html will then call openModal for login
            } else if (loginModal && openModal) {
                openModal(loginModal); // Open login modal if on another page
            }
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/tickets/`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (response.ok) {
                const tickets = await response.json();
                if (tickets.length === 0) {
                    noTicketsMessage.textContent = 'У вас пока нет забронированных билетов.';
                } else {
                    tickets.forEach(ticket => {
                        const ticketCard = document.createElement('div');
                        ticketCard.className = 'ticket-card';
                        ticketCard.innerHTML = `
                            <h3>${ticket.movie_title}</h3>
                            <p><strong>Номер билета:</strong> ${ticket.ticket_number}</p>
                            <p><strong>Время сеанса:</strong> ${new Date(ticket.start_time).toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' })}</p>
                            <p><strong>Место:</strong> ${ticket.seat_number}</p>
                        `;
                        ticketsContainer.appendChild(ticketCard);
                    });
                }
            } else {
                const errorData = await response.json();
                if (response.status === 401 || response.status === 403) {
                    noTicketsMessage.textContent = 'Ваша сессия истекла или вы не авторизованы. Пожалуйста, войдите снова.';
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    updateNavVisibility(); // Update after token removal

                    if (window.location.pathname.includes('lk.html')) {
                        window.location.href = 'index.html'; // Explicit redirect for LK page
                    } else if (loginModal && openModal) {
                        openModal(loginModal); // Open login modal if not on LK page
                    }
                } else {
                    noTicketsMessage.textContent = `Ошибка при загрузке билетов: ${errorData.detail || 'Неизвестная ошибка'}`;
                }
                console.error('Failed to fetch tickets:', errorData);
            }
        } catch (error) {
            noTicketsMessage.textContent = 'Сетевая ошибка. Проверьте подключение к бэкенду.';
            console.error('Network error during ticket fetch:', error);
        }
    }

    // --- Logout functionality ---
    function logout() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        alert('Вы вышли из аккаунта');
        updateNavVisibility(); // Update after logout
        window.location.href = 'index.html'; // Redirect to home page after logout
    }

    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    // Initial load logic for LK page
    updateNavVisibility(); // Update general nav items first

    // Fetch tickets only if the user is logged in AND on the LK page
    if (isLoggedIn() && window.location.pathname.includes('lk.html')) {
        fetchUserTickets();
    } else if (!isLoggedIn() && window.location.pathname.includes('lk.html')) {
        // If not logged in and on LK page, redirect immediately
        window.location.href = 'index.html';
    }
});
