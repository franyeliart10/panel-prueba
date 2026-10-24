document.addEventListener('DOMContentLoaded', () => {

    // --- DATOS DE EJEMPLO PARA LA DEMO ---
    let families = JSON.parse(localStorage.getItem('franyeli_families')) || [
        { id: 'fam_1', name: 'Familia Rodríguez', phone: '584129000510', adults: 2, kids: 1, members: 'Carlos Rodríguez, María Pérez, Sofía Rodríguez', status: 'confirmado' },
        { id: 'fam_2', name: 'Tío Mario y Acompañante', phone: '58414000000', adults: 2, kids: 0, members: 'Mario Gómez, Elena de Gómez', status: 'confirmado' },
        { id: 'fam_3', name: 'Grupo Amigas Estudio', phone: '58412000000', adults: 3, kids: 0, members: 'Camila Sosa, Andrea Blanco, Valeria Rivas', status: 'pendiente' },
        { id: 'fam_4', name: 'Familia Mendoza', phone: '58416000000', adults: 2, kids: 2, members: 'José Mendoza, Lucía Mendoza, Mateo Mendoza, Lucas Mendoza', status: 'rechazado' }
    ];

    let persons = JSON.parse(localStorage.getItem('franyeli_persons')) || [
        { id: 'p_1', family_id: 'fam_1', family_name: 'Familia Rodríguez', name: 'Carlos Rodríguez', type: 'Adulto', status: 'confirmado', checked_in: true, table_id: 'table_1', seat: 1 },
        { id: 'p_2', family_id: 'fam_1', family_name: 'Familia Rodríguez', name: 'María Pérez', type: 'Adulto', status: 'confirmado', checked_in: false, table_id: 'table_1', seat: 2 },
        { id: 'p_3', family_id: 'fam_1', family_name: 'Familia Rodríguez', name: 'Sofía Rodríguez', type: 'Niño', status: 'confirmado', checked_in: false, table_id: null, seat: null },
        { id: 'p_4', family_id: 'fam_2', family_name: 'Tío Mario y Acompañante', name: 'Mario Gómez', type: 'Adulto', status: 'confirmado', checked_in: true, table_id: 'table_1', seat: 3 },
        { id: 'p_5', family_id: 'fam_2', family_name: 'Tío Mario y Acompañante', name: 'Elena de Gómez', type: 'Adulto', status: 'confirmado', checked_in: false, table_id: null, seat: null },
        { id: 'p_6', family_id: 'fam_3', family_name: 'Grupo Amigas Estudio', name: 'Camila Sosa', type: 'Adulto', status: 'pendiente', checked_in: false, table_id: null, seat: null },
        { id: 'p_7', family_id: 'fam_3', family_name: 'Grupo Amigas Estudio', name: 'Andrea Blanco', type: 'Adulto', status: 'pendiente', checked_in: false, table_id: null, seat: null },
        { id: 'p_8', family_id: 'fam_3', family_name: 'Grupo Amigas Estudio', name: 'Valeria Rivas', type: 'Adulto', status: 'pendiente', checked_in: false, table_id: null, seat: null }
    ];

    let tables = JSON.parse(localStorage.getItem('franyeli_tables')) || [
        { id: 'table_1', name: 'Mesa Principal VIP', type: 'round', top: 60, left: 60, capacity: 10 }
    ];

    // --- PESTAÑAS ---
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            navButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            button.classList.add('active');
            const targetPane = document.getElementById(`tab-${targetTab}`);
            if (targetPane) targetPane.classList.add('active');
        });
    });

    function saveData() {
        localStorage.setItem('franyeli_families', JSON.stringify(families));
        localStorage.setItem('franyeli_persons', JSON.stringify(persons));
        localStorage.setItem('franyeli_tables', JSON.stringify(tables));
    }

    function renderAll() {
        saveData();
        calculateMetrics();
        renderNominativasTable();
        renderGuestTable();
        renderSeatingSidebar();
        renderTablesOnCanvas();
    }

    function calculateMetrics() {
        let totalAsisten = 0, totalAdultos = 0, totalNinos = 0;
        let totalPendientes = 0, totalConfirmados = 0, totalRechazados = 0, totalCheckedIn = 0;

        persons.forEach(p => {
            if (p.status === 'confirmado') {
                totalAsisten++;
                if (p.type === 'Niño' || p.type === 'Niños') totalNinos++; else totalAdultos++;
                if (p.checked_in) totalCheckedIn++;
            }
        });

        families.forEach(f => {
            if (f.status === 'confirmado') totalConfirmados++;
            else if (f.status === 'pendiente') totalPendientes++;
            else if (f.status === 'rechazado') totalRechazados++;
        });

        if (document.getElementById('metric-asisten')) document.getElementById('metric-asisten').textContent = totalAsisten;
        if (document.getElementById('metric-adultos')) document.getElementById('metric-adultos').textContent = totalAdultos;
        if (document.getElementById('metric-ninos')) document.getElementById('metric-ninos').textContent = totalNinos;
        if (document.getElementById('metric-checkin')) document.getElementById('metric-checkin').textContent = totalCheckedIn;
        if (document.getElementById('metric-checkin-total')) document.getElementById('metric-checkin-total').textContent = totalAsisten;
        if (document.getElementById('metric-pendientes')) document.getElementById('metric-pendientes').textContent = totalPendientes;
        if (document.getElementById('metric-confirmados-card')) document.getElementById('metric-confirmados-card').textContent = totalConfirmados;
        if (document.getElementById('metric-rechazados')) document.getElementById('metric-rechazados').textContent = totalRechazados;
    }

    // Pestaña 1: Pases por Familia
    function renderNominativasTable() {
        const tbody = document.getElementById('nominativas-list-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        families.forEach((f) => {
            const tr = document.createElement('tr');
            const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '');
            const link = `${baseUrl}invitacion.html?to=${f.id}`;
            const statusTag = f.status === 'confirmado' ? '✅ Confirmado' :
                              f.status === 'pendiente' ? '⏳ Pendiente' : '❌ Rechazado';

            const phone = f.phone ? f.phone.replace(/[^0-9]/g, '') : '';
            const message = encodeURIComponent(`¡Hola ${f.name}! 👋🏻 Te compartimos tu invitación digital: ${link}`);
            const whatsappUrl = phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`;

            tr.innerHTML = `
                <td><strong>${f.name}</strong></td>
                <td><small>${f.members || 'Sin nombres'}</small></td>
                <td>${f.phone || '—'}</td>
                <td>${f.adults}Ad / ${f.kids || 0}Ni</td>
                <td><small>${statusTag}</small></td>
                <td><input type="text" readonly value="${link}" class="input-link"></td>
                <td>
                    <button class="btn-icon btn-ws" data-url="${whatsappUrl}" title="Enviar por WhatsApp">💬</button>
                    <button class="btn-icon btn-copy" data-link="${link}" title="Copiar Enlace">📋</button>
                    <button class="btn-icon btn-delete" data-id="${f.id}">🗑️</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll('.btn-ws').forEach(b => b.onclick = (e) => window.open(e.target.getAttribute('data-url'), '_blank'));
        tbody.querySelectorAll('.btn-copy').forEach(b => b.onclick = (e) => {
            navigator.clipboard.writeText(e.target.getAttribute('data-link'));
            alert('¡Enlace copiado al portapapeles!');
        });
        tbody.querySelectorAll('.btn-delete').forEach(b => b.onclick = (e) => {
            const id = e.target.getAttribute('data-id');
            if (confirm('¿Eliminar este pase?')) {
                families = families.filter(f => f.id !== id);
                persons = persons.filter(p => p.family_id !== id);
                renderAll();
            }
        });
    }

    // Pestaña 2: Lista de Personas & Check-in
    function renderGuestTable() {
        const tbody = document.getElementById('guest-list-body');
        if (!tbody) return;
        const filter = document.getElementById('filter-status') ? document.getElementById('filter-status').value : 'all';
        const searchQuery = document.getElementById('search-input') ? document.getElementById('search-input').value.toLowerCase() : '';
        tbody.innerHTML = '';

        persons.forEach((p) => {
            if (filter === 'confirmados' && p.status !== 'confirmado') return;
            if (filter === 'pendientes' && p.status !== 'pendiente') return;
            if (filter === 'rechazados' && p.status !== 'rechazado') return;

            const matchesSearch = p.name.toLowerCase().includes(searchQuery) || (p.family_name && p.family_name.toLowerCase().includes(searchQuery));
            if (!matchesSearch) return;

            const tr = document.createElement('tr');
            const checkinBtn = p.checked_in ? 
                `<button class="btn-checkin checked" data-id="${p.id}">🚪 En Fiesta</button>` : 
                `<button class="btn-checkin pending" data-id="${p.id}">🎟️ Marcar Llegada</button>`;

            const statusTag = p.status === 'confirmado' ? '<span class="status-yes">Sí</span>' :
                              p.status === 'pendiente' ? '<span class="status-pending">⏳ Pendiente</span>' :
                              '<span class="status-no">❌ No</span>';

            tr.innerHTML = `
                <td>${checkinBtn}</td>
                <td><strong>${p.name}</strong></td>
                <td><small>${p.type || 'Adulto'}</small></td>
                <td><small>${p.family_name || '—'}</small></td>
                <td>${statusTag}</td>
                <td><button class="btn-delete" data-id="${p.id}">🗑️</button></td>
            `;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll('.btn-checkin').forEach(btn => btn.onclick = (e) => {
            const id = e.target.getAttribute('data-id');
            const person = persons.find(p => p.id === id);
            if (person) {
                person.checked_in = !person.checked_in;
                renderAll();
            }
        });

        tbody.querySelectorAll('.btn-delete').forEach(btn => btn.onclick = (e) => {
            const id = e.target.getAttribute('data-id');
            if (confirm('¿Eliminar a esta persona?')) {
                persons = persons.filter(p => p.id !== id);
                renderAll();
            }
        });
    }

    // Modal Crear Pase
    const modalFam = document.getElementById('modal-family');
    const btnOpenModalFam = document.getElementById('btn-open-modal-family');
    const btnCloseModalFam = document.getElementById('btn-close-modal-family');
    const formFamily = document.getElementById('form-family');

    if (btnOpenModalFam) btnOpenModalFam.onclick = () => { if (modalFam) modalFam.style.display = 'flex'; };
    if (btnCloseModalFam) btnCloseModalFam.onclick = () => { if (modalFam) modalFam.style.display = 'none'; };

    if (formFamily) {
        formFamily.onsubmit = (e) => {
            e.preventDefault();
            const famName = document.getElementById('modal-family-title').value;
            const famPhone = document.getElementById('modal-family-phone').value;
            const famAdults = parseInt(document.getElementById('modal-family-adults').value) || 1;
            const famKids = parseInt(document.getElementById('modal-family-kids').value) || 0;
            const famMembers = document.getElementById('modal-family-members').value;

            const newFam = {
                id: 'fam_' + Date.now(),
                name: famName,
                phone: famPhone,
                adults: famAdults,
                kids: famKids,
                members: famMembers,
                status: 'pendiente'
            };
            families.unshift(newFam);

            if (famMembers) {
                famMembers.split(',').forEach(mName => {
                    const cleanName = mName.trim();
                    if (cleanName) {
                        persons.unshift({
                            id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                            family_id: newFam.id,
                            family_name: famName,
                            name: cleanName,
                            type: 'Adulto',
                            status: 'pendiente',
                            checked_in: false,
                            table_id: null,
                            seat: null
                        });
                    }
                });
            }

            if (modalFam) modalFam.style.display = 'none';
            formFamily.reset();
            renderAll();
        };
    }

    if (document.getElementById('filter-status')) document.getElementById('filter-status').onchange = renderGuestTable;
    if (document.getElementById('search-input')) document.getElementById('search-input').oninput = renderGuestTable;

    // --- SEATING PLAN ---
    let draggedPersonId = null;

    function renderSeatingSidebar() {
        const container = document.getElementById('unassigned-guests');
        if (!container) return;
        container.innerHTML = '';

        const unassigned = persons.filter(p => p.status === 'confirmado' && !p.table_id);
        if (unassigned.length === 0) {
            container.innerHTML = '<small style="color: #1e824c;">¡Todas las personas confirmadas están sentadas!</small>';
            return;
        }

        unassigned.forEach(p => {
            const card = document.createElement('div');
            card.className = 'guest-card';
            card.draggable = true;
            card.setAttribute('data-id', p.id);
            card.innerHTML = `<strong>${p.name}</strong> <small>${p.type} (${p.family_name})</small>`;

            card.addEventListener('dragstart', (e) => {
                draggedPersonId = p.id;
                e.dataTransfer.setData('text/plain', p.id);
            });

            container.appendChild(card);
        });
    }

    function createTable(type) {
        const newTable = {
            id: 'table_' + Date.now(),
            name: `Mesa ${tables.length + 1}`,
            type: type,
            top: 50 + (tables.length * 30),
            left: 50 + (tables.length * 30),
            capacity: 10
        };
        tables.push(newTable);
        renderAll();
    }

    if (document.getElementById('btn-table-redonda')) document.getElementById('btn-table-redonda').onclick = () => createTable('round');
    if (document.getElementById('btn-table-rect')) document.getElementById('btn-table-rect').onclick = () => createTable('rectangular');
    if (document.getElementById('btn-table-cuadrada')) document.getElementById('btn-table-cuadrada').onclick = () => createTable('square');

    function renderTablesOnCanvas() {
        const canvas = document.getElementById('tables-layer');
        if (!canvas) return;
        canvas.innerHTML = '';

        tables.forEach(t => {
            const tableDiv = document.createElement('div');
            tableDiv.className = `room-table ${t.type}`;
            tableDiv.style.top = `${t.top}px`;
            tableDiv.style.left = `${t.left}px`;

            const showTableNames = document.getElementById('chk-tablenames') ? document.getElementById('chk-tablenames').checked : true;
            const showFullNames = document.getElementById('chk-fullnames') ? document.getElementById('chk-fullnames').checked : false;

            let seatsHtml = '';
            for (let i = 1; i <= t.capacity; i++) {
                const assigned = persons.find(p => p.table_id === t.id && p.seat === i);
                let label = i;
                let title = `Asiento ${i} (Vacío)`;

                if (assigned) {
                    label = showFullNames ? assigned.name.substring(0, 4) : assigned.name.charAt(0).toUpperCase();
                    title = `${assigned.name} (${assigned.family_name}) - Clic para liberar`;
                }

                seatsHtml += `<div class="seat ${assigned ? 'occupied' : ''}" data-table="${t.id}" data-seat="${i}" data-person="${assigned ? assigned.id : ''}" title="${title}">${label}</div>`;
            }

            tableDiv.innerHTML = `
                <span class="table-label">${showTableNames ? t.name : ''}</span>
                <div class="seats-ring">${seatsHtml}</div>
            `;

            tableDiv.querySelectorAll('.seat').forEach(s => {
                s.addEventListener('dragover', (e) => e.preventDefault());
                s.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const tableId = s.getAttribute('data-table');
                    const seatNum = parseInt(s.getAttribute('data-seat'));

                    if (draggedPersonId) {
                        const person = persons.find(p => p.id === draggedPersonId);
                        if (person) {
                            person.table_id = tableId;
                            person.seat = seatNum;
                            draggedPersonId = null;
                            renderAll();
                        }
                    }
                });

                s.addEventListener('click', () => {
                    const personId = s.getAttribute('data-person');
                    if (personId) {
                        const person = persons.find(p => p.id === personId);
                        if (person && confirm(`¿Deseas quitar a ${person.name} de esta mesa?`)) {
                            person.table_id = null;
                            person.seat = null;
                            renderAll();
                        }
                    }
                });
            });

            makeDraggableTable(tableDiv, t);
            canvas.appendChild(tableDiv);
        });
    }

    function makeDraggableTable(elm, tableObj) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        elm.onmousedown = (e) => {
            if (e.target.classList.contains('seat')) return;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = () => {
                document.onmouseup = null;
                document.onmousemove = null;
                tableObj.top = elm.offsetTop;
                tableObj.left = elm.offsetLeft;
                saveData();
            };
            document.onmousemove = (e) => {
                e.preventDefault();
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                elm.style.top = (elm.offsetTop - pos2) + "px";
                elm.style.left = (elm.offsetLeft - pos1) + "px";
            };
        };
    }

    ['chk-fullnames', 'chk-tablenames'].forEach(id => {
        if (document.getElementById(id)) document.getElementById(id).onchange = renderTablesOnCanvas;
    });

    renderAll();
});
