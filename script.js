// 1. URL de tu implementación (Actualizada a tu enlace más reciente)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzHa-Maq1PaTZgZmUDOv4w5LFYgd8sdJ_XxXpB21SFlt5FJRM98lW6fkpWfCJoP-ITeyQ/exec";

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarColegios();
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
        // CORRECCIÓN: Se construye la URL usando el ID del archivo de Google Drive
        const urlVisualizacion = `https://drive.google.com/uc?export=view&id=${foto.id}`;

        const div = document.createElement('div');
        div.className = 'masonry-item reveal';

        const img = document.createElement('img');
        img.src = urlVisualizacion; 
        img.alt = foto.nombre || "Foto de galería";
        img.loading = "lazy"; 

        const overlay = document.createElement('div');
        overlay.className = 'masonry-overlay';
        
        const link = document.createElement('a');
        link.href = urlVisualizacion;
        link.target = "_blank";
        link.className = "btn-outline-white";
        link.style.padding = "10px 20px";
        link.style.fontSize = "0.8rem";
        link.textContent = 'Ver pantalla completa';

        overlay.appendChild(link);
        div.appendChild(img);
        div.appendChild(overlay);
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
            document.getElementById('login-section').style.display = 'none';
            document.getElementById('galeria-section').style.display = 'block';
            document.getElementById('nombre-usuario').textContent = alumno.nombre;

            // Cargamos las fotos usando el idGaleria registrado en el Excel
            cargarFotos(alumno.idGaleria);
            
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

// Función para solicitar las fotos al servidor
async function cargarFotos(folderId) {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getFotos&folderId=${folderId}`, {
            method: 'GET',
            redirect: 'follow'
        });
        const fotos = await response.json();
        mostrarFotos(fotos);
    } catch (error) {
        console.error("Error cargando fotos:", error);
        const contenedor = document.getElementById('galeria');
        contenedor.innerHTML = '<p>Error al cargar las imágenes. Intenta más tarde.</p>';
    }
}

// --- FUNCIONES DE SOPORTE (Animaciones y UI) ---

async function cargarColegios() {
    const select = document.getElementById('colegio');
    if (!select) return;

    try {
        const response = await fetch(`${SCRIPT_URL}?action=getAlumnos`);
        const alumnos = await response.json();
        
        // Extraer colegios únicos
        const colegios = [...new Set(alumnos.map(a => a.colegio.trim()))];
        
        select.innerHTML = '<option value="" disabled selected>Selecciona tu colegio</option>';
        colegios.forEach(col => {
            const opt = document.createElement('option');
            opt.value = col;
            opt.textContent = col;
            select.appendChild(opt);
        });
    } catch (error) {
        console.error("Error cargando colegios:", error);
        select.innerHTML = '<option value="" disabled selected>Error al cargar colegios</option>';
    }
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