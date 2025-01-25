// predictor/static/predictor/script.js

let predictionChart = null;  // Definir la variable predictionChart a nivel global
let downloadLink = null;  // Definir la variable downloadLink a nivel global

function showLoaderChart() {
    document.getElementById('loader').style.display = 'block';
    document.getElementById('predictionChart').style.display = 'none'; // Ocultar el gráfico cuando se muestra el loader
}

function hideLoaderChart() {
    document.getElementById('loader').style.display = 'none';
    document.getElementById('predictionChart').style.display = 'block'; // Mostrar el gráfico cuando se oculta el loader
}

function showLoaderCSV() {
    document.getElementById('loader-csv').style.display = 'block';
}

function hideLoaderCSV() {
    document.getElementById('loader-csv').style.display = 'none';
}

function makePrediction() {
    if (predictionChart) {
        predictionChart.destroy();
    }

    // Limpiar el contenido del resultado final
    document.getElementById('finalPrediction').innerText = '';
    document.getElementById('finalPrediction').style.color = 'black';

    // Validaciones de los campos
    const edad = document.getElementById('edad').value;
    const generoCod = document.getElementById('genero_cod').value;
    const numInasistencias = document.getElementById('num_inasist').value;
    const animLecturaCod = document.getElementById('anim_lectura_cod').value;
    const anioEscolarCod = document.getElementById('anio_escolar_cod').value;
    const porcAsistencia = document.getElementById('porc_asistencia').value;
    const saludEmocional = document.getElementById('salud_emocional').value;
    const acompIntegralCod = document.getElementById('acomp_integral_cod').value;
    const orientacionVocCod = document.getElementById('orientacion_voc_cod').value;
    const participacionExtra = document.getElementById('extra_participacion').value;

    // Array para acumular errores
    const errores = [];

    // Validaciones específicas
    if (!edad || isNaN(edad) || edad < 5 || edad > 20) {
        errores.push('La edad debe estar entre 5 y 20.');
    }

    if (!generoCod) {
        errores.push('Debe seleccionar un género.');
    }

    if (!numInasistencias || isNaN(numInasistencias) || numInasistencias < 0 || numInasistencias > 200) {
        errores.push('El número de inasistencias debe estar entre 0 y 200.');
    }

    if (!animLecturaCod) {
        errores.push('Debe seleccionar una animación de lectura.');
    }

    if (!anioEscolarCod) {
        errores.push('Debe seleccionar un año escolar.');
    }

    if (!porcAsistencia || isNaN(porcAsistencia) || porcAsistencia < 0 || porcAsistencia > 100) {
        errores.push('El porcentaje de asistencia debe estar entre 0 y 100.');
    }

    if (!saludEmocional) {
        errores.push('Debe seleccionar un estado de salud emocional.');
    }

    if (!acompIntegralCod) {
        errores.push('Debe seleccionar un acompañamiento integral.');
    }

    if (!orientacionVocCod) {
        errores.push('Debe seleccionar una orientación vocacional.');
    }

    if (!participacionExtra || isNaN(participacionExtra) || participacionExtra < 0 || participacionExtra > 20) {
        errores.push('La participación extracurricular debe estar entre 0 y 20.');
    }

    // Si hay errores, los mostramos y detenemos la ejecución
    if (errores.length > 0) {
        alert('Errores encontrados:\n' + errores.join('\n'));
        return;
    }

    // Datos a enviar
    const csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]').value;
    const data = {
        'datos': {
            'Edad': parseInt(edad),
            'Genero_Cod': generoCod,
            'Numero_Inasistencias': parseInt(numInasistencias),
            'Animacion_Lectura_Cod': animLecturaCod,
            'Anio_Escolar_Cod': anioEscolarCod,
            'Porc_Asistencia_Refuerzo': parseFloat(porcAsistencia),
            'Estado_Salud_Emocional': saludEmocional,
            'Acompanamiento_Integral_Cod': acompIntegralCod,
            'Orientacion_Vocacional_Cod': orientacionVocCod,
            'Participacion_Extracurriculares': parseInt(participacionExtra)
        }
    };

    showLoaderChart();

    fetch('/predict/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }

        const resultados = data.resultados[0];
        const probabilidades = resultados.slice(0, 5).map(p => (p * 100).toFixed(2));
        const prediccionFinal = resultados[5];
        const labels = ['A (> 8 a 10)', 'B (> 6 a 8)', 'C (> 4 a 6)', 'D (> 2 a 4)', 'E (< 2)'];
        const ctx = document.getElementById('predictionChart').getContext('2d');

        if (predictionChart) {
            predictionChart.destroy();
        }

        predictionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Probabilidades (%)',
                    data: probabilidades,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.raw + '%';
                            }
                        }
                    }
                }
            }
        });

        const resultadoFinalText = {
            'E': 'Más probable: Rendimiento E (> 0 a 2)',
            'D': 'Más probable: Rendimiento D (> 2 a 4)',
            'C': 'Más probable: Rendimiento C (> 4 a 6)',
            'B': 'Más probable: Rendimiento B (> 6 a 8)',
            'A': 'Más probable: Rendimiento A (> 8 a 10)'
        };

        document.getElementById('finalPrediction').innerText = resultadoFinalText[prediccionFinal] || 'Sin resultado';
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('finalPrediction').innerText = error.message;
        document.getElementById('finalPrediction').style.color = 'red';
    })
    .finally(() => {
        hideLoaderChart();
    });
}

