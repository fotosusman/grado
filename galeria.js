/**
 * Galeria.js 
 * Logic for the Pixieset Style Gallery
 */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzHa-Maq1PaTZgZmUDOv4w5LFYgd8sdJ_XxXpB21SFlt5FJRM98lW6fkpWfCJoP-ITeyQ/exec";

document.addEventListener('DOMContentLoaded', () => {
    // Detectar parámetros en la URL (por si quieres pasar el ID del alumno)
    const urlParams = new URLSearchParams(window.location.search);
    const folderId = urlParams.get('id');
    const nombreAlumno = urlParams.get('nombre');

    if (nombreAlumno) {
        document.getElementById('hero-nombre').textContent = decodeURIComponent(nombreAlumno);
    }

    if (folderId) {
        cargarFotos(folderId);
    } else {
        console.warn("No se proporcionó un ID de carpeta en la URL.");
    }

    // Inicializar Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

async function cargarFotos(folderId) {
    const contenedor = document.getElementById('galeria');
    if (!contenedor) return;

    contenedor.innerHTML = '<p class="loading-text">Cargando fotografías...</p>';

    try {
        const response = await fetch(`${SCRIPT_URL}?action=getFotos&folderId=${folderId}`, {
            method: 'GET',
            redirect: 'follow'
        });
        const fotos = await response.json();
        
        mostrarFotos(fotos);
    } catch (error) {
        console.error("Error cargando fotos:", error);
        contenedor.innerHTML = '<p class="loading-text">Error al conectar con el servidor.</p>';
    }
}

function mostrarFotos(fotos) {
    const contenedor = document.getElementById('galeria');
    contenedor.innerHTML = '';

    if (!fotos || fotos.length === 0) {
        contenedor.innerHTML = '<p class="mensaje">No se encontraron fotos.</p>';
        return;
    }

    // Poner la primera foto como fondo del Hero
    const firstPhoto = fotos[0].url;
    const heroBg = document.getElementById('hero-bg');
    if (heroBg) {
        heroBg.style.backgroundImage = `url('${firstPhoto}')`;
    }

    fotos.forEach(foto => {
        const div = document.createElement('div');
        div.className = 'masonry-item reveal';

        const img = document.createElement('img');
        img.src = foto.url;
        img.alt = foto.nombre;
        img.loading = "lazy";

        div.appendChild(img);
        contenedor.appendChild(div);
    });

    // Re-inicializar animaciones
    setTimeout(reveal, 100);
}

// Función simple de Scroll Reveal
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

window.addEventListener("scroll", reveal);

// Manejo de descarga ZIP (si se implementa)
async function descargarZip(folderId) {
    // Lógica similar a script.js para descargar el archivo ZIP
    console.log("Iniciando descarga ZIP para:", folderId);
}
