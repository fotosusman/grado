/**
 * Galeria.js 
 * Logic for the Pixieset Style Gallery
 * Direct access using the URL parameter ?user=Name
 */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxmnIuhKNDjRjIip4VXT7fBgAr8ac-5HbnFzRfu3mLqWAAkAQS7MEqsm4vB-4NPSRLcig/exec";

// 1. Al cargar la página
window.onload = async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const usuarioUrl = urlParams.get('user');

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    if (!usuarioUrl) {
        // Si no viene ningún usuario en la URL, redirigir a index.html
        window.location.href = 'index.html';
        return;
    }

    // Cargar la galería del alumno directamente
    await inicializarGaleria(usuarioUrl);
};

// Inicializa la galería cargando los datos del alumno y sus fotos
async function inicializarGaleria(userSinEspacios) {
    const heroNombre = document.getElementById('hero-nombre');
    const statusMsg = document.getElementById('statusMsg');

    try {
        // 1. Obtener la lista de alumnos para buscar su idGaleria y nombre real
        const response = await fetch(`${SCRIPT_URL}?action=getAlumnos`, {
            method: 'GET',
            redirect: 'follow'
        });
        const alumnos = await response.json();

        // Buscar el alumno ignorando espacios y mayúsculas
        const alumno = alumnos.find(a =>
            a.nombre.replace(/\s+/g, '').toLowerCase() === userSinEspacios.replace(/\s+/g, '').toLowerCase()
        );

        if (alumno && alumno.idGaleria) {
            // Mostrar nombre real del alumno en el Hero
            heroNombre.textContent = alumno.nombre;
            statusMsg.textContent = "Cargando fotografías...";

            // 2. Cargar las fotos de su galería
            await cargarFotos(alumno.idGaleria);

        } else {
            heroNombre.textContent = "Galería no encontrada";
            statusMsg.textContent = "Verifica que el enlace sea correcto o inicia sesión desde la página principal.";
        }

    } catch (error) {
        console.error("Error al inicializar la galería:", error);
        heroNombre.textContent = "Error de conexión";
        statusMsg.textContent = "No pudimos conectar con el servidor. Revisa tu conexión a internet.";
    }
}

// Solicita las fotos al servidor y las renderiza
async function cargarFotos(folderId) {
    const contenedor = document.getElementById('galeria');
    const statusMsg = document.getElementById('statusMsg');

    try {
        const response = await fetch(`${SCRIPT_URL}?action=getFotos&folderId=${folderId}`);
        const text = await response.text();
        const fotos = JSON.parse(text);

        if (fotos && fotos.length > 0) {
            // 1. Cargar una foto al azar como portada del hero
            const fotoRandom = fotos[Math.floor(Math.random() * fotos.length)];
            const imgUrl = fotoRandom.url;
            document.getElementById('hero-bg').style.backgroundImage = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url('${imgUrl}')`;
            document.getElementById('hero-bg').style.transition = 'background-image 1.5s ease';

            // Ocultar mensaje de carga / estado
            statusMsg.style.display = 'none';

            // 2. Mostrar todas las fotos en el grid
            mostrarFotos(fotos);

            // Mostrar el botón de descarga
            const btnZip = document.getElementById('btn-descarga-zip');
            if (btnZip) {
                btnZip.style.display = 'inline-flex';
            }
        } else {
            contenedor.innerHTML = '<p class="loading-text">No se encontraron fotografías en tu carpeta de Google Drive.</p>';
            statusMsg.textContent = "Carpeta vacía";
        }
    } catch (error) {
        console.error("Error cargando fotos:", error);
        contenedor.innerHTML = '<p class="loading-text">Error al cargar las imágenes.</p>';
        statusMsg.textContent = "Error al leer archivos";
    }
}

function mostrarFotos(fotos) {
    const contenedor = document.getElementById('galeria');
    contenedor.innerHTML = '';

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

// Descarga secuencial de todas las fotos
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
