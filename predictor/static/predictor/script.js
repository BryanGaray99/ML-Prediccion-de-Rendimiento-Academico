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
    document.getElementById('download-report').style.display = 'none'; 
    
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

    if (!numInasistencias || isNaN(numInasistencias) || numInasistencias < 0 || numInasistencias > 20) {
        errores.push('El número de inasistencias debe estar entre 0 y 20.');
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
                                const percentage = context.raw + '%';
                                const index = context.dataIndex;
                                let message = "";
                                if (index === 0) {
                                    message = "Destrezas o Aprendizajes Alcanzados";
                                } else if (index === 1 || index === 2) {
                                    message = "Destrezas o Aprendizajes en Proceso de Desarrollo";
                                } else if (index === 3 || index === 4) {
                                    message = "Destrezas o Aprendizajes Iniciados";
                                }
                                return percentage + " - " + message;
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

        const finalText = resultadoFinalText[prediccionFinal] || 'Sin resultado';
        document.getElementById('finalPrediction').innerText = finalText;
    
        // Almacenar en variables globales para que el reporte las utilice
        window.predictedLetter = prediccionFinal;
        window.predictionText = finalText;
        window.probabilities = probabilidades;
        window.labels = labels;
    
        // Mostrar el enlace para descargar el reporte solo si la predicción es exitosa
        document.getElementById('download-report').style.display = 'inline-block';
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('finalPrediction').innerText = error.message;
        document.getElementById('finalPrediction').style.color = 'red';
        document.getElementById('download-report').style.display = 'none';
    })
    .finally(() => {
        hideLoaderChart();
    });
}

function downloadReport() {
    // Crear timestamp para incluir en el reporte y en el nombre del archivo
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    const second = now.getSeconds().toString().padStart(2, '0');
    const timestampStr = `${year}${month}${day}_${hour}${minute}${second}`;

    // Instanciar jsPDF (se asume que se utiliza la versión 2.x vía jspdf.umd)
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 10; // Posición vertical inicial

    // --- Encabezado del reporte ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0, 102, 204); // Azul para el título
    doc.text("Reporte de Predicción", 105, y, { align: 'center' });
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(`Fecha de generación: ${timestampStr}`, 105, y, { align: 'center' });
    y += 12;

    // --- Sección: Datos de entrada ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Datos de entrada", 10, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const formFields = [
        { id: 'anio_escolar_cod', label: 'Año Escolar' },
        { id: 'genero_cod', label: 'Género' },
        { id: 'edad', label: 'Edad' },
        { id: 'num_inasist', label: 'Número de Inasistencias' },
        { id: 'porc_asistencia', label: 'Asistencia a Refuerzo (%)' },
        { id: 'extra_participacion', label: 'Actividades Extracurriculares' },
        { id: 'salud_emocional', label: 'Estado Salud / Emocional' },
        { id: 'anim_lectura_cod', label: 'Animación Lectura' },
        { id: 'acomp_integral_cod', label: 'Acompañamiento Integral' },
        { id: 'orientacion_voc_cod', label: 'Orientación Vocacional' }
    ];

    formFields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) {
            let value = element.value;
            let line = `${field.label}: ${value}`;
            doc.text(line, 10, y);
            y += 7;
            if (y > 280) {
                doc.addPage();
                y = 10;
            }
        }
    });
    y += 5;

    // --- Sección: Probabilidades por clase ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Probabilidades por clase", 10, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    if (window.labels && window.probabilities) {
        for (let i = 0; i < window.labels.length; i++) {
            const line = `${window.labels[i]}: ${window.probabilities[i]}%`;
            doc.text(line, 10, y);
            y += 7;
        }
    } else {
        doc.text("No se encontraron probabilidades.", 10, y);
        y += 7;
    }
    y += 5;

    // --- Sección: Predicción final ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Predicción final", 10, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const finalPredictionText = window.predictionText || document.getElementById("finalPrediction").innerText || "";
    doc.text(finalPredictionText, 10, y);
    y += 10;

    // --- Sección: Gráfico generado ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Gráfico generado", 10, y);
    y += 8;
    const canvas = document.getElementById("predictionChart");
    if (canvas) {
        const imgData = canvas.toDataURL("image/png", 1.0);
        // Calcular dimensiones manteniendo la proporción del canvas
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const pdfImageWidth = 100; // ancho máximo (márgenes 10 en cada lado)
        const pdfImageHeight = (canvasHeight * pdfImageWidth) / canvasWidth;
        doc.addImage(imgData, 'PNG', 10, y, pdfImageWidth, pdfImageHeight);
        y += pdfImageHeight + 10;
    } else {
        doc.text("No se encontró el gráfico.", 10, y);
        y += 10;
    }

    // --- Sección: Interpretación ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Interpretación", 10, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80); // Gris oscuro para el cuerpo

    // Determinar la interpretación según la letra predicha
    const predictedLetter = window.predictedLetter || "";
    let interpretation = "";
    if (predictedLetter === "A") {
        interpretation = "Equivalencia según el Reglamento General a la Ley Orgánica de Educación Intercultural 2024\n" + "Destreza o aprendizaje alcanzado:\n" +
            "Se estima que el estudiante demuestre un manejo completo de las habilidades, conocimientos y procedimientos adquiridos, " +
            "aplicándolos de forma autónoma y eficiente tanto en situaciones prácticas como complejas, trabajando con éxito " +
            "de manera individual y en equipo.";
    } else if (predictedLetter === "B" || predictedLetter === "C") {
        interpretation = "Equivalencia según el Reglamento General a la Ley Orgánica de Educación Intercultural 2024\n" + "Destreza o aprendizaje en proceso de desarrollo:\n" +
            "Se estima que el estudiante evidencie una comprensión parcial de las habilidades y conocimientos, " +
            "aplicándolos en contextos simples y predecibles con apoyo ocasional del docente. Se proyecta que presente " +
            "limitaciones en el trabajo autónomo y colaborativo, pero esté en camino de consolidar sus aprendizajes. ";
    } else if (predictedLetter === "D" || predictedLetter === "E") {
        interpretation = "Equivalencia según el Reglamento General a la Ley Orgánica de Educación Intercultural 2024\n" + "Destreza o aprendizaje iniciado:\n" +
            "Se estima que el estudiante enfrente dificultades significativas para aplicar habilidades y conocimientos básicos. " +
            "Requerirá intervención constante y orientación docente para completar las tareas asignadas. Este nivel muestra un " +
            "desarrollo inicial en su proceso de aprendizaje.";
    } else {
        interpretation = "No se encontró una interpretación para el resultado predicho.";
    }
    const splitInterpretation = doc.splitTextToSize(interpretation, 190);
    doc.text(splitInterpretation, 10, y);
    y += (splitInterpretation.length * 7) + 10;

    // --- Guardar el PDF con nombre que incluye el timestamp ---
    doc.save(`reporte_prediccion_${timestampStr}.pdf`);
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

        // c) Numero_Inasistencias (entero, 0..20)
        const inasistStr = row[idxInasist];
        const inasist = parseInt(inasistStr, 10);
        if (isNaN(inasist) || inasist < 0 || inasist > 20) {
        return `Error en línea ${i+1}: Número de inasistencias inválido (${inasistStr}). Debe ser 0..20.`;
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
