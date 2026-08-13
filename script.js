// ==========================================
// 1. REFERENCIAS A ELEMENTOS DEL DOM
// ==========================================
const inputManoObra = document.getElementById('mano-obra');
const inputRepuestos = document.getElementById('repuestos');
const totalPantalla = document.getElementById('total-pantalla');
const btnGenerar = document.getElementById('btn-generar');
const inputNombre = document.getElementById('nombre');
const inputPatente = document.getElementById('patente');
const inputKilometraje = document.getElementById('kilometraje');
const inputTrabajo = document.getElementById('trabajo');
const inputObservaciones = document.getElementById('observaciones');
const inputMarca = document.getElementById('marca');
const inputModelo = document.getElementById('modelo');
const inputCilindrada = document.getElementById('cilindrada');
const selectTraccion = document.getElementById('traccion');

// ==========================================
// 2. INICIALIZACIÓN DEL NÚMERO DE ORDEN
// ==========================================
// Recuperamos el número de orden actual o lo iniciamos en 1
let numeroOrdenActual = localStorage.getItem('numeroOrdenTaller');
if (!numeroOrdenActual) {
    numeroOrdenActual = 1;
    localStorage.setItem('numeroOrdenTaller', numeroOrdenActual);
}

// ==========================================
// 3. FUNCIONES DE FORMATEO Y CÁLCULO
// ==========================================
// Forzar la patente a mayúscula en tiempo real
if (inputPatente) {
    inputPatente.addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });
}

// Transformar "juan perez" en "Juan Perez"
function capitalizarNombres(texto) {
    if (!texto) return '';
    return texto.split(' ').map(palabra => {
        if (palabra.length === 0) return '';
        return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
    }).join(' ');
}

// Calcular y formatear el total en la pantalla mientras escribes
function calcularTotal() {
    let mo = parseInt(inputManoObra.value) || 0;
    let rep = parseInt(inputRepuestos.value) || 0;
    let suma = mo + rep;
    
    if (totalPantalla) {
        totalPantalla.textContent = suma.toLocaleString('es-CL');
    }
    return { mo, rep, suma };
}

// Escuchamos cuando el usuario teclea en los montos para calcular al vuelo
if (inputManoObra) inputManoObra.addEventListener('input', calcularTotal);
if (inputRepuestos) inputRepuestos.addEventListener('input', calcularTotal);

