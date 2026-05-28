/**
 * Galeria.js
 * Logic for the Pixieset Style Gallery using Supabase Storage.
 * Direct access using the URL parameter ?user=Name
 */

const SUPABASE_URL = "https://dtoniylozbflssbaoixl.supabase.co";
const SUPABASE_KEY = "sb_publishable_x2rHkO--OxlC2bNVqrcPeA_0cMp9sXT";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let currentRutaCarpeta = '';

window.onload = async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const usuarioUrl = urlParams.get('user');

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    if (!usuarioUrl) {
        window.location.href = 'index.html';
        return;
    }

    await inicializarGaleria(usuarioUrl);
};

async function inicializarGaleria(userSinEspacios) {
    const heroNombre = document.getElementById('hero-nombre');
    const statusMsg = document.getElementById('statusMsg');

    try {
        const { data: alumnos, error } = await _supabase
            .from('alumnos')
            .select('*');

        if (error) throw error;

        const alumno = alumnos.find(a =>
            a.nombre.replace(/\s+/g, '').toLowerCase() === userSinEspacios.replace(/\s+/g, '').toLowerCase()
        );

        if (!alumno) {
            heroNombre.textContent = 'Galería no encontrada';
            statusMsg.textContent = 'Verifica que el enlace sea correcto o inicia sesión desde la página principal.';
            return;
        }

        heroNombre.textContent = alumno.nombre;
        statusMsg.textContent = 'Cargando fotografías...';

        await cargarFotos(alumno);
    } catch (error) {
        console.error('Error al inicializar la galería:', error);
        heroNombre.textContent = 'Error de conexión';
        statusMsg.textContent = 'No pudimos conectar con el servidor. Revisa tu conexión a internet.';
    }
}

async function cargarFotos(alumno) {
    const contenedor = document.getElementById('galeria');
    const statusMsg = document.getElementById('statusMsg');
    const heroBg = document.getElementById('hero-bg');
    const rutaCarpeta = `${alumno.colegio.toLowerCase().replace(/\s+/g, '-')}/${alumno.id_galeria}`;
    currentRutaCarpeta = rutaCarpeta;

    try {
        const { data: archivos, error } = await _supabase
            .storage
            .from('galerias')
            .list(rutaCarpeta);

        if (error) throw error;
        contenedor.innerHTML = '';

        if (!archivos || archivos.length === 0) {
            contenedor.innerHTML = '<p class="loading-text">No se encontraron fotografías en esta galería.</p>';
            statusMsg.textContent = 'Carpeta vacía';
            return;
        }

        const portada = archivos.find(file => file.name.toLowerCase() === 'portada.jpg');
        if (portada && heroBg) {
            const { data } = _supabase.storage.from('galerias').getPublicUrl(`${rutaCarpeta}/portada.jpg`);
            if (data && data.publicUrl) {
                heroBg.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url('${data.publicUrl}')`;
                heroBg.style.backgroundSize = 'cover';
            }
        }

        const fotos = archivos.filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file.name) && file.name.toLowerCase() !== 'portada.jpg');

        if (fotos.length === 0) {
            contenedor.innerHTML = '<p class="loading-text">No se encontraron fotografías válidas para mostrar.</p>';
            statusMsg.textContent = 'Carpeta sin fotos visibles';
            return;
        }

        statusMsg.style.display = 'none';
        mostrarFotos(fotos, rutaCarpeta);

        const zipFile = archivos.find(file => file.name.toLowerCase() === 'todo.zip');
        const btnZip = document.getElementById('btn-descarga-zip');
        if (btnZip) {
            if (zipFile) {
                btnZip.style.display = 'inline-flex';
                btnZip.onclick = () => descargarZip(rutaCarpeta);
            } else {
                btnZip.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error cargando fotos:', error);
        contenedor.innerHTML = '<p class="loading-text">Error al cargar las imágenes.</p>';
        statusMsg.textContent = 'Error al leer archivos';
    }
}

function mostrarFotos(fotos, rutaCarpeta) {
    const contenedor = document.getElementById('galeria');
    contenedor.innerHTML = '';

    fotos.forEach((foto, index) => {
        const div = document.createElement('div');
        div.className = 'masonry-item reveal';
        div.style.transitionDelay = `${index * 0.05}s`;

        const img = document.createElement('img');
        const { data } = _supabase.storage.from('galerias').getPublicUrl(`${rutaCarpeta}/${foto.name}`);
        img.src = data && data.publicUrl ? data.publicUrl : '';
        img.alt = foto.name;
        img.loading = 'lazy';

        div.appendChild(img);
        contenedor.appendChild(div);
    });

    setTimeout(reveal, 100);
}

function reveal() {
    const reveals = document.querySelectorAll('.reveal');
    for (let i = 0; i < reveals.length; i++) {
        const windowHeight = window.innerHeight;
        const elementTop = reveals[i].getBoundingClientRect().top;
        if (elementTop < windowHeight - 100) {
            reveals[i].classList.add('active');
        }
    }
}

window.addEventListener('scroll', reveal);

function descargarZip(rutaCarpeta) {
    const { data } = _supabase.storage.from('galerias').getPublicUrl(`${rutaCarpeta}/todo.zip`);
    if (data && data.publicUrl) {
        window.open(data.publicUrl, '_blank');
    } else {
        alert('No se encontró el archivo todo.zip en esta galería.');
    }
}

function descargarTodasLasFotos() {
    if (!currentRutaCarpeta) {
        alert('No hay una galería activa para descargar.');
        return;
    }
    descargarZip(currentRutaCarpeta);
}
