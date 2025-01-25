# predictor/views.py

import os
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
import json
import pandas as pd
from django.conf import settings
from django_ratelimit.decorators import ratelimit
from io import StringIO

# Importar funciones y objetos del modelo
from .models import (
    cargar_modelo_python,
    predecir_probabilidades_python,
    modelo_path,  # la ruta global
    # Si quieres acceder a "rf_model, columnas_finales, columnas_originales, preprocessor"
    # importarlos también, o simplemente recargar al usar la función
)

# Cargar el modelo entrenado (RandomForest) al inicio
# Retorna 4 valores
modelo_python, columnas_finales, columnas_originales, preprocessor_python = cargar_modelo_python(modelo_path)

# Importar diccionarios
from .utils import cargar_diccionarios
(
    acompanamiento_Integral_Cod,
    animacion_Lectura_Cod,
    anio_Escolar_Cod,
    estado_Salud_Emocional,
    genero_Cod,
    orientacion_Vocacional_Cod
) = cargar_diccionarios()

dicts_categorias = {
    "Acompanamiento_Integral_Cod": acompanamiento_Integral_Cod,
    "Animacion_Lectura_Cod": animacion_Lectura_Cod,
    "Anio_Escolar_Cod": anio_Escolar_Cod,
    "Estado_Salud_Emocional": estado_Salud_Emocional,
    "Genero_Cod": genero_Cod,
    "Orientacion_Vocacional_Cod": orientacion_Vocacional_Cod
}

def index(request):
    """
    Renderiza la plantilla principal con algunos diccionarios
    por si quieres usarlos para selects (si fuera el caso).
    """
    context = {
        'genero_cod': genero_Cod,
        'animacion_cod': animacion_Lectura_Cod,
        'anio_cod': anio_Escolar_Cod,
        'estado_salud_cod': estado_Salud_Emocional,
        'acompanamiento_cod': acompanamiento_Integral_Cod,
        'orientacion_cod': orientacion_Vocacional_Cod,
        'mode': settings.MODE
    }
    return render(request, 'predictor/index.html', context)


##########################
# 1) Prediccion individual via JSON
##########################

@ratelimit(key='ip', rate='50/d', method=ratelimit.ALL, block=True)
def predict(request):
    """
    POST con JSON:
    {
      "datos": {
        "Edad": <int>,
        "Genero_Cod": "...",
        "Numero_Inasistencias": <int>,
        "Animacion_Lectura_Cod": "...",
        "Anio_Escolar_Cod": "...",
        "Porc_Asistencia_Refuerzo": <float>,
        "Estado_Salud_Emocional": "...",
        "Acompanamiento_Integral_Cod": "...",
        "Orientacion_Vocacional_Cod": "...",
        "Participacion_Extracurriculares": <int>
      }
    }
    Retorna un JSON con "resultados": [[probA, probB, probC, probD, probE, clase], ...]
    """
    if request.method == 'POST':
        data = json.loads(request.body or '{}')
        print("[DEBUG] JSON recibido:", data)

        datos_usuario = data.get('datos', {})
        if not datos_usuario:
            return JsonResponse({"error": "No se recibieron datos para predecir."}, status=400)

        # 1) Mapeo de variables categoricas usando dicts_categorias
        for var_cat in dicts_categorias.keys():
            if var_cat in datos_usuario:
                valor_str = datos_usuario[var_cat]
                if valor_str not in dicts_categorias[var_cat]:
                    return JsonResponse({"error": f"Valor '{valor_str}' no válido para {var_cat}."}, status=400)
                # Reemplaza el valor textual con el código numérico
                datos_usuario[var_cat] = dicts_categorias[var_cat][valor_str]

        print("[DEBUG] datos_usuario mapeado:", datos_usuario)

        # 2) Crear DataFrame con 1 fila
        df_entrada = pd.DataFrame([datos_usuario])

        # 3) Llamar predecir_probabilidades_python
        resultados = predecir_probabilidades_python(
            modelo_python,
            df_entrada,
            columnas_originales,   # Asegúrate de que NO es None
            preprocessor_python
        )

        return JsonResponse({"resultados": resultados})

    return JsonResponse({"error": "Método no permitido. Use POST."}, status=405)

##########################
# 2) Prediccion en Lote (CSV)
##########################
@ratelimit(key='ip', rate='20/d', method=ratelimit.ALL, block=True)
def predict_csv(request):
    """
    POST con un archivo CSV conteniendo (al menos) las 10 columnas:
      [Edad, Genero_Cod, Numero_Inasistencias, Animacion_Lectura_Cod,
       Anio_Escolar_Cod, Porc_Asistencia_Refuerzo, Estado_Salud_Emocional,
       Acompanamiento_Integral_Cod, Orientacion_Vocacional_Cod, 
       Participacion_Extracurriculares]

    Convertimos cada variable categórica usando `dicts_categorias`
    y predecimos fila por fila.
    Se añade la columna 'Prediccion' con la clase A..E al CSV que se retorna.
    """
    if request.method == 'POST':
        csv_file = request.FILES.get('file', None)
        if not csv_file:
            return JsonResponse({"error": "No se encontró el archivo CSV en la petición."}, status=400)

        # 1) Leer el CSV
        try:
            df_csv = pd.read_csv(csv_file)
        except Exception as e:
            return JsonResponse({"error": f"Error al leer el CSV: {str(e)}"}, status=400)

        # 2) Validar que tenga las 10 columnas requeridas
        columnas_requeridas = [
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
        ]
        for col in columnas_requeridas:
            if col not in df_csv.columns:
                return JsonResponse({"error": f"No se encontró la columna '{col}' en el CSV."}, status=400)

        # 3) Mapeo de variables categóricas (por ej. "A+" -> 10)
        for var_cat in dicts_categorias.keys():
            if var_cat in df_csv.columns:
                dic_local = dicts_categorias[var_cat]
                def convertir_categoria(x):
                    if x in dic_local:
                        return dic_local[x]
                    else:
                        raise ValueError(f"'{x}' no es válido para '{var_cat}'")
                try:
                    df_csv[var_cat] = df_csv[var_cat].apply(convertir_categoria)
                except ValueError as ve:
                    return JsonResponse({"error": str(ve)}, status=400)

        # 4) Predecir probabilidades
        #    NOTA: A diferencia del predict individual, aquí df_csv puede tener muchas filas.
        #    Llamamos a predecir_probabilidades_python con:
        #      - modelo_python
        #      - df_csv ya mapeado
        #      - columnas_originales (no las finales)
        #      - preprocessor_python
        from .models import predecir_probabilidades_python  # si no está ya importado
        resultados = predecir_probabilidades_python(
            modelo_python,
            df_csv,
            columnas_originales,  # <--- ojo: no columnas_finales
            preprocessor_python
        )
        # `resultados` => lista de listas: [probA, probB, probC, probD, probE, pred_class]

        # 5) Extraer la clase predicha y añadirla al DataFrame
        clases_predichas = [fila[-1] for fila in resultados]  # la última posición es la clase
        df_csv["Prediccion"] = clases_predichas

        # 6) Devolver el CSV con la columna 'Prediccion'
        buffer = StringIO()
        df_csv.to_csv(buffer, index=False, encoding="utf-8-sig")
        response = HttpResponse(buffer.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename=predicciones.csv'
        return response

    # Si no es POST
    return JsonResponse({"error": "Método no permitido. Use POST."}, status=405)