// ==========================================
// 4. GENERACIÓN DEL PDF (El Motor Principal)
// ==========================================
if (btnGenerar) {
    btnGenerar.addEventListener('click', () => {
        // A. Evitamos que le hagan doble clic rápido
        btnGenerar.textContent = "Generando PDF... ⏳";
        btnGenerar.disabled = true;

        // B. Obtener la fecha
        const hoy = new Date();
        const fechaFormat = hoy.toLocaleDateString('es-CL');
        
        // C. Obtener y actualizar el número de orden
        let numOrden = parseInt(localStorage.getItem('numeroOrdenTaller')) || 1;
        // Formatear el número con ceros a la izquierda (ej: 00015)
        const numOrdenFormateado = String(numOrden).padStart(5, '0');
        
        // D. Extraer datos del formulario
        let nombre = inputNombre ? inputNombre.value : 'Sin Nombre';
        nombre = capitalizarNombres(nombre) || 'Sin Nombre'; 
        const patente = inputPatente ? (inputPatente.value.toUpperCase() || 'S/N') : 'S/N';
        const kilometraje = inputKilometraje ? (inputKilometraje.value || '0') : '0';
        // Extraer nuevos datos
        const marca = inputMarca ? (capitalizarNombres(inputMarca.value) || 'S/M') : 'S/M';
        const modelo = inputModelo ? (capitalizarNombres(inputModelo.value) || 'S/M') : 'S/M';
        const vehiculoCompleto = `${marca} ${modelo}`;
        const cilindrada = inputCilindrada ? (inputCilindrada.value || 'N/E') : 'N/E';
        const traccion = selectTraccion ? selectTraccion.value : '4x2';
        const trabajo = inputTrabajo ? (inputTrabajo.value || 'Ninguno especificado.') : 'Ninguno especificado.';
        const obs = inputObservaciones ? (inputObservaciones.value || 'Sin observaciones.') : 'Sin observaciones.';
        const { mo, rep, suma } = calcularTotal();

        // E. Función de seguridad: Solo escribe si el elemento existe en el HTML
        function inyectarDato(id, valor) {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.textContent = valor;
            } else {
                console.warn(`Ojo: No se encontró el campo '${id}' en el HTML.`);
            }
        }

        // Inyectar datos en la plantilla original oculta usando nuestra función segura
        inyectarDato('pdf-numero-orden', numOrdenFormateado);
        inyectarDato('pdf-fecha', fechaFormat);
        inyectarDato('pdf-nombre', nombre);
        inyectarDato('pdf-patente', patente);
        inyectarDato('pdf-vehiculo', vehiculoCompleto);
        inyectarDato('pdf-cilindrada', cilindrada);
        inyectarDato('pdf-traccion', traccion);
        inyectarDato('pdf-kilometraje', Number(kilometraje).toLocaleString('es-CL'));
        inyectarDato('pdf-trabajo', trabajo);
        inyectarDato('pdf-observaciones', obs);
        inyectarDato('pdf-mo', mo.toLocaleString('es-CL'));
        inyectarDato('pdf-rep', rep.toLocaleString('es-CL'));
        inyectarDato('pdf-total', suma.toLocaleString('es-CL'));

        // F. EL TRUCO DE ORO DEFINITIVO PARA MÓVILES Y PC
        const pdfContainer = document.getElementById('pdf-container');
        const pdfContent = document.querySelector('.pdf-content');
        
        if (pdfContainer && pdfContent) {
            // 1. Guardar la posición actual y subir al inicio absoluto (evita el PDF cortado)
            const scrollX = window.scrollX;
            const scrollY = window.scrollY;
            window.scrollTo(0, 0);
            
            // 2. Mostrar la plantilla EN CIMA de la app.
            // Al tener z-index positivo, el celular está OBLIGADO a pintar los pixeles (evita el PDF blanco)
            pdfContainer.style.display = 'block';
            pdfContainer.style.position = 'absolute';
            pdfContainer.style.top = '0';
            pdfContainer.style.left = '0';
            pdfContainer.style.zIndex = '9999'; 
            
            const nombreArchivo = `Orden_${numOrdenFormateado}_${patente}.pdf`;
            
            const opciones = {
                margin:       0, 
                filename:     nombreArchivo,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { 
                    scale: 2, 
                    useCORS: true,
                    width: 794,
                    windowWidth: 794,  
                    x: 0,
                    y: 0,
                    scrollX: 0,
                    scrollY: 0,
                    /* ¡NUEVO! Obliga a ignorar el escalado del dispositivo */
                    letterRendering: true,
                    ignoreElements: false
                }, 
                jsPDF:        { 
                    unit: 'mm', 
                    format: 'a4', 
                    orientation: 'portrait' 
                }
            };

            // 3. Darle 150ms al navegador para dibujar, sacar la foto y ocultar
            setTimeout(() => {
                html2pdf().set(opciones).from(pdfContent).save().then(() => {
                    // Ocultar la plantilla de nuevo
                    pdfContainer.style.display = 'none';
                    // Devolver al usuario exactamente a donde estaba mirando
                    window.scrollTo(scrollX, scrollY);
                    
                    // Aumentar el número de orden y guardar
                    numOrden++;
                    localStorage.setItem('numeroOrdenTaller', numOrden);
                    
                    // Restaurar botón
                    btnGenerar.textContent = "Generar PDF y Descargar 📄";
                    btnGenerar.disabled = false;
                }).catch(error => {
                    console.error("Error generando PDF:", error);
                    pdfContainer.style.display = 'none';
                    window.scrollTo(scrollX, scrollY);
                    btnGenerar.textContent = "Error. Intentar de nuevo";
                    btnGenerar.disabled = false;
                });
            }, 150);
        } else {
            console.error("No se encontró el contenedor del PDF en el HTML.");
            btnGenerar.textContent = "Error de Plantilla";
            btnGenerar.disabled = false;
        }
    });
}