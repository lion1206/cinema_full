document.addEventListener('DOMContentLoaded', () => {

  const ROWS = 9;
  const COLS = 15;
  const PRICE = 440;


  // --- Auth Helper for Tickets ---
  const API_BASE_URL = 'api'; // IMPORTANT: Adjust if your backend runs on a different port/host

  // Using global functions from script.js
  const getAccessToken = () => localStorage.getItem('access_token');
  const isLoggedIn = window.isLoggedIn;
  const openModal = window.openModal;
  const closeModal = window.closeModal;
  const updateNavVisibility = window.updateNavVisibility; // Ensure this is also called from script.js

  // --- END Auth Helper ---

  const params = new URLSearchParams(window.location.search);
  const filmID = params.get("id");
  const container = document.getElementById("film"); // Where film details are rendered

  let film = null;
  // Access postItms directly, assuming it's available in global scope from script.js
  for (const day in postItms) {
    const arr = Array.isArray(postItms[day]) ? postItms[day] : [];
    const hit = arr.find(f => f.id === filmID);
    if (hit) { film = hit; break; }
  }

  if (!film) {
    container.textContent = "Произошла ошибка 404, фильм не найден!";
    return;
  }

  // Render film details
  container.innerHTML = `
    <h1>${film.name || film.id}</h1>
    <div class="cont_film">
      <div class="post_film"><img src="${film.src}" alt="${film.alt || ""}"></div>
      <div class="info_film">
        <p><strong>Дата выхода:</strong> ${film.data || "-"}</p>
        <p><strong>Продолжительность:</strong> ${film.tim || "-"}</p>
        <p>${film.synopsis || "Описание будет добавлено позднее"}</p>
        <button class="btn-glow" id="openSeatsBtn">Купить</button>
      </div>
    </div>
  `;

  // Get references to login modal (site-wide)
  const loginModal = document.getElementById('loginModal');

  // References to seat selection section elements
  const seatSelectionSection = document.getElementById('seatSelectionSection'); // The new section wrapper
  const hall  = document.getElementById('seat-hall');
  const labels= document.getElementById('seat-rowLabels');
  const selectedCountEl = document.getElementById('selectedCount');
  const priceEl = document.getElementById('price');
  const totalEl = document.getElementById('total');
  const payBtn = document.getElementById('payBtn');
  const openSeatsBtn = document.getElementById('openSeatsBtn'); // The "Купить" button

  priceEl.textContent = PRICE;

  const occupiedByFilm = {
    'hunger-game': ['1-7','1-8','3-5','5-10'],
    'batman': ['2-3', '2-4', '4-1'],
    'gely': ['1-1','1-2'],
    'f1': ['3-1','3-2','3-3'],
    'identifikaciy': ['5-5','5-6'],
    'chil_shpion': ['7-1','7-2','7-3','7-4'],
    'tim_and_com': ['9-9'],
    'fem_prizr': ['8-1'],
    'wearons': ['6-6','6-7'],
    'ved_dock': ['4-10','4-11','4-12'],
    'seven_day': ['2-1'],
  };
  const occupiedSet = new Set(occupiedByFilm[film.id] || []);

  // Handler for the "Купить" button
  openSeatsBtn.addEventListener('click', () => {
    if (!isLoggedIn()) {
        if (loginModal && openModal) { // Use global openModal
            openModal(loginModal);
        } else {
            alert('Для покупки билетов необходимо войти или зарегистрироваться.');
        }
        return;
    }

    // If logged in, show the seat selection section and render seats
    seatSelectionSection.style.display = 'block';
    renderHall();
    renderLabels();
    updateSummary();
    // Scroll to the seat selection section for better UX
    seatSelectionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });


  function renderHall(){
    hall.innerHTML = ''; // clear
    const frag = document.createDocumentFragment();

    for (let r = 1; r <= ROWS; r++){
      for (let c = 1; c <= COLS; c++){
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'seat';
        btn.dataset.row = r;
        btn.dataset.col = c;
        btn.title = `Ряд ${r}, место ${c}`;
        btn.textContent = `${c}`; // Display seat number for clarity

        if (occupiedSet.has(`${r}-${c}`)) {
            btn.classList.add('occupied');
            btn.disabled = true; // Disable occupied seats
        }

        frag.appendChild(btn);
      }
    }
    hall.appendChild(frag);
  }

  // labels
  function renderLabels(){
    labels.innerHTML = '';
    const lf = document.createDocumentFragment();
    for (let c = 1; c <= COLS; c++){
      const d = document.createElement('div');
      d.textContent = c;
      lf.appendChild(d);
    }
    labels.appendChild(lf);
  }


  hall.addEventListener('click', (e) => {
    const seat = e.target.closest('.seat');
    if (!seat) return;
    if (seat.classList.contains('occupied')) return;

    seat.classList.toggle('selected');
    updateSummary();
  });

  function updateSummary(){
    const selected = hall.querySelectorAll('.seat.selected').length;
    selectedCountEl.textContent = selected;
    totalEl.textContent = `${selected * PRICE} ₽`;
    payBtn.disabled = selected === 0;
  }


  payBtn.addEventListener('click', async () => {
    if (!isLoggedIn()) { // Double-check auth, though "Купить" already checked
        openModal(loginModal);
        return;
    }

    const selectedSeatElements = [...hall.querySelectorAll('.seat.selected')];
    if (selectedSeatElements.length === 0) {
        alert('Пожалуйста, выберите хотя бы одно место.');
        return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
        alert('Ошибка: Вы не авторизованы. Пожалуйста, войдите снова.');
        openModal(loginModal);
        return;
    }

    // Prepare tickets array for multiple seat purchases
    const ticketsToCreate = selectedSeatElements.map(s => ({
        ticket_number: `TICKET-${Date.now()}-${s.dataset.row}-${s.dataset.col}`, // Simple unique ID
        movie_title: film.name,
        // Assuming a fixed start time for simplicity. In a real app, this would come from a specific screening.
        start_time: new Date().toISOString(), // Use ISO string for DateTimeField
        seat_number: `${s.dataset.row}-${s.dataset.col}`,
    }));

    let allSuccessful = true;
    let successfulSeats = [];
    let failedSeats = [];

    for (const ticketData of ticketsToCreate) {
        try {
            const response = await fetch(`${API_BASE_URL}/tickets/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify(ticketData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error(`Failed to create ticket for seat ${ticketData.seat_number}:`, errorData);
                allSuccessful = false;
                failedSeats.push(ticketData.seat_number);
            } else {
                console.log(`Ticket created for seat ${ticketData.seat_number}:`, await response.json());
                successfulSeats.push(ticketData.seat_number);
                // Mark seat as occupied immediately on success
                const seatElement = hall.querySelector(`.seat[data-row="${ticketData.seat_number.split('-')[0]}"][data-col="${ticketData.seat_number.split('-')[1]}"]`);
                if (seatElement) {
                    seatElement.classList.remove('selected');
                    seatElement.classList.add('occupied');
                    seatElement.disabled = true;
                    occupiedSet.add(ticketData.seat_number);
                }
            }
        } catch (error) {
            console.error('Network error during ticket purchase for seat:', ticketData.seat_number, error);
            allSuccessful = false;
            failedSeats.push(ticketData.seat_number);
        }
    }

    if (allSuccessful) {
        alert(`Билеты на фильм "${film.name}" успешно забронированы!\nМеста: ${successfulSeats.join(', ')}\nК оплате: ${successfulSeats.length * PRICE} ₽`);
    } else {
        let message = `Произошла ошибка при бронировании некоторых билетов на фильм "${film.name}".\n`;
        if (successfulSeats.length > 0) {
            message += `Успешно забронировано мест: ${successfulSeats.join(', ')}\n`;
        }
        if (failedSeats.length > 0) {
            message += `Не удалось забронировать мест: ${failedSeats.join(', ')}\n`;
        }
        alert(message + 'Проверьте консоль для деталей.');
    }

    updateSummary();
    // Hide the seat selection section after purchase
    seatSelectionSection.style.display = 'none';
  });

  // Call updateNavVisibility on initial load to ensure correct auth links
  if (typeof updateNavVisibility === 'function') {
      updateNavVisibility();
  }
});
