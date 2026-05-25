// 1. URL de tu implementación (Actualizada a tu enlace más reciente)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwlhdfCB4Gce5XvMKiLHggr65Clv0xD7U9Uw0M9unCRVSCmfy_iXq8Ya0FTtcJpRK-j2A/exec";

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


// Función de Login — valida y redirige a Galeria.html
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
        // Buscar en los alumnos ya cargados en memoria
        const alumno = todosLosAlumnos.find(a =>
            a.colegio.trim() === colegio.trim() &&
            a.nombre.trim().toLowerCase() === nombre.trim().toLowerCase() &&
            a.clave.toString().trim() === clave.trim()
        );

        if (alumno) {
            console.log("Login exitoso para:", alumno.nombre);
            if (btnText) btnText.textContent = "¡Bienvenido! Redirigiendo...";

            // Redirigir a Galeria.html con los datos del alumno
            const params = new URLSearchParams({
                user: alumno.nombre.replace(/\s+/g, ''),
                colegio: alumno.colegio.trim(),
                clave: clave.trim()
            });
            window.location.href = `Galeria.html?${params.toString()}`;

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