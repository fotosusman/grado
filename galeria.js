/**
 * Galeria.js 
 * Logic for the Pixieset Style Gallery
 */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxmnIuhKNDjRjIip4VXT7fBgAr8ac-5HbnFzRfu3mLqWAAkAQS7MEqsm4vB-4NPSRLcig/exec";

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
        const text = await response.text();
        const fotos = JSON.parse(text);

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
// Al cargar la página, revisa si hay un usuario en el link
window.onload = function () {
    const urlParams = new URLSearchParams(window.location.search);
    const usuarioLink = urlParams.get('user'); // Lee lo que sigue de ?user=

    if (usuarioLink) {
        autoLogin(usuarioLink);
    }
};

async function autoLogin(nombreUrl) {
    console.log("Iniciando sesión automática para:", nombreUrl);

    const cacheBuster = "&t=" + new Date().getTime();
    const url = `${SCRIPT_URL}?action=getAlumnos${cacheBuster}`;

    try {
        // Petición ultra-simple para evitar pre-checks del navegador
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow'
        });
        
        if (!response.ok) throw new Error('Error en el servidor');
        
        // Leemos como texto y parseamos después para mayor compatibilidad
        const text = await response.text();
        const alumnos = JSON.parse(text);

        const alumno = alumnos.find(a =>
            a.nombre.replace(/\s+/g, '').toLowerCase() === nombreUrl.toLowerCase()
        );

        if (alumno) {
            const loginSec = document.getElementById('login-section');
            const galSec = document.getElementById('galeria-section');
            if (loginSec) loginSec.style.display = 'none';
            if (galSec) galSec.style.display = 'block';
            
            const userLabel = document.getElementById('nombre-usuario');
            if (userLabel) userLabel.textContent = alumno.nombre;

            cargarPortadaPixieset(alumno.nombre);
            cargarFotos(alumno.idGaleria);
        } else {
            console.warn("Alumno no encontrado:", nombreUrl);
        }
    } catch (error) {
        console.error("Error en auto-login:", error);
    }
}



async function cargarPortadaPixieset(nombreUrl) {
    // Usamos la misma variable global SCRIPT_URL
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getCover&id=${nombreUrl}`, {
            method: 'GET',
            redirect: 'follow'
        });

        const text = await response.text();
        const data = JSON.parse(text);

        if (data.nombre) {

            console.log("Datos recibidos correctamente:", data);
            
            // 1. Cambiamos el texto del nombre
            document.getElementById('hero-nombre').textContent = data.nombre;
            
            // 2. Cargamos la imagen de fondo si existe ID en columna G
            if (data.idPortada) {
                const imgUrl = `https://drive.google.com/uc?export=view&id=${data.idPortada}`;
                document.getElementById('hero-bg').style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${imgUrl}')`;
            }
        }
    } catch (error) {
        console.error("Error cargando portada:", error);
    }
}

