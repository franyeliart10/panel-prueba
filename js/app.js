// Configuración de conexión con Supabase
const SUPABASE_URL = "https://ysyfycngjqgitwyfxeto.supabase.co";
const SUPABASE_ANON_KEY = "sb_secret_eYR6k9lZupclBDdDQZPluA_oZMrmCRN";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {

    let families = [];
    let persons = [];
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

    // --- CARGAR DATOS DESDE SUPABASE ---
    async function fetchAllData() {
        try {
            // Consultar familias
            const { data: famData, error: famErr } = await supabaseClient
                .from('families')
                .select('*')
                .order('created_at', { ascending: false });

            if (!famErr && famData) families = famData;

            // Consultar personas
            const { data: perData, error: perErr } = await supabaseClient
                .from('persons')
                .select('*')
                .order('created_at', { ascending: false });

            if (!perErr && perData) persons = perData;

            renderAll();
        } catch (err) {
            console.error("Error cargando datos de Supabase:", err);
        }
    }

    function renderAll() {
        calculateMetrics();
        renderNominativasTable();
        renderGuestTable();
        renderSeatingSidebar();
        renderTablesOnCanvas();
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
            b.onclick = async (e) => {
                const id = e.target.getAttribute('data-id');
                if (confirm('¿Eliminar este pase familiar de la base de datos?')) {
                    await supabaseClient.from('families').delete().eq('id', id);
                    fetchAllData();
                }
            };
        });
    }

    // Pestaña 2: Lista de Personas & Check-in
    function renderGuestTable() {
        const tbody = document.getElementById('guest-list-body');
        if (!tbody) return;
        const filter = document.getElementById('filter-status') ? document.getElementById('filter-status').value : 'all';
        const searchQuery = document.getElementById('search-input') ? document.getElementById('search-input').value.toLowerCase() : '';
        tbody.innerHTML = '';

        if (persons.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #7b7893; padding: 20px;">La lista de personas se llenará automáticamente cuando las familias confirmen en la invitación.</td></tr>';
            return;
        }

        persons.forEach((p) => {
            if (filter === 'confirmados' && p.status !== 'confirmado') return;
            if (filter === 'pendientes' && p.status !== 'pendiente') return;
            if (filter === 'rechazados' && p.status !== 'rechazado') return;

            const matchesSearch = p.name.toLowerCase().includes(searchQuery) ||
                                  (p.family_name && p.family_name.toLowerCase().includes(searchQuery));

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

        tbody.querySelectorAll('.btn-checkin').forEach(btn => {
            btn.onclick = async (e) => {
                const id = e.target.getAttribute('data-id');
                const person = persons.find(p => p.id === id);
                if (person) {
                    const newCheckedState = !person.checked_in;
                    await supabaseClient.from('persons').update({ checked_in: newCheckedState }).eq('id', id);
                    fetchAllData();
                }
            };
        });

        tbody.querySelectorAll('.btn-delete').forEach(btn => {
            btn.onclick = async (e) => {
                const id = e.target.getAttribute('data-id');
                if (confirm('¿Eliminar a esta persona?')) {
                    await supabaseClient.from('persons').delete().eq('id', id);
                    fetchAllData();
                }
            };
        });
    }

    // Modal Crear Pase Familiar
    const modalFam = document.getElementById('modal-family');
    const btnOpenModalFam = document.getElementById('btn-open-modal-family');
    const btnCloseModalFam = document.getElementById('btn-close-modal-family');
    const formFamily = document.getElementById('form-family');

    if (btnOpenModalFam) btnOpenModalFam.onclick = () => modalFam.style.display = 'flex';
    if (btnCloseModalFam) btnCloseModalFam.onclick = () => modalFam.style.display = 'none';

    if (formFamily) {
        formFamily.onsubmit = async (e) => {
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

            await supabaseClient.from('families').insert(newFam);
            modalFam.style.display = 'none';
            formFamily.reset();
            fetchAllData();
        };
    }

    // Cargar Excel de Pases a Supabase
    const fileInput = document.getElementById('excel-file-input');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (evt) => {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                for (let idx = 0; idx < jsonData.length; idx++) {
                    const row = jsonData[idx];
                    await supabaseClient.from('families').insert({
                        id: 'fam_' + Date.now() + '_' + idx,
                        name: row['Familia'] || row['Nombre'] || 'Familia ' + (idx + 1),
                        phone: row['Telefono'] || row['Teléfono'] || '',
                        adults: parseInt(row['Adultos']) || 1,
                        kids: parseInt(row['Niños'] || row['Ninos']) || 0,
                        members: row['Nombres'] || row['Integrantes'] || '',
                        status: 'pendiente'
                    });
                }

                fetchAllData();
                alert(`¡Se cargaron ${jsonData.length} pases familiares en Supabase!`);
            };
            reader.readAsArrayBuffer(file);
        });
    }

    // Exportadores
    if (document.getElementById('btn-export-pases')) {
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
    }

    if (document.getElementById('btn-export-excel')) {
        document.getElementById('btn-export-excel').onclick = () => {
            const exportData = persons.map(p => ({
                'Nombre Persona': p.name,
                'Familia': p.family_name,
                'Asiste': p.status,
                'En Fiesta (Check-in)': p.checked_in ? 'Sí' : 'No'
            }));
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Personas Confirmadas");
            XLSX.writeFile(wb, "Lista_Personas_Evento.xlsx");
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
            container.innerHTML = '<small style="color: #1e824c;">No hay personas pendientes por sentar.</small>';
            return;
        }

        unassigned.forEach(p => {
            const card = document.createElement('div');
            card.className = 'guest-card';
            card.draggable = true;
            card.setAttribute('data-id', p.id);
            card.innerHTML = `<strong>${p.name}</strong> <small>${p.type || 'Adulto'} (${p.family_name || 'Familia'})</small>`;

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
        localStorage.setItem('franyeli_tables', JSON.stringify(tables));
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
                    title = `${assigned.name} (${assigned.family_name || ''}) - Clic para liberar`;
                }

                seatsHtml += `<div class="seat ${assigned ? 'occupied' : ''}" data-table="${t.id}" data-seat="${i}" data-person="${assigned ? assigned.id : ''}" title="${title}">${label}</div>`;
            }

            tableDiv.innerHTML = `
                <span class="table-label">${showTableNames ? t.name : ''}</span>
                <div class="seats-ring">${seatsHtml}</div>
            `;

            tableDiv.querySelectorAll('.seat').forEach(s => {
                s.addEventListener('dragover', (e) => e.preventDefault());
                s.addEventListener('drop', async (e) => {
                    e.preventDefault();
                    const tableId = s.getAttribute('data-table');
                    const seatNum = parseInt(s.getAttribute('data-seat'));

                    if (draggedPersonId) {
                        await supabaseClient
                            .from('persons')
                            .update({ table_id: tableId, seat: seatNum })
                            .eq('id', draggedPersonId);

                        draggedPersonId = null;
                        fetchAllData();
                    }
                });

                s.addEventListener('click', async () => {
                    const personId = s.getAttribute('data-person');
                    if (personId) {
                        const person = persons.find(p => p.id === personId);
                        if (person && confirm(`¿Deseas quitar a ${person.name} de esta mesa?`)) {
                            await supabaseClient
                                .from('persons')
                                .update({ table_id: null, seat: null })
                                .eq('id', personId);

                            fetchAllData();
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
                localStorage.setItem('franyeli_tables', JSON.stringify(tables));
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

    // Iniciar consulta de datos
    fetchAllData();
});
