document.addEventListener('DOMContentLoaded', () => {

    // --- BASE DE DATOS LOCAL (TOTALMENTE EN BLANCO) ---
    let families = JSON.parse(localStorage.getItem('franyeli_families')) || [];
    let persons = JSON.parse(localStorage.getItem('franyeli_persons')) || [];
    let tables = JSON.parse(localStorage.getItem('franyeli_tables')) || [];

    // --- PESTAÑAS ---
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            navButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(`tab-${targetTab}`).classList.add('active');
        });
    });

    // --- RENDERIZADO Y MÉTRICAS ---
    function renderAll() {
        saveData();
        calculateMetrics();
        renderNominativasTable();
        renderGuestTable();
        renderSeatingSidebar();
        renderTablesOnCanvas();
    }

    function saveData() {
        localStorage.setItem('franyeli_families', JSON.stringify(families));
        localStorage.setItem('franyeli_persons', JSON.stringify(persons));
        localStorage.setItem('franyeli_tables', JSON.stringify(tables));
    }

    function calculateMetrics() {
        let totalAsisten = 0;
        let totalAdultos = 0;
        let totalNinos = 0;
        let totalPendientes = 0;
        let totalConfirmados = 0;
        let totalRechazados = 0;
        let totalCheckedIn = 0;

        persons.forEach(p => {
            if (p.status === 'confirmado') {
                totalAsisten++;
                if (p.type === 'Adulto') totalAdultos++;
                else totalNinos++;
                if (p.checkedIn) totalCheckedIn++;
            }
        });

        families.forEach(f => {
            if (f.status === 'confirmado') totalConfirmados++;
            else if (f.status === 'pendiente') totalPendientes++;
            else if (f.status === 'rechazado') totalRechazados++;
        });

        document.getElementById('metric-asisten').textContent = totalAsisten;
        document.getElementById('metric-adultos').textContent = totalAdultos;
        document.getElementById('metric-ninos').textContent = totalNinos;
        document.getElementById('metric-checkin').textContent = totalCheckedIn;
        document.getElementById('metric-checkin-total').textContent = totalAsisten;
        document.getElementById('metric-pendientes').textContent = totalPendientes;
        document.getElementById('metric-confirmados-card').textContent = totalConfirmados;
        document.getElementById('metric-rechazados').textContent = totalRechazados;
    }

    // Pestaña 1: Pases por Familia
    function renderNominativasTable() {
        const tbody = document.getElementById('nominativas-list-body');
        tbody.innerHTML = '';

        if (families.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #7b7893; padding: 20px;">Aún no has añadido pases. Haz clic en "+ CREAR PASE FAMILIAR" o sube un Excel.</td></tr>';
            return;
        }

        families.forEach((f) => {
            const tr = document.createElement('tr');
            const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '');
            const link = `${baseUrl}invitacion.html?to=${f.id}`;
            const statusTag = f.status === 'confirmado' ? '✅ Confirmado' :
                              f.status === 'pendiente' ? '⏳ Pendiente' : '❌ Rechazado';

            const phone = f.phone ? f.phone.replace(/[^0-9]/g, '') : '';
            const message = encodeURIComponent(`¡Hola ${f.name}! 👋🏻 Te compartimos tu invitación digital. Por favor confirma la asistencia de tus integrantes aquí: ${link}`);
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

        tbody.querySelectorAll('.btn-ws').forEach(b => {
            b.onclick = (e) => window.open(e.target.getAttribute('data-url'), '_blank');
        });
        tbody.querySelectorAll('.btn-copy').forEach(b => {
            b.onclick = (e) => {
                navigator.clipboard.writeText(e.target.getAttribute('data-link'));
                alert('¡Enlace copiado al portapapeles!');
            };
        });
        tbody.querySelectorAll('.btn-delete').forEach(b => {
            b.onclick = (e) => {
                const id = e.target.getAttribute('data-id');
                if (confirm('¿Eliminar este pase familiar?')) {
                    families = families.filter(f => f.id !== id);
                    persons = persons.filter(p => p.familyId !== id);
                    renderAll();
                }
            };
        });
    }

    // Pestaña 2: Lista de Personas & Check-in
    function renderGuestTable() {
        const tbody = document.getElementById('guest-list-body');
        const filter = document.getElementById('filter-status').value;
        const searchQuery = document.getElementById('search-input').value.toLowerCase();
        tbody.innerHTML = '';

        if (persons.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #7b7893; padding: 20px;">La lista de personas se llenará automáticamente a medida que las familias confirmen.</td></tr>';
            return;
        }

        persons.forEach((p) => {
            if (filter === 'confirmados' && p.status !== 'confirmado') return;
            if (filter === 'pendientes' && p.status !== 'pendiente') return;
            if (filter === 'rechazados' && p.status !== 'rechazado') return;

            const matchesSearch = p.name.toLowerCase().includes(searchQuery) ||
                                  p.familyName.toLowerCase().includes(searchQuery);

            if (!matchesSearch) return;

            const tr = document.createElement('tr');
            const checkinBtn = p.checkedIn ? 
                `<button class="btn-checkin checked" data-id="${p.id}">🚪 En Fiesta</button>` : 
                `<button class="btn-checkin pending" data-id="${p.id}">🎟️ Marcar Llegada</button>`;

            const statusTag = p.status === 'confirmado' ? '<span class="status-yes">Sí</span>' :
                              p.status === 'pendiente' ? '<span class="status-pending">⏳ Pendiente</span>' :
                              '<span class="status-no">❌ No</span>';

            tr.innerHTML = `
                <td>${checkinBtn}</td>
                <td><strong>${p.name}</strong></td>
                <td><small>${p.type}</small></td>
                <td><small>${p.familyName}</small></td>
                <td>${statusTag}</td>
                <td><button class="btn-delete" data-id="${p.id}">🗑️</button></td>
            `;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll('.btn-checkin').forEach(btn => {
            btn.onclick = (e) => {
                const id = e.target.getAttribute('data-id');
                const person = persons.find(p => p.id === id);
                if (person) {
                    person.checkedIn = !person.checkedIn;
                    renderAll();
                }
            };
        });

        tbody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.onclick = (e) => {
                const id = e.target.getAttribute('data-id');
                if (confirm('¿Eliminar a esta persona?')) {
                    persons = persons.filter(p => p.id !== id);
                    renderAll();
                }
            };
        });
    }

    // Modal Crear Pase
    const modalFam = document.getElementById('modal-family');
    const btnOpenModalFam = document.getElementById('btn-open-modal-family');
    const btnCloseModalFam = document.getElementById('btn-close-modal-family');
    const formFamily = document.getElementById('form-family');

    if (btnOpenModalFam) btnOpenModalFam.onclick = () => modalFam.style.display = 'flex';
    btnCloseModalFam.onclick = () => modalFam.style.display = 'none';

    formFamily.onsubmit = (e) => {
        e.preventDefault();
        const newFam = {
            id: 'fam_' + Date.now(),
            name: document.getElementById('modal-family-title').value,
            phone: document.getElementById('modal-family-phone').value,
            adults: parseInt(document.getElementById('modal-family-adults').value) || 1,
            kids: parseInt(document.getElementById('modal-family-kids').value) || 0,
            members: document.getElementById('modal-family-members').value,
            status: 'pendiente'
        };

        families.push(newFam);
        modalFam.style.display = 'none';
        formFamily.reset();
        renderAll();
    };

    // Excel Input
    const fileInput = document.getElementById('excel-file-input');
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            jsonData.forEach((row, idx) => {
                families.push({
                    id: 'fam_' + Date.now() + '_' + idx,
                    name: row['Familia'] || row['Nombre'] || 'Familia ' + (idx + 1),
                    phone: row['Telefono'] || row['Teléfono'] || '',
                    adults: parseInt(row['Adultos']) || 1,
                    kids: parseInt(row['Niños'] || row['Ninos']) || 0,
                    members: row['Nombres'] || row['Integrantes'] || '',
                    status: 'pendiente'
                });
            });

            renderAll();
            alert(`¡Se cargaron ${jsonData.length} pases familiares desde Excel!`);
        };
        reader.readAsArrayBuffer(file);
    });

    // Exportadores
    document.getElementById('btn-export-pases').onclick = () => {
        const exportData = families.map(f => ({
            'Familia / Pase': f.name,
            'Teléfono': f.phone,
            'Integrantes': f.members,
            'Adultos': f.adults,
            'Niños': f.kids,
            'Estado': f.status,
            'Enlace': `${window.location.origin}/invitacion.html?to=${f.id}`
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pases Familares");
        XLSX.writeFile(wb, "Pases_Familiares_Evento.xlsx");
    };

    document.getElementById('btn-export-excel').onclick = () => {
        const exportData = persons.map(p => ({
            'Nombre Persona': p.name,
            'Familia': p.familyName,
            'Asiste': p.status,
            'En Fiesta (Check-in)': p.checkedIn ? 'Sí' : 'No'
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Personas Confirmadas");
        XLSX.writeFile(wb, "Lista_Personas_Evento.xlsx");
    };

    document.getElementById('filter-status').onchange = renderGuestTable;
    document.getElementById('search-input').oninput = renderGuestTable;

    // --- SEATING PLAN ---
    let draggedPersonId = null;

    function renderSeatingSidebar() {
        const container = document.getElementById('unassigned-guests');
        container.innerHTML = '';

        const unassigned = persons.filter(p => p.status === 'confirmado' && !p.table);
        if (unassigned.length === 0) {
            container.innerHTML = '<small style="color: #1e824c;">No hay personas pendientes por sentar.</small>';
            return;
        }

        unassigned.forEach(p => {
            const card = document.createElement('div');
            card.className = 'guest-card';
            card.draggable = true;
            card.setAttribute('data-id', p.id);
            card.innerHTML = `<strong>${p.name}</strong> <small>${p.type} (${p.familyName})</small>`;

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
            top: 50 + (tables.length * 20),
            left: 50 + (tables.length * 20),
            capacity: 10
        };
        tables.push(newTable);
        renderAll();
    }

    document.getElementById('btn-table-redonda').onclick = () => createTable('round');
    document.getElementById('btn-table-rect').onclick = () => createTable('rectangular');
    document.getElementById('btn-table-cuadrada').onclick = () => createTable('square');

    function renderTablesOnCanvas() {
        const canvas = document.getElementById('tables-layer');
        canvas.innerHTML = '';

        tables.forEach(t => {
            const tableDiv = document.createElement('div');
            tableDiv.className = `room-table ${t.type}`;
            tableDiv.style.top = `${t.top}px`;
            tableDiv.style.left = `${t.left}px`;

            const showTableNames = document.getElementById('chk-tablenames').checked;
            const showFullNames = document.getElementById('chk-fullnames').checked;

            let seatsHtml = '';
            for (let i = 1; i <= t.capacity; i++) {
                const assigned = persons.find(p => p.table === t.id && p.seat === i);
                let label = i;
                let title = `Asiento ${i} (Vacío)`;

                if (assigned) {
                    label = showFullNames ? assigned.name.substring(0, 4) : assigned.name.charAt(0).toUpperCase();
                    title = `${assigned.name} (${assigned.familyName}) - Clic para liberar`;
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
                            person.table = tableId;
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
                            person.table = null;
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
        document.getElementById(id).onchange = renderTablesOnCanvas;
    });

    renderAll();
});