/**
 * Galeria.js 
 * Logic for the Pixieset Style Gallery
 */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxmnIuhKNDjRjIip4VXT7fBgAr8ac-5HbnFzRfu3mLqWAAkAQS7MEqsm4vB-4NPSRLcig/exec";

let CURRENT_USER_NAME = "";

// 1. Al cargar la página
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const usuarioUrl = urlParams.get('user');

    if (usuarioUrl) {
        CURRENT_USER_NAME = usuarioUrl;
        configurarPortadaDirecta(usuarioUrl);
    } else {
        document.getElementById('hero-nombre').textContent = "Galería Privada";
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
};

// 2. Configura la portada
async function configurarPortadaDirecta(nombreUrl) {
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

// 3. Función login (ahora se llama login() según el nuevo HTML)
async function login() {
    const clave = document.getElementById('clave').value;
    const statusMsg = document.getElementById('statusMsg');

    if (!clave) {
        statusMsg.textContent = "Por favor, introduce tu clave.";
        return;
    }

    statusMsg.textContent = "Verificando...";

    try {
        const response = await fetch(`${SCRIPT_URL}?action=getAlumnos`);
        const text = await response.text();
        const alumnos = JSON.parse(text);

        // Buscamos al alumno por el nombre que viene en la URL y la clave
        const alumno = alumnos.find(a => 
            a.nombre.replace(/\s+/g, '').toLowerCase() === CURRENT_USER_NAME.replace(/\s+/g, '').toLowerCase() && 
            String(a.clave) === clave
        );

        if (alumno) {
            statusMsg.textContent = "¡Bienvenido!";
            
            // Ocultar hero-full y mostrar galería
            document.getElementById('hero-pixieset').classList.add('minimized');
            document.getElementById('galeria-section').classList.remove('hidden');
            
            cargarFotos(alumno.idGaleria);
            
            const btnZip = document.getElementById('btn-descarga-zip');
            if (btnZip && alumno.idGaleria) {
                btnZip.style.display = 'inline-flex';
            }

        } else {
            statusMsg.textContent = "Clave incorrecta.";
        }
    } catch (error) {
        console.error("Error en login:", error);
        statusMsg.textContent = "Error de conexión.";
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
