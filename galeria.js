/**
 * Galeria.js 
 * Logic for the Pixieset Style Gallery
 * Flujo: Colegio → Nombre → Clave → Galería con portada al azar
 */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxmnIuhKNDjRjIip4VXT7fBgAr8ac-5HbnFzRfu3mLqWAAkAQS7MEqsm4vB-4NPSRLcig/exec";

let CURRENT_USER_NAME = "";
let todosLosAlumnos = [];

// 1. Al cargar la página
window.onload = async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const usuarioUrl = urlParams.get('user');
    const colegioUrl = urlParams.get('colegio');
    const claveUrl = urlParams.get('clave');

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Si vienen los 3 parámetros desde index.html → auto-login directo
    if (usuarioUrl && colegioUrl && claveUrl) {
        CURRENT_USER_NAME = usuarioUrl;
        document.getElementById('hero-nombre').textContent = "Cargando...";
        document.getElementById('statusMsg').textContent = "Verificando acceso...";

        // Cargar alumnos y auto-autenticar
        await cargarColegiosYAlumnos();
        await autoLogin(colegioUrl, usuarioUrl, claveUrl);
        return;
    }

    // Si solo viene user= (desde WhatsApp), preconfigurar
    if (usuarioUrl) {
        CURRENT_USER_NAME = usuarioUrl;
        preconfigurarDesdeURL(usuarioUrl);
    }

    // Cargar colegios para el formulario manual
    cargarColegiosYAlumnos();
};

// 2. Cargar colegios y alumnos desde el backend
async function cargarColegiosYAlumnos() {
    const select = document.getElementById('colegio');
    const inputNombre = document.getElementById('nombre');
    if (!select) return;

    try {
        const response = await fetch(`${SCRIPT_URL}?action=getAlumnos`, {
            method: 'GET',
            redirect: 'follow'
        });
        const alumnos = await response.json();
        todosLosAlumnos = alumnos;

        // Extraer colegios únicos
        const colegios = [...new Set(alumnos.map(a => a.colegio.trim()))];

        select.innerHTML = '<option value="" disabled selected>Selecciona tu colegio</option>';
        colegios.forEach(col => {
            const opt = document.createElement('option');
            opt.value = col;
            opt.textContent = col;
            select.appendChild(opt);
        });

        // Escuchar cambios en el select para filtrar nombres
        select.addEventListener('change', () => {
            filtrarNombresPorColegio(select.value);
        });

        // Si venía por URL, intentar preseleccionar
        if (CURRENT_USER_NAME) {
            const alumnoEncontrado = alumnos.find(a => 
                a.nombre.replace(/\s+/g, '').toLowerCase() === CURRENT_USER_NAME.replace(/\s+/g, '').toLowerCase()
            );
            if (alumnoEncontrado) {
                // Preseleccionar colegio
                select.value = alumnoEncontrado.colegio.trim();
                filtrarNombresPorColegio(alumnoEncontrado.colegio.trim());
                // Preseleccionar nombre
                if (inputNombre) {
                    inputNombre.value = alumnoEncontrado.nombre.trim();
                }
                // Mostrar nombre en hero
                document.getElementById('hero-nombre').textContent = alumnoEncontrado.nombre;
            }
        }

    } catch (error) {
        console.error("Error cargando colegios:", error);
        select.innerHTML = '<option value="" disabled selected>Error al cargar colegios</option>';
    }
}

// Preconfigurar desde URL (portada y nombre)
async function preconfigurarDesdeURL(nombreUrl) {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getCover&id=${nombreUrl}`);
        const data = await response.json();

        if (data.nombre) {
            document.getElementById('hero-nombre').textContent = data.nombre;

            if (data.idPortada) {
                const imgUrl = `https://drive.google.com/uc?export=view&id=${data.idPortada}`;
                document.getElementById('hero-bg').style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${imgUrl}')`;
            }
        }
    } catch (error) {
        console.error("Error al configurar portada:", error);
    }
}

