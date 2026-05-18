// 1. URL de tu implementación (Actualizada a tu enlace más reciente)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzHa-Maq1PaTZgZmUDOv4w5LFYgd8sdJ_XxXpB21SFlt5FJRM98lW6fkpWfCJoP-ITeyQ/exec";

// Variable global para almacenar todos los alumnos (evita llamadas repetidas)
let todosLosAlumnos = [];

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarColegiosYAlumnos();
    reveal();
    initParallax();

    // Inicializar iconos de Lucide si están disponibles
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// Función para mostrar las fotos en el HTML
function mostrarFotos(fotos) {
    const contenedor = document.getElementById('galeria');
    contenedor.innerHTML = ''; // Limpiar mensaje de carga

    if (!fotos || fotos.length === 0) {
        contenedor.innerHTML = '<p class="mensaje">No se encontraron fotos en tu carpeta.</p>';
        return;
    }

    fotos.forEach(foto => {
        const urlVisualizacion = foto.url;

        const div = document.createElement('div');
        div.className = 'masonry-item reveal';

        const img = document.createElement('img');
        img.src = urlVisualizacion;
        img.alt = foto.nombre || "Foto de galería";
        img.loading = "lazy";

        div.appendChild(img);
        contenedor.appendChild(div);
    });

    // Re-activar animaciones para las fotos cargadas
    setTimeout(reveal, 100);
}

