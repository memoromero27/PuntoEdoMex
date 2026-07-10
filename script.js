document.addEventListener('DOMContentLoaded', () => {
    // 1. Mostrar fecha actual en el Top Bar
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date();
        let dateString = today.toLocaleDateString('es-MX', options);
        dateString = dateString.charAt(0).toUpperCase() + dateString.slice(1);
        dateElement.textContent = dateString;
    }

    // 2. Control del Menú Móvil
    const menuBtn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('primary-menu');
    
    if (menuBtn && menu) {
        menuBtn.addEventListener('click', () => {
            menu.classList.toggle('show');
        });
    }

    // 3. Simular titulares en el ticker de última hora
    const tickerText = document.getElementById('ticker-text');
    const headlines = [
        "Papel de los intelectuales mexicanos frente a las ofensivas mediáticas contra la 4T",
        "Ecatepec se suma a las celebraciones seguras por el partido México-Inglaterra",
        "Azucena Cisneros arranca operativos preventivos en Izcalli Jardines",
        "OSFEM auditará a 103 municipios del Estado de México"
    ];
    
    if (tickerText) {
        tickerText.innerHTML = headlines.join(' &nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp; ');
    }
});

// =========================================================================
// --- INICIALIZACIÓN DE SUPABASE ---
// =========================================================================
const supabaseUrl = 'https://yeigwlusrivrdbkjrnpp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllaWd3bHVzcml2cmRia2pybnBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyODM3NjQsImV4cCI6MjA5ODg1OTc2NH0.M-e480U5iuyH1FctwZtdiTIKD5HMklxu10LXINx2r6U'; 
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// =========================================================================
// --- VARIABLES GLOBALES PARA CONTROL DE VISTAS ---
// =========================================================================
let vistaPortadaCargada = false;