// Botón principal para validar y luego predecir
function validateAndPredictCSV() {
    const fileInput = document.getElementById('csv-file');
    const messageEl = document.getElementById('upload-message');
    const downloadLink = document.getElementById('download-link');

    // Limpiar mensajes y enlace
    messageEl.innerText = '';
    messageEl.classList.remove('error');
    downloadLink.style.display = 'none';
    downloadLink.href = '#';

    // Verificar si hay archivo seleccionado
    if (!fileInput.files || fileInput.files.length === 0) {
        messageEl.innerText = 'No se ha seleccionado ningún archivo CSV.';
        messageEl.classList.add('error');
        return;
    }
    const file = fileInput.files[0];

    // Leer el archivo con FileReader
    const reader = new FileReader();
    reader.onload = function(e) {
        const csvContent = e.target.result;
        // Validar columnas y cada fila
        const validationError = validateCSVContent(csvContent);
        if (validationError) {
        // Mostrar el error y NO enviamos al servidor
        messageEl.innerText = validationError;
        messageEl.classList.add('error');
        } else {
        // Si no hay error, subimos el archivo al servidor para predecir
        predictCSV(file);
        }
    };
    reader.readAsText(file, 'UTF-8');
    }

    // Validar contenido del CSV (encabezados + filas)
    function validateCSVContent(csvContent) {
    // Dividir en líneas (ignorando líneas vacías)
    const lines = csvContent.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length < 2) {
        return 'El archivo CSV está vacío o no tiene datos suficientes.';
    }

    // Columnas requeridas
    const requiredColumns = [
        "Edad",
        "Genero_Cod",
        "Numero_Inasistencias",
        "Animacion_Lectura_Cod",
        "Anio_Escolar_Cod",
        "Porc_Asistencia_Refuerzo",
        "Estado_Salud_Emocional",
        "Acompanamiento_Integral_Cod",
        "Orientacion_Vocacional_Cod",
        "Participacion_Extracurriculares"
    ];

    // Tomar la primera línea como encabezado
    const header = lines[0].split(',');
    // Verificar que existan todas las columnas requeridas
    for (let reqCol of requiredColumns) {
        if (!header.includes(reqCol)) {
        return `Falta la columna requerida: ${reqCol}`;
        }
    }

    // Índices de cada columna
    const idxEdad = header.indexOf("Edad");
    const idxGenero = header.indexOf("Genero_Cod");
    const idxInasist = header.indexOf("Numero_Inasistencias");
    const idxAnimLect = header.indexOf("Animacion_Lectura_Cod");
    const idxAnioEsc = header.indexOf("Anio_Escolar_Cod");
    const idxPorcRef = header.indexOf("Porc_Asistencia_Refuerzo");
    const idxSalud = header.indexOf("Estado_Salud_Emocional");
    const idxAcomp = header.indexOf("Acompanamiento_Integral_Cod");
    const idxOrient = header.indexOf("Orientacion_Vocacional_Cod");
    const idxExtra = header.indexOf("Participacion_Extracurriculares");

    // Listas de valores válidos (para columnas categóricas)
    const generoValid = ["Masculino", "Femenino"];
    const animacionValid = ["E-", "E+", "D-", "D+", "C-", "C+", "B-", "B+", "A-", "A+"];
    const anioEscolarValid = ["Octavo", "Noveno", "Decimo", "PrimeroBach", "SegundoBach", "TerceroBach"];
    const saludValid = ["SinProblemas", "Ocasional", "Cronico"];

    // Validar fila por fila (empezando en la línea 1, pues la 0 es encabezado)
    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',');
        if (row.length < requiredColumns.length) {
        return `Error en línea ${i+1}: No hay suficientes columnas o separadores.`;
        }

        // a) Edad (entero, 10..20)
        const edadStr = row[idxEdad];
        const edad = parseInt(edadStr, 10);
        if (isNaN(edad) || edad < 10 || edad > 20) {
        return `Error en línea ${i+1}: Edad inválida (${edadStr}). Debe ser un entero entre 10 y 20.`;
        }

        // b) Genero_Cod (Masculino/Femenino)
        const generoStr = row[idxGenero];
        if (!generoValid.includes(generoStr)) {
        return `Error en línea ${i+1}: Género inválido (${generoStr}). Use 'Masculino' o 'Femenino'.`;
        }

        // c) Numero_Inasistencias (entero, 0..200)
        const inasistStr = row[idxInasist];
        const inasist = parseInt(inasistStr, 10);
        if (isNaN(inasist) || inasist < 0 || inasist > 200) {
        return `Error en línea ${i+1}: Número de inasistencias inválido (${inasistStr}). Debe ser 0..200.`;
        }

        // d) Animacion_Lectura_Cod
        const animStr = row[idxAnimLect];
        if (!animacionValid.includes(animStr)) {
        return `Error en línea ${i+1}: Animación Lectura inválida (${animStr}). Debe ser una de [${animacionValid.join(', ')}].`;
        }

        // e) Anio_Escolar_Cod
        const anioStr = row[idxAnioEsc];
        if (!anioEscolarValid.includes(anioStr)) {
        return `Error en línea ${i+1}: Año Escolar inválido (${anioStr}). Use [${anioEscolarValid.join(', ')}].`;
        }

        // f) Porc_Asistencia_Refuerzo (float, 0..100)
        const porcStr = row[idxPorcRef];
        const porc = parseFloat(porcStr);
        if (isNaN(porc) || porc < 0 || porc > 100) {
        return `Error en línea ${i+1}: Porcentaje de Asistencia inválido (${porcStr}). Debe ser 0..100.`;
        }

        // g) Estado_Salud_Emocional
        const saludStr = row[idxSalud];
        if (!saludValid.includes(saludStr)) {
        return `Error en línea ${i+1}: Estado Salud Emocional inválido (${saludStr}). Use [${saludValid.join(', ')}].`;
        }

        // h) Acompanamiento_Integral_Cod (mismas opciones que animacion: E-, E+, ...)
        const acompStr = row[idxAcomp];
        if (!animacionValid.includes(acompStr)) {
        return `Error en línea ${i+1}: Acompañamiento Integral inválido (${acompStr}). Debe ser una de [${animacionValid.join(', ')}].`;
        }

        // i) Orientacion_Vocacional_Cod
        const orientStr = row[idxOrient];
        if (!animacionValid.includes(orientStr)) {
        return `Error en línea ${i+1}: Orientación Vocacional inválida (${orientStr}). Use [${animacionValid.join(', ')}].`;
        }

        // j) Participacion_Extracurriculares (entero, 0..20)
        const extraStr = row[idxExtra];
        const extra = parseInt(extraStr, 10);
        if (isNaN(extra) || extra < 0 || extra > 20) {
        return `Error en línea ${i+1}: Participación Extracurriculares inválida (${extraStr}). Debe ser un entero 0..20.`;
        }
    }
    // Si todo está OK, retornamos null
    return null;
    }

    // Subir al servidor y procesar
    function predictCSV(file) {
    const messageEl = document.getElementById('upload-message');
    const downloadLink = document.getElementById('download-link');
    const formData = new FormData();
    formData.append('file', file);

    // CSRF token
    const csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]').value;

    showLoaderCSV();

    fetch('/predict_csv/', {
        method: 'POST',
        headers: {
        'X-CSRFToken': csrfToken
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) {
        // Intentamos parsear JSON con el error
        return response.json().then(errData => {
            throw new Error(errData.error || 'Error al procesar el CSV en el servidor.');
        });
        }
        // Si el servidor responde 200 OK con un CSV (content-type: text/csv)
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        downloadLink.href = url;
        downloadLink.download = 'predicciones.csv';
        downloadLink.style.display = 'inline-block';
        downloadLink.click(); // Dispara la descarga inmediata

        // Mensaje de éxito
        messageEl.innerText = 'Predicción completa. Descarga lista.';
        // Liberar la URL temporal tras un tiempo
        setTimeout(() => { window.URL.revokeObjectURL(url); }, 2000);
    })
    .catch(error => {
        console.error('Error:', error);
        messageEl.innerText = error.message;
        messageEl.classList.add('error');
    })
    .finally(() => {
        hideLoaderCSV();
    });
}


document.addEventListener('DOMContentLoaded', function() {
    $('.select2').select2();
});

// Inicializa los valores de los spans al cargar la página
document.addEventListener('DOMContentLoaded', function () {
    const inputsAndSpans = [
        { inputId: 'edad', spanId: 'edadOutput' },
        { inputId: 'num_inasist', spanId: 'inasistencias' },
        { inputId: 'porc_asistencia', spanId: 'porAsistenciaOutput' },
        { inputId: 'extra_participacion', spanId: 'participacionExtra' },
    ];

    inputsAndSpans.forEach(item => {
        const input = document.getElementById(item.inputId);
        const span = document.getElementById(item.spanId);
        span.innerText = input.value;
    });
});
