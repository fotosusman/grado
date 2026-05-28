/**
 * SISTEMA DE GALERÍAS ALTA VELOCIDAD - USMAN MANCERA
 * Conectado a la tabla con esquema UUID e id_galeria
 */

// 1. Tus credenciales reales de Supabase (Públicas y Seguras)
const SUPABASE_URL = "https://dtoniylozbflssbaoixl.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_x2rHkO--OxlC2bNVqrcPeA_0cMp9sXT";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Variable global para mantener los datos del alumno en memoria
let alumnoActivo = null;

// Inicialización del sistema al cargar el documento
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const usuarioUrl = urlParams.get('user'); // Captura el parámetro ?user=NombreAlumno

    if (usuarioUrl) {
        console.log("Iniciando carga para el usuario de la URL:", usuarioUrl);
        cargarDatosPortada(usuarioUrl);
    }

    reveal();
    initParallax();

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// Función 1: Busca al alumno por URL y renderiza el fondo 'portada.jpg' desde su 'id_galeria'
async function cargarDatosPortada(nombreUrl) {
    try {
        // Consultamos tu tabla alumnos estructurada por tu script SQL
        const { data: alumnos, error } = await _supabase
            .from('alumnos')
            .select('*');

        if (error) throw error;

        // Quitamos los espacios para emparejar la URL con la base de datos sin fallos
        const alumno = alumnos.find(a => 
            a.nombre.replace(/\s+/g, '').toLowerCase() === nombreUrl.toLowerCase()
        );

        if (alumno) {
            alumnoActivo = alumno; // Guardamos la fila entera en la variable global
            console.log("Alumno localizado con éxito:", alumno.nombre);

            // Reemplazamos dinámicamente el título principal de la web
            const tituloNombre = document.getElementById('hero-nombre') || document.querySelector('.hero-title h1');
            if (tituloNombre) tituloNombre.textContent = alumno.nombre;

            // Armamos la ruta del Storage público: colegio/id_galeria
            const rutaCarpeta = `${alumno.colegio.toLowerCase().replace(/\s+/g, '-')}/${alumno.id_galeria}`;
            
            // Buscamos la foto fija llamada obligatoriamente 'portada.jpg'
            const { data } = _supabase
                .storage
                .from('galerias')
                .getPublicUrl(`${rutaCarpeta}/portada.jpg`);

            const heroBg = document.getElementById('hero-bg') || document.querySelector('.parallax-img');
            if (heroBg && data.publicUrl) {
                heroBg.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${data.publicUrl}')`;
                heroBg.style.backgroundSize = 'cover';
                heroBg.style.backgroundPosition = 'center';
                console.log("Fondo del Hero establecido de forma estática.");
            }
        } else {
            console.error("El nombre de usuario provisto en el link de WhatsApp no existe.");
        }
    } catch (err) {
        console.error("Error crítico al inicializar la portada:", err);
    }
}

// Función 2: Ejecuta la validación de la contraseña de acceso
async function login() {
    const claveInput = document.getElementById('clave').value;
    const btnText = document.getElementById('btnEntrarText');

    if (!alumnoActivo) {
        alert("Error: No se han podido estructurar los datos del alumno.");
        return;
    }

    if (!claveInput) {
        alert("Por favor, introduce tu contraseña de acceso.");
        return;
    }

    if (btnText) btnText.textContent = "Verificando...";

    // Validación limpia contra el campo de texto 'clave' de tu SQL
    if (alumnoActivo.clave.toString().trim() === claveInput.trim()) {
        console.log("¡Acceso concedido!");

        // Transición de secciones ocultando el login
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('galeria-section').classList.remove('hidden');
        
        const etiquetaUsuario = document.getElementById('nombre-usuario');
        if (etiquetaUsuario) etiquetaUsuario.textContent = alumnoActivo.nombre;

        // Enlazamos automáticamente los botones de descarga al archivo 'todo.zip' de su carpeta
        const rutaCarpeta = `${alumnoActivo.colegio.toLowerCase().replace(/\s+/g, '-')}/${alumnoActivo.id_galeria}`;
        const { data: zipData } = _supabase
            .storage
            .from('galerias')
            .getPublicUrl(`${rutaCarpeta}/todo.zip`);

        const btnDownload = document.getElementById('btnDownloadAll');
        const btnDownloadBottom = document.getElementById('btnDownloadBottom');
        
        if (zipData && zipData.publicUrl) {
            const iniciarDescarga = () => window.open(zipData.publicUrl, '_blank');
            if (btnDownload) btnDownload.onclick = iniciarDescarga;
            if (btnDownloadBottom) btnDownloadBottom.onclick = iniciarDescarga;
        }

        // Cargamos el listado completo de fotos en el contenedor masonry
        cargarFotosDesdeStorage();
    } else {
        alert("Contraseña inválida. Inténtalo de nuevo.");
        if (btnText) btnText.textContent = "Entrar a mi galería";
    }
}

// Función 3: Escanea el Storage y renderiza la cuadrícula de imágenes
async function cargarFotosDesdeStorage() {
    const contenedor = document.getElementById('galeria');
    if (!contenedor) return;

    const rutaCarpeta = `${alumnoActivo.colegio.toLowerCase().replace(/\s+/g, '-')}/${alumnoActivo.id_galeria}`;
    
    try {
        const { data: archivos, error } = await _supabase
            .storage
            .from('galerias')
            .list(rutaCarpeta);

        if (error) throw error;

        contenedor.innerHTML = ''; // Barremos mensajes anteriores

        if (!archivos || archivos.length === 0) {
            contenedor.innerHTML = '<p class="mensaje">Tu galería se está procesando y estará lista muy pronto.</p>';
            return;
        }

        archivos.forEach(archivo => {
            const esImagen = /\.(jpg|jpeg|png|webp)$/i.test(archivo.name);
            // Evitamos duplicar la foto de portada en la cuadrícula de abajo
            const noEsPortada = archivo.name !== 'portada.jpg';
            
            if (esImagen && noEsPortada) {
                const { data } = _supabase
                    .storage
                    .from('galerias')
                    .getPublicUrl(`${rutaCarpeta}/${archivo.name}`);

                const div = document.createElement('div');
                div.className = 'masonry-item reveal';

                const img = document.createElement('img');
                img.src = data.publicUrl;
                img.alt = archivo.name;
                img.loading = "lazy";

                div.appendChild(img);
                contenedor.appendChild(div);
            }
        });

        // Disparamos animaciones de scroll
        setTimeout(reveal, 150);

        setTimeout(() => {
            document.getElementById('galeria-section').scrollIntoView({ behavior: 'smooth' });
        }, 200);

    } catch (err) {
        console.error("Error al mapear los objetos multimedia:", err);
        contenedor.innerHTML = '<p class="loading-text">Error en la conexión multimedia de alta velocidad.</p>';
    }
}

// --- ANIMACIONES FLUIDAS ORIGINALES ---
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