// =========================================================================
// --- LÓGICA DE PORTADA (Tus funciones originales intactas) ---
// =========================================================================
async function cargarDestacadas() {
    try {
        const { data: noticias, error } = await supabaseClient
            .from('noticias')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        if (!noticias || noticias.length === 0) return;

        const actualizarTarjeta = (nota, cajaHtml) => {
            if (!nota || !cajaHtml) return; 

            const thumbnail = cajaHtml.querySelector('.post-thumbnail');
            const badge = cajaHtml.querySelector('.cat-badge');
            const title = cajaHtml.querySelector('.entry-title a');
            const fecha = cajaHtml.querySelector('.posted-on'); 
            const resumen = cajaHtml.querySelector('.entry-summary p, .resumen-texto, p.entry-summary'); 
            const leerMas = cajaHtml.querySelector('.read-more'); 

            const urlArticulo = `articulo.html?id=${nota.id}`;

            if (thumbnail) {
                thumbnail.style.backgroundImage = `url('${nota.imagen_url}')`;
                thumbnail.style.cursor = 'pointer';
                thumbnail.onclick = (e) => {
                    e.preventDefault();
                    window.location.href = urlArticulo;
                };
            }
            
            if (badge) badge.textContent = nota.categoria.split(',')[0]; // Tomamos solo la primera categoría para el badge
            
            if (title) {
                title.textContent = nota.titulo;
                title.href = urlArticulo; 
                title.onclick = (e) => {
                    e.preventDefault(); 
                    window.location.href = urlArticulo; 
                };
            }

            if (resumen) {
                const textoNota = nota.contenido || nota.texto || nota.cuerpo || nota.articulo || '';
                if (textoNota) {
                    const textoLimpio = textoNota.replace(/<[^>]*>?/gm, ''); 
                    resumen.textContent = textoLimpio.substring(0, 100) + '...';
                } else {
                    resumen.textContent = ''; 
                }
            }

            if (fecha && nota.created_at) {
                const fechaObj = new Date(nota.created_at);
                const opciones = { day: 'numeric', month: 'long', year: 'numeric' };
                fecha.textContent = fechaObj.toLocaleDateString('es-MX', opciones);
            }

            if (leerMas) {
                leerMas.href = urlArticulo; 
                leerMas.onclick = (e) => {
                    e.preventDefault();
                    window.location.href = urlArticulo;
                };
            }
        };

        // --- SECCIÓN 1: ARRIBA (Política, Edomex, Municipios SIN REPETIR) ---
        // Creamos un registro para no mostrar la misma noticia dos veces
        const idsUsados = new Set(); 

        const notaPolitica = noticias.find(n => 
            n.categoria && (n.categoria.toLowerCase().includes('polít') || n.categoria.toLowerCase().includes('polit'))
        );
        if (notaPolitica) idsUsados.add(notaPolitica.id); // Guardamos su ID

        const notaEdomex = noticias.find(n => 
            n.categoria && n.categoria.toLowerCase().includes('edomex') && !idsUsados.has(n.id)
        );
        if (notaEdomex) idsUsados.add(notaEdomex.id); // Guardamos su ID

        const notaMunicipios = noticias.find(n => 
            n.categoria && n.categoria.toLowerCase().includes('municipios') && !idsUsados.has(n.id)
        );
        if (notaMunicipios) idsUsados.add(notaMunicipios.id); // Guardamos su ID

        // Pintamos las tarjetas
        actualizarTarjeta(notaPolitica, document.querySelector('.main-feature'));
        const cajasSecundarias = document.querySelectorAll('.secondary-features .small-feature');
        if (cajasSecundarias.length >= 2) {
            actualizarTarjeta(notaEdomex, cajasSecundarias[0]);
            actualizarTarjeta(notaMunicipios, cajasSecundarias[1]);
        }

        // --- SECCIÓN 2: CULTURA ---
        const notasCultura = noticias.filter(n => n.categoria.toLowerCase().includes('cultura')).slice(0, 3);
        actualizarTarjeta(notasCultura[0], document.getElementById('cultura-1'));
        actualizarTarjeta(notasCultura[1], document.getElementById('cultura-2'));
        actualizarTarjeta(notasCultura[2], document.getElementById('cultura-3'));

        // --- SECCIÓN 3: MÁS NOTICIAS ---
        const fechaAyer = new Date();
        fechaAyer.setDate(fechaAyer.getDate() - 1); 
        
        let notasMasNoticias = noticias.filter(n => {
            if (!n.created_at) return false;
            const f = new Date(n.created_at);
            return f.getDate() === fechaAyer.getDate() && 
                   f.getMonth() === fechaAyer.getMonth() && 
                   f.getFullYear() === fechaAyer.getFullYear();
        });

        if (notasMasNoticias.length < 2) {
            notasMasNoticias = noticias.slice(0, 2); 
        }

        actualizarTarjeta(notasMasNoticias[0], document.getElementById('ayer-1'));
        actualizarTarjeta(notasMasNoticias[1], document.getElementById('ayer-2'));

        // --- SECCIÓN 4: CARRUSEL ÚLTIMA HORA ---
        const tickerContenedor = document.getElementById('ticker-text');
        if (tickerContenedor && noticias.length > 0) {
            tickerContenedor.style.animation = 'none'; 
            const titulosRecientes = noticias.slice(0, 5).map(nota => nota.titulo).join(' &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp; ');
            tickerContenedor.innerHTML = titulosRecientes;
            void tickerContenedor.offsetWidth; 
            tickerContenedor.style.animation = 'scroll-ticker 45s linear infinite';
        }

        vistaPortadaCargada = true;

        // --- SECCIÓN 5: LO MÁS LEÍDO (BARRA LATERAL) ---
        const contenedorPopulares = document.getElementById('popular-posts-list');
        if (contenedorPopulares) {
            // Buscamos las noticias que tengan la categoría (ignorando mayúsculas y acentos por seguridad)
            const notasPopulares = noticias.filter(n => 
                n.categoria && (n.categoria.toLowerCase().includes('lo más leído') || n.categoria.toLowerCase().includes('lo mas leido'))
            ).slice(0, 3); // Tomamos las 3 más recientes

            // Limpiamos el texto de "Cargando..."
            contenedorPopulares.innerHTML = '';

            if (notasPopulares.length > 0) {
                notasPopulares.forEach(nota => {
                    const urlArticulo = `articulo.html?id=${nota.id}`;
                    const fechaObj = nota.created_at ? new Date(nota.created_at) : new Date();
                    const fechaFormateada = fechaObj.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
                    const imagen = nota.imagen_url || 'https://via.placeholder.com/80x60?text=Foto';

                    // Convertimos el div de la imagen en un enlace <a> para que la foto también sea clicable
                    const liHTML = `
                        <li>
                            <a href="${urlArticulo}" class="widget-thumb" style="background-image: url('${imagen}'); background-size: cover; display: block; border-radius: 8px;"></a>
                            <div class="widget-info">
                                <a href="${urlArticulo}">${nota.titulo}</a>
                                <span class="posted-on">${fechaFormateada}</span>
                            </div>
                        </li>
                    `;
                    contenedorPopulares.innerHTML += liHTML;
                });
            } else {
                // Mensaje por si un día no hay notas con esa etiqueta
                contenedorPopulares.innerHTML = '<li><div class="widget-info">Próximamente más noticias...</div></li>';
            }
        }

    } catch (error) {
        console.error('Error al cargar las noticias:', error);
    }
}