// Poblar el datalist de nombres filtrado por el colegio seleccionado
function filtrarNombresPorColegio(colegioSeleccionado) {
    const datalist = document.getElementById('alumnos-list');
    const inputNombre = document.getElementById('nombre');
    if (!datalist || !inputNombre) return;

    // Habilitar el input de nombre
    inputNombre.disabled = false;
    inputNombre.placeholder = 'Escribe tu nombre...';

    // Limpiar datalist
    datalist.innerHTML = '';
    
    // Si no venía preconfigurado, limpiar el input
    if (!CURRENT_USER_NAME) {
        inputNombre.value = '';
    }

    // Filtrar alumnos del colegio seleccionado
    const alumnosFiltrados = todosLosAlumnos.filter(
        a => a.colegio.trim() === colegioSeleccionado.trim()
    );

    // Agregar opciones al datalist
    alumnosFiltrados.forEach(a => {
        const option = document.createElement('option');
        option.value = a.nombre.trim();
        datalist.appendChild(option);
    });

    console.log(`Autocompletado: ${alumnosFiltrados.length} alumnos para "${colegioSeleccionado}"`);
}

// Auto-login cuando viene redirigido desde index.html con los 3 parámetros
async function autoLogin(colegio, userSinEspacios, clave) {
    const statusMsg = document.getElementById('statusMsg');

    try {
        // Buscar el alumno en los datos ya cargados
        const alumno = todosLosAlumnos.find(a =>
            a.colegio.trim() === decodeURIComponent(colegio).trim() &&
            a.nombre.replace(/\s+/g, '').toLowerCase() === userSinEspacios.replace(/\s+/g, '').toLowerCase() &&
            String(a.clave).trim() === decodeURIComponent(clave).trim()
        );

        if (alumno) {
            statusMsg.textContent = "¡Bienvenido!";
            statusMsg.className = "status-message success";

            // Mostrar nombre en hero
            document.getElementById('hero-nombre').textContent = alumno.nombre;

            // Ocultar formulario de login
            document.getElementById('login-box').style.display = 'none';

            // Cargar portada al azar
            await cargarPortadaAlAzar(alumno.idGaleria);

            // Minimizar hero y mostrar galería
            document.getElementById('hero-pixieset').classList.add('minimized');
            document.getElementById('galeria-section').classList.remove('hidden');

            const btnZip = document.getElementById('btn-descarga-zip');
            if (btnZip && alumno.idGaleria) {
                btnZip.style.display = 'inline-flex';
            }

            // Cargar fotos
            cargarFotos(alumno.idGaleria);
        } else {
            // Si los datos no coinciden, mostrar el formulario manual
            statusMsg.textContent = "Los datos no coinciden. Intenta de nuevo.";
            statusMsg.className = "status-message error";
            document.getElementById('hero-nombre').textContent = "Galería Privada";
        }
    } catch (error) {
        console.error("Error en auto-login:", error);
        statusMsg.textContent = "Error de conexión.";
        statusMsg.className = "status-message error";
        document.getElementById('hero-nombre').textContent = "Galería Privada";
    }
}

// 3. Función login (manual desde el formulario de Galeria.html)
async function login() {
    const colegio = document.getElementById('colegio').value;
    const nombre = document.getElementById('nombre').value;
    const clave = document.getElementById('clave').value;
    const statusMsg = document.getElementById('statusMsg');

    if (!colegio || !nombre || !clave) {
        statusMsg.textContent = "Por favor, completa todos los campos.";
        statusMsg.className = "status-message error";
        return;
    }

    statusMsg.textContent = "Verificando...";
    statusMsg.className = "status-message";

    try {
        // Buscar el alumno en los datos ya cargados (evita otra llamada al servidor)
        const alumno = todosLosAlumnos.find(a =>
            a.colegio.trim() === colegio.trim() &&
            a.nombre.trim().toLowerCase() === nombre.trim().toLowerCase() &&
            String(a.clave).trim() === clave.trim()
        );

        if (alumno) {
            statusMsg.textContent = "¡Bienvenido!";
            statusMsg.className = "status-message success";

            // Cargar una foto al azar como portada del hero
            await cargarPortadaAlAzar(alumno.idGaleria);

            // Minimizar hero y mostrar galería
            setTimeout(() => {
                document.getElementById('login-box').style.display = 'none';
                document.getElementById('hero-pixieset').classList.add('minimized');
                document.getElementById('galeria-section').classList.remove('hidden');

                const btnZip = document.getElementById('btn-descarga-zip');
                if (btnZip && alumno.idGaleria) {
                    btnZip.style.display = 'inline-flex';
                }
            }, 800);

            // Mostrar nombre en hero
            document.getElementById('hero-nombre').textContent = alumno.nombre;

            // Cargar fotos
            cargarFotos(alumno.idGaleria);

        } else {
            statusMsg.textContent = "Datos incorrectos. Verifica tu colegio, nombre o clave.";
            statusMsg.className = "status-message error";
        }
    } catch (error) {
        console.error("Error en login:", error);
        statusMsg.textContent = "Error de conexión.";
        statusMsg.className = "status-message error";
    }
}

