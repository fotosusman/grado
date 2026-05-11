document.addEventListener('DOMContentLoaded', () => {
    const colegioSelect = document.getElementById('colegio');
    const alumnoInput = document.getElementById('nombreAlumno');
    const claveInput = document.getElementById('clave');
    const btnEntrar = document.getElementById('btnEntrar');
    const statusMsg = document.getElementById('statusMsg');
    const loginContainer = document.getElementById('login-container');
    const galleryContainer = document.getElementById('gallery-container');
    const masonryGrid = document.getElementById('masonry-grid');
    const studentNameDisplay = document.getElementById('student-name-display');
    const btnDownloadAll = document.getElementById('btnDownloadAll');
    let currentFolderId = "";

    // Configuración de la API de Google Apps Script
    const API_URL = "https://script.google.com/macros/s/AKfycbzHa-Maq1PaTZgZmUDOv4w5LFYgd8sdJ_XxXpB21SFlt5FJRM98lW6fkpWfCJoP-ITeyQ/exec";

    async function cargarColegios() {
        const colegioSelect = document.getElementById('colegio');
        try {
            const response = await fetch(`${API_URL}?action=getColegios`);
            if (!response.ok) throw new Error('Error en la red');
            const data = await response.json();
            
            // Solo intentamos llenar el menú si recibimos una lista (Array)
            if (Array.isArray(data)) {
                colegioSelect.innerHTML = '<option value="" disabled selected>Selecciona tu Colegio</option>';
                data.forEach(col => {
                    const opt = document.createElement('option');
                    opt.value = col;
                    opt.textContent = col;
                    colegioSelect.appendChild(opt);
                });
            } else {
                colegioSelect.innerHTML = '<option value="" disabled>Error en datos</option>';
            }
        } catch (error) {
            console.error("Error:", error);
            colegioSelect.innerHTML = '<option value="" disabled>Error de conexión</option>';
        }
    }
    // Llama a la función al cargar la página
    cargarColegios();

    // 1. Manejo del Select de Colegio
    colegioSelect.addEventListener('change', async () => {
        const colegio = colegioSelect.value;
        alumnoInput.value = "";
        alumnoInput.disabled = false;
        alumnoInput.placeholder = "Cargando alumnos...";

        try {
            // Pedimos los alumnos del colegio seleccionado a tu API de Google
            const response = await fetch(`${API_URL}?action=getAlumnos&colegio=${encodeURIComponent(colegio)}`);
            if (!response.ok) throw new Error('Error en la red');
            const alumnos = await response.json();
            
            // Esta función llena la lista desplegable con los nombres del Excel
            populateDatalist(alumnos);
            alumnoInput.placeholder = "Escribe tu nombre...";
        } catch (error) {
            console.error("Error cargando alumnos:", error);
            alumnoInput.placeholder = "Error al cargar alumnos";
        }
    });

    function populateDatalist(alumnos) {
        const datalist = document.getElementById('alumnos-list');
        datalist.innerHTML = '';
        alumnos.forEach(nombre => {
            const option = document.createElement('option');
            option.value = nombre;
            datalist.appendChild(option);
        });
    }

    // 2. Manejo del Login (Local Validation)
    btnEntrar.addEventListener('click', async () => {
        const nombreIngresado = alumnoInput.value.trim();
        const claveIngresada = claveInput.value.trim();
        const colegioSeleccionado = colegioSelect.value;

        if (!colegioSeleccionado || !nombreIngresado || !claveIngresada) {
            showFeedback("Por favor, completa todos los campos.", "error");
            return;
        }

        btnEntrar.disabled = true;
        document.getElementById('btnEntrarText').innerText = "Validando...";

        try {
            console.log("Intentando conectar con Apps Script...");
            
            // Usamos el fetch corregido para evitar problemas de CORS
            const response = await fetch(`${API_URL}?action=getAlumnos&colegio=${encodeURIComponent(colegioSeleccionado)}`);
            
            if (!response.ok) {
                throw new Error("Error en la respuesta del servidor");
            }

            const alumnos = await response.json();
            console.log("Datos recibidos correctamente:", alumnos);

            // Buscamos al alumno con validación robusta (espacios, minúsculas)
            // Se asume que el objeto alumno tiene: nombre, clave, colegio, folderId (o idGaleria), y fotos
            const alumno = alumnos.find(a => 
                (a.nombre || "").trim().toLowerCase() === nombreIngresado.toLowerCase() && 
                (a.clave || "").toString() === claveIngresada.toString()
            );

            if (alumno) {
                console.log("Login exitoso para:", alumno.nombre);
                showFeedback("¡Bienvenido!", "success");
                
                // Guardamos datos importantes
                currentFolderId = alumno.folderId || alumno.idDescarga || "";
                
                // Ocultar buscador, mostrar galería
                setTimeout(() => {
                    loginContainer.style.display = 'none';
                    studentNameDisplay.innerText = alumno.nombre;
                    galleryContainer.classList.remove('hidden');
                    
                    // Renderizamos las fotos (asumiendo que vienen en el objeto alumno)
                    renderGallery(alumno.fotos || []);
                    
                    // Trigger scroll reveal
                    reveal();
                }, 500);
            } else {
                showFeedback("Usuario o clave incorrectos. Revisa los espacios y mayúsculas.", "error");
            }

        } catch (error) {
            console.error("Error detallado:", error);
            showFeedback("Hubo un problema al conectar con la base de datos.", "error");
        } finally {
            btnEntrar.disabled = false;
            document.getElementById('btnEntrarText').innerText = "Entrar a mi galería";
        }
    });

    function handleError(error) {
        btnEntrar.disabled = false;
        document.getElementById('btnEntrarText').innerText = "Entrar a mi galería";
        showFeedback("Error de conexión. Intenta de nuevo.", "error");
    }

    function renderGallery(urls) {
        masonryGrid.innerHTML = '';
        if(!urls || urls.length === 0) {
            masonryGrid.innerHTML = '<p>No se encontraron fotos en la carpeta.</p>';
            return;
        }
        
        urls.forEach(url => {
            const item = document.createElement('div');
            item.className = 'masonry-item';
            
            const img = document.createElement('img');
            img.src = url;
            img.loading = "lazy";
            
            item.appendChild(img);
            masonryGrid.appendChild(item);
        });
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // 3. Descargar Todo
    btnDownloadAll.addEventListener('click', () => {
        if(currentFolderId) {
            // Este es el enlace que usa Google para su propio botón de descarga
            const downloadUrl = `https://drive.google.com/uc?export=download&id=${currentFolderId}`;
            window.open(downloadUrl, '_blank');
        } else {
            showFeedback("Error: No se pudo obtener el ID de la carpeta. Intenta iniciar sesión de nuevo.", "error");
        }
    });

    function showFeedback(msg, type) {
        statusMsg.innerText = msg;
        statusMsg.style.color = type === "error" ? "#ff4d4d" : "#4CAF50";
    }

    // Scroll Reveal Animations
    function reveal() {
        var reveals = document.querySelectorAll(".reveal");

        for (var i = 0; i < reveals.length; i++) {
            var windowHeight = window.innerHeight;
            var elementTop = reveals[i].getBoundingClientRect().top;
            var elementVisible = 50;

            if (elementTop < windowHeight - elementVisible) {
                reveals[i].classList.add("active");
            }
        }
    }

    window.addEventListener("scroll", reveal);
    reveal(); // Trigger once on load

    // Hero Parallax Effect
    const parallaxImg = document.querySelector('.parallax-img');
    if (parallaxImg) {
        window.addEventListener('scroll', () => {
            const scrollPos = window.scrollY;
            // Move the image slightly downwards as the user scrolls down
            parallaxImg.style.transform = `translateY(${scrollPos * 0.4}px)`;
        });
    }

    // Hero Title Fade on Scroll
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        window.addEventListener('scroll', () => {
            const scrollPos = window.scrollY;
            const threshold = window.innerHeight * 0.3; // 30% of viewport height
            
            // Calculate opacity: 1 at top, 0 at 30% scroll
            let opacity = 1 - (scrollPos / threshold);
            if (opacity < 0) opacity = 0;
            
            heroTitle.style.opacity = opacity;
        });
    }
});