// =========================================================================
// --- NUEVO: LÓGICA DE FILTRADO DINÁMICO POR CATEGORÍA ---
// =========================================================================

/// Función para cambiar entre vistas
function alternarVistas(mostrarPortada, nombreCategoria = '') {
    const destacados = document.querySelector('.top-featured-wrapper');
    const bloquesPortada = document.querySelectorAll('.category-block');
    const contenedorPrincipal = document.getElementById('main');
    const contenedorGlobal = document.getElementById('content'); // Seleccionamos el bloque completo
    
    let contenedorDinamico = document.getElementById('category-dynamic-view');
    if (!contenedorDinamico) {
        contenedorDinamico = document.createElement('div');
        contenedorDinamico.id = 'category-dynamic-view';
        contenedorDinamico.className = 'category-view-container';
        contenedorPrincipal.prepend(contenedorDinamico);
    }

    if (mostrarPortada) {
        // Restaurar Portada
        destacados.style.display = 'block';
        bloquesPortada.forEach(bloque => bloque.style.display = 'block');
        contenedorDinamico.style.display = 'none';
        
        // Quitamos el margen extra para que la portada se vea normal
        if (contenedorGlobal) contenedorGlobal.style.marginTop = '0px';
        
        document.querySelectorAll('.nav-menu li').forEach(li => li.classList.remove('active'));
        document.querySelector('.nav-menu li:first-child').classList.add('active');
    } else {
        // Esconder Portada y mostrar contenedor dinámico
        if (destacados) destacados.style.display = 'none';
        bloquesPortada.forEach(bloque => bloque.style.display = 'none');
        contenedorDinamico.style.display = 'flex';
        contenedorDinamico.innerHTML = `<h2 class="category-view-title">${nombreCategoria}</h2><p>Cargando noticias...</p>`;
        
        // Empujamos todo el bloque hacia abajo para separarlo del ticker
        if (contenedorGlobal) contenedorGlobal.style.marginTop = '40px'; 
    }
}

// Función para descargar y armar las noticias de la categoría
async function cargarNoticiasPorCategoria(categoriaBusqueda, tituloCategoria) {
    alternarVistas(false, tituloCategoria);
    const contenedorDinamico = document.getElementById('category-dynamic-view');

    try {
        // Utilizamos "ilike" para buscar la palabra dentro del texto, sin importar mayúsculas/minúsculas
        const { data: noticias, error } = await supabaseClient
            .from('noticias')
            .select('*')
            .ilike('categoria', `%${categoriaBusqueda}%`) 
            .order('created_at', { ascending: false })
            .limit(5); // Traemos las 5 más recientes

        if (error) throw error;

        // Limpiamos el texto de "Cargando..." y dejamos solo el título
        contenedorDinamico.innerHTML = `<h2 class="category-view-title">${tituloCategoria}</h2>`;

        if (!noticias || noticias.length === 0) {
            contenedorDinamico.innerHTML += `<p>Por el momento no hay noticias en esta categoría.</p>`;
            return;
        }

        // Construimos el HTML para cada noticia (El diseño CSS grande que creamos)
        noticias.forEach(nota => {
            const urlArticulo = `articulo.html?id=${nota.id}`;
            const fechaObj = nota.created_at ? new Date(nota.created_at) : new Date();
            const fechaFormateada = fechaObj.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
            
            // Limpiamos el texto del resumen
            let textoLimpio = '';
            const textoNota = nota.cuerpo || nota.contenido || '';
            if (textoNota) textoLimpio = textoNota.replace(/<[^>]*>?/gm, '').substring(0, 180) + '...';

            // Armamos el HTML dinámico
            const htmlNota = `
                <article class="post-list-item-large">
                    <a href="${urlArticulo}" class="post-thumbnail" style="background-image: url('${nota.imagen_url || 'https://via.placeholder.com/500x281'}');"></a>
                    <div class="post-content">
                        <h2 class="entry-title"><a href="${urlArticulo}">${nota.titulo}</a></h2>
                        <div class="entry-meta"><span class="posted-on">${fechaFormateada}</span></div>
                        <div class="entry-summary">
                            <p>${textoLimpio}</p>
                            <a class="read-more" href="${urlArticulo}">Leer Más</a>
                        </div>
                    </div>
                </article>
            `;
            contenedorDinamico.innerHTML += htmlNota;
        });

    } catch (error) {
        console.error('Error al filtrar categoría:', error);
        contenedorDinamico.innerHTML += `<p>Error al cargar las noticias. Por favor, intenta de nuevo.</p>`;
    }
}