// Cargar una foto al azar de la carpeta del alumno como portada del hero
async function cargarPortadaAlAzar(folderId) {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getFotos&folderId=${folderId}`);
        const text = await response.text();
        const fotos = JSON.parse(text);

        if (fotos && fotos.length > 0) {
            // Seleccionar una foto al azar
            const fotoRandom = fotos[Math.floor(Math.random() * fotos.length)];
            const imgUrl = fotoRandom.url;
            document.getElementById('hero-bg').style.backgroundImage = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url('${imgUrl}')`;
            document.getElementById('hero-bg').style.transition = 'background-image 1.5s ease';
        }
    } catch (error) {
        console.error("Error cargando portada al azar:", error);
    }
}

async function cargarFotos(folderId) {
    const contenedor = document.getElementById('galeria');
    contenedor.innerHTML = '<p class="loading-text">Cargando fotografías...</p>';

    try {
        const response = await fetch(`${SCRIPT_URL}?action=getFotos&folderId=${folderId}`);
        const text = await response.text();
        const fotos = JSON.parse(text);
        mostrarFotos(fotos);
    } catch (error) {
        console.error("Error cargando fotos:", error);
        contenedor.innerHTML = '<p>Error al cargar las imágenes.</p>';
    }
}

function mostrarFotos(fotos) {
    const contenedor = document.getElementById('galeria');
    contenedor.innerHTML = '';

    if (!fotos || fotos.length === 0) {
        contenedor.innerHTML = '<p>No se encontraron fotos.</p>';
        return;
    }

    fotos.forEach((foto, index) => {
        const div = document.createElement('div');
        div.className = 'masonry-item reveal';
        div.style.transitionDelay = `${index * 0.05}s`;

        const img = document.createElement('img');
        img.src = foto.url;
        img.alt = foto.nombre;
        img.loading = "lazy";

        div.appendChild(img);
        contenedor.appendChild(div);
    });

    setTimeout(reveal, 100);
}

function reveal() {
    const reveals = document.querySelectorAll(".reveal");
    for (let i = 0; i < reveals.length; i++) {
        const windowHeight = window.innerHeight;
        const elementTop = reveals[i].getBoundingClientRect().top;
        if (elementTop < windowHeight - 100) {
            reveals[i].classList.add("active");
        }
    }
}

window.addEventListener("scroll", reveal);

async function descargarTodasLasFotos() {
    const fotos = document.querySelectorAll('#galeria img');
    if (fotos.length === 0) {
        alert("No hay fotos para descargar.");
        return;
    }

    const btn = document.getElementById('btn-descarga-zip');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Descargando...';
    btn.disabled = true;

    for (let i = 0; i < fotos.length; i++) {
        const urlBase = fotos[i].src;
        // Si es una URL de Drive, cambiar export=view a export=download
        const downloadUrl = urlBase.replace('export=view', 'export=download');
        
        try {
            const response = await fetch(downloadUrl);
            const blob = await response.blob();
            const objectUrl = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = `foto_${i + 1}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(objectUrl);
            
            // Pausa para no saturar el navegador y permitir descarga múltiple
            await new Promise(r => setTimeout(r, 600));
        } catch(e) {
            console.error("Error descargando la foto " + (i+1), e);
            // Fallback: abrir en nueva pestaña si falla el fetch por CORS
            window.open(downloadUrl, '_blank');
        }
    }

    btn.innerHTML = originalText;
    btn.disabled = false;
    alert("Descargas iniciadas.");
}