// Función de Login
async function login() {
    const colegio = document.getElementById('colegio').value;
    const nombre = document.getElementById('nombre').value;
    const clave = document.getElementById('clave').value;
    const btnText = document.getElementById('btnEntrarText');

    if (!colegio || !nombre || !clave) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    console.log("Intentando conectar con Apps Script...");
    if (btnText) btnText.textContent = "Validando...";

    try {
        const response = await fetch(`${SCRIPT_URL}?action=getAlumnos`, {
            method: 'GET',
            redirect: 'follow'
        });
        const alumnos = await response.json();

        // Buscamos al alumno ignorando espacios extras
        const alumno = alumnos.find(a =>
            a.colegio.trim() === colegio.trim() &&
            a.nombre.trim().toLowerCase() === nombre.trim().toLowerCase() &&
            a.clave.toString().trim() === clave.trim()
        );

        if (alumno) {
            console.log("Login exitoso para:", alumno.nombre);
            // CORRECCIÓN: Usar classList en vez de style.display
            // porque .hidden usa !important y bloquea el inline style
            document.getElementById('login-section').classList.add('hidden');
            document.getElementById('galeria-section').classList.remove('hidden');
            document.getElementById('nombre-usuario').textContent = alumno.nombre;

            // Cargamos las fotos usando el idGaleria registrado en el Excel
            cargarFotos(alumno.idGaleria);

            // Configurar botones de descarga con la carpeta ZIP del alumno
            const btnDownload = document.getElementById('btnDownloadAll');
            const btnDownloadBottom = document.getElementById('btnDownloadBottom');
            if (alumno.idDescarga) {
                const descargaFn = () => descargarZip(alumno.idDescarga);
                if (btnDownload) btnDownload.onclick = descargaFn;
                if (btnDownloadBottom) btnDownloadBottom.onclick = descargaFn;
                console.log("Botones de descarga configurados con folder:", alumno.idDescarga);
            }

            // Re-inicializar iconos de Lucide para el botón inferior
            if (typeof lucide !== 'undefined') lucide.createIcons();

            // Scroll suave a la galería
            setTimeout(() => {
                document.getElementById('galeria-section').scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            alert("Datos incorrectos. Verifica tu colegio, nombre o clave.");
        }
    } catch (error) {
        console.error("Error en el login:", error);
        alert("Error de conexión. Revisa que el ID del Script sea correcto.");
    } finally {
        if (btnText) btnText.textContent = "Entrar a mi galería";
    }
}

// Función para descargar todas las fotos (foto por foto) sin crear ZIP
async function descargarZip(folderId) {
    const btnDownload = document.getElementById('btnDownloadAll');
    const btnDownloadBottom = document.getElementById('btnDownloadBottom');
    const originalText = btnDownload ? btnDownload.innerHTML : '';
    const originalBottomText = btnDownloadBottom ? btnDownloadBottom.innerHTML : '';

    try {
        if (btnDownload) btnDownload.innerHTML = '<i data-lucide="loader" class="spin"></i> Descargando...';
        if (btnDownloadBottom) btnDownloadBottom.innerHTML = '<i data-lucide="loader" class="spin"></i> Descargando...';
        if (typeof lucide !== 'undefined') lucide.createIcons();

        const fotos = document.querySelectorAll('#galeria img');
        if (fotos.length === 0) {
            alert("No hay fotos para descargar.");
            return;
        }

        for (let i = 0; i < fotos.length; i++) {
            const urlBase = fotos[i].src;
            const downloadUrl = urlBase.replace('export=view', 'export=download');
            
            try {
                const res = await fetch(downloadUrl);
                const blob = await res.blob();
                const objectUrl = window.URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = objectUrl;
                a.download = `foto_${i + 1}.jpg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(objectUrl);
                
                // Pausa para que el navegador procese cada descarga
                await new Promise(r => setTimeout(r, 600));
            } catch(e) {
                console.error("Error descargando:", e);
                // Fallback: intentar abrir en otra pestaña
                window.open(downloadUrl, '_blank');
            }
        }
        alert("Descargas iniciadas.");

    } catch (error) {
        console.error("Error descargando fotos:", error);
        alert("Error al intentar descargar. Intenta de nuevo.");
    } finally {
        if (btnDownload) btnDownload.innerHTML = originalText;
        if (btnDownloadBottom) btnDownloadBottom.innerHTML = originalBottomText;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// Función para solicitar las fotos al servidor
async function cargarFotos(folderId) {
    console.log("Iniciando carga de fotos para el folder:", folderId);
    const contenedor = document.getElementById('galeria');

    // Mostrar skeleton de carga mientras se obtienen las fotos
    contenedor.innerHTML = `
        <div class="loading-skeleton">
            <div class="skeleton-card"></div>
            <div class="skeleton-card tall"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card tall"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
        </div>
        <p class="loading-text">Cargando tu galería<span class="dots"></span></p>
    `;

    try {
        const response = await fetch(`${SCRIPT_URL}?action=getFotos&folderId=${folderId}`, {
            method: 'GET',
            redirect: 'follow'
        });
        const fotos = await response.json();
        console.log("Fotos recibidas del servidor:", fotos);
        mostrarFotos(fotos);
    } catch (error) {
        console.error("Error cargando fotos:", error);
        contenedor.innerHTML = '<p class="loading-text">Error al cargar las imágenes. Intenta más tarde.</p>';
    }
}

// --- FUNCIONES DE SOPORTE (Animaciones y UI) ---

async function cargarColegiosYAlumnos() {
    const select = document.getElementById('colegio');
    if (!select) return;

    try {
        const response = await fetch(`${SCRIPT_URL}?action=getAlumnos`, {
            method: 'GET',
            redirect: 'follow'
        });
        const alumnos = await response.json();

        // Guardar todos los alumnos en variable global
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

    } catch (error) {
        console.error("Error cargando colegios:", error);
        select.innerHTML = '<option value="" disabled selected>Error al cargar colegios</option>';
    }
}

// Poblar el datalist de nombres filtrado por el colegio seleccionado
function filtrarNombresPorColegio(colegioSeleccionado) {
    const datalist = document.getElementById('alumnos-list');
    const inputNombre = document.getElementById('nombre');
    if (!datalist || !inputNombre) return;

    // Limpiar datalist y el input
    datalist.innerHTML = '';
    inputNombre.value = '';
    inputNombre.placeholder = 'Escribe tu nombre...';

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

function reveal() {
    const reveals = document.querySelectorAll(".reveal");
    for (let i = 0; i < reveals.length; i++) {
        const windowHeight = window.innerHeight;
        const elementTop = reveals[i].getBoundingClientRect().top;
        const elementVisible = 100;
        if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add("active");
        }
    }
}

function initParallax() {
    const parallaxImg = document.querySelector('.parallax-img');
    if (parallaxImg) {
        window.addEventListener('scroll', () => {
            const scrollPos = window.scrollY;
            parallaxImg.style.transform = `translateY(${scrollPos * 0.4}px)`;
        });
    }

    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        window.addEventListener('scroll', () => {
            const scrollPos = window.scrollY;
            const threshold = window.innerHeight * 0.3;
            let opacity = 1 - (scrollPos / threshold);
            if (opacity < 0) opacity = 0;
            heroTitle.style.opacity = opacity;
        });
    }
}

window.addEventListener("scroll", reveal);