// Configurar los clicks en el menú de navegación
function inicializarMenuCategorias() {
    const menuLinks = document.querySelectorAll('.nav-menu a');
    
    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const textoEnlace = link.textContent.trim();
            const textoMinusculas = textoEnlace.toLowerCase();
            
            // Evitar que el submenú de "EdoMex ▾" dispare búsquedas extrañas
            if (textoEnlace.includes('▾')) return; 
            
            if (textoMinusculas === 'portada') {
                e.preventDefault();
                alternarVistas(true);
            } else if (['política', 'cultura', 'nacional', 'internacional', 'universidad', 'aula', 'municipios', 'edomex'].includes(textoMinusculas)) {
                e.preventDefault();
                
                // Actualizar el estado visual del menú (Quitar color a todos, poner color al actual)
                document.querySelectorAll('.nav-menu li').forEach(li => li.classList.remove('active'));
                
                // Si es una opción del submenú, pintamos el "padre" (EdoMex) para mantener el estilo
                const elementoPadre = link.closest('.has-submenu');
                if (elementoPadre) {
                    elementoPadre.classList.add('active');
                } else {
                    link.parentElement.classList.add('active');
                }

                // Disparamos la búsqueda y mostramos la vista nueva
                cargarNoticiasPorCategoria(textoMinusculas, textoEnlace);
                
                // Si estamos en celular, cerramos el menú después de hacer click
                const menu = document.getElementById('primary-menu');
                if (menu.classList.contains('show')) {
                    menu.classList.remove('show');
                }
            }
        });
    });
}

// =========================================================================
// --- EVENTOS INICIALES ---
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    cargarDestacadas();
    inicializarMenuCategorias();
});


// =========================================================================
// --- LÓGICA PARA EL MENÚ FIJO A PRUEBA DE SALTOS ---
// =========================================================================
const nav = document.getElementById('site-navigation');
const headerFondo = document.querySelector('.header-background-wrapper');
const topBar = document.querySelector('.top-bar'); // Por si agregas una top-bar después

// 1. Creamos el "espacio fantasma"
const menuFantasma = document.createElement('div');
menuFantasma.style.display = 'none'; // Invisible al inicio
// 2. Lo insertamos en el HTML justo antes del menú de navegación
nav.parentNode.insertBefore(menuFantasma, nav);

let distanciaMenu = 0;

const calcularDistancia = () => {
    const altoTopBar = topBar ? topBar.offsetHeight : 0;
    const altoHeader = headerFondo ? headerFondo.offsetHeight : 0;
    distanciaMenu = altoTopBar + altoHeader;
};

calcularDistancia();
window.addEventListener('load', calcularDistancia);
window.addEventListener('resize', calcularDistancia);

window.addEventListener('scroll', () => {
    if (distanciaMenu === 0) return;
    
    if (window.scrollY >= distanciaMenu) {
        // Cuando hacemos scroll hacia abajo y pasamos el fondo
        if (!nav.classList.contains('menu-fijo')) {
            // Le damos al fantasma la altura exacta del menú para que nada salte
            menuFantasma.style.height = nav.offsetHeight + 'px';
            
            // Copiamos automáticamente cualquier margen que tenga el menú en tu CSS
            menuFantasma.style.marginBottom = window.getComputedStyle(nav).marginBottom;
            
            // Mostramos el fantasma para rellenar el hueco
            menuFantasma.style.display = 'block'; 
            
            // Hacemos el menú flotante
            nav.classList.add('menu-fijo');
        }
    } else {
        // Cuando regresamos hasta arriba de la página
        if (nav.classList.contains('menu-fijo')) {
            // Quitamos el menú flotante
            nav.classList.remove('menu-fijo');
            
            // Escondemos el fantasma de nuevo
            menuFantasma.style.display = 'none'; 
        }
    }
});
