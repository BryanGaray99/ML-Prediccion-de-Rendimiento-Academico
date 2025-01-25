# predictor/models.py

import os
import pickle
import pandas as pd

from sklearn.model_selection import RandomizedSearchCV, train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from imblearn.over_sampling import SMOTE

# Para métricas y matriz de confusión
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import seaborn as sns
import matplotlib.pyplot as plt

########################################
# 1) Funciones de carga/preprocesamiento
########################################

def cargar_datos_python(file_path, use_smote=True):
    """
    Lee un CSV que debe contener 'Promedio_5CAT' como columna target,
    más estas 10 variables:
      [Edad, Genero_Cod, Numero_Inasistencias, Animacion_Lectura_Cod, 
       Anio_Escolar_Cod, Porc_Asistencia_Refuerzo, Estado_Salud_Emocional,
       Acompanamiento_Integral_Cod, Orientacion_Vocacional_Cod,
       Participacion_Extracurriculares]
    Ignora columnas extra (por ej. 'Promedio_Anual').
    
    Aplica un OneHotEncoder a las columnas categóricas 
    y (opcional) SMOTE para balancear.
    """
    df = pd.read_csv(file_path, encoding="utf-8-sig")
    print("\n[DEBUG] Columnas leídas del CSV:", list(df.columns))

    if "Promedio_5CAT" not in df.columns:
        raise ValueError("No se encontró la columna 'Promedio_5CAT' en el dataset.")

    # Definimos las features que realmente usaremos
    features = [
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
    target = "Promedio_5CAT"

    # Verificar que existan
    for col in features:
        if col not in df.columns:
            raise ValueError(f"[ERROR] La columna '{col}' no existe en el CSV. "
                             f"Columnas disponibles: {list(df.columns)}")

    X = df[features].copy()
    y = df[target].copy()

    # Columnas categoricas vs numericas
    categorical_cols = [
        "Genero_Cod",
        "Animacion_Lectura_Cod",
        "Estado_Salud_Emocional",
        "Acompanamiento_Integral_Cod",
        "Orientacion_Vocacional_Cod"
    ]
    numeric_cols = [
        "Edad",
        "Numero_Inasistencias",
        "Porc_Asistencia_Refuerzo",
        "Participacion_Extracurriculares",
        "Anio_Escolar_Cod"
    ]

    # OneHot
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(drop='first', sparse_output=False), categorical_cols)
        ],
        remainder="passthrough"
    )

    X_pre = preprocessor.fit_transform(X)

    # SMOTE opcional
    if use_smote:
        sm = SMOTE(random_state=42)
        X_final, y_final = sm.fit_resample(X_pre, y)
        print("[DEBUG] Después de SMOTE, X_final.shape =", X_final.shape)
    else:
        X_final, y_final = X_pre, y
        print("[DEBUG] Sin SMOTE, X_final.shape =", X_final.shape)

    # Estas son las 10 columnas "crudas" (sin OneHot)
    columnas_originales = list(X.columns)
    print("[DEBUG] columnas_originales =", columnas_originales)

    return X_final, y_final, preprocessor, columnas_originales


########################################
# 2) Entrenamiento y guardado del modelo
########################################

def entrenar_modelo_python(X, y, preprocessor=None, n_iter=10, test_size=0.3):
    """
    Entrena un RandomForestClassifier con búsqueda aleatoria (RandomizedSearchCV).
    
    Realiza un train_test_split para evaluar el modelo final,
    calcula métricas y guarda la matriz de confusión e informe de clasificación.

    Retorna (modelo_entrenado, columnas_finales).
    """
    # Dividir en train/test para tener evaluación
    X_train, X_test, y_train, y_test = train_test_split(X, y, 
                                                        test_size=test_size, 
                                                        random_state=42,
                                                        stratify=y)

    param_dist = {
        "n_estimators": [50, 100, 200],
        "max_depth": [5, 7, 9, 12, None],
        "min_samples_split": [2, 5, 10],
        "min_samples_leaf": [1, 2, 5]
    }

    rf = RandomForestClassifier(random_state=42)
    random_search = RandomizedSearchCV(
        rf,
        param_distributions=param_dist,
        n_iter=n_iter,
        scoring='accuracy',
        cv=3,
        random_state=42,
        verbose=1,
        n_jobs=-1
    )

    random_search.fit(X_train, y_train)
    best_rf = random_search.best_estimator_

    # Evaluar en test set
    y_pred = best_rf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print("[INFO] Mejor combinación de hiperparámetros:", random_search.best_params_)
    print(f"[INFO] Accuracy en test: {acc:.4f}")

    # Guardar la matriz de confusión
    cm = confusion_matrix(y_test, y_pred)
    plt.figure(figsize=(6,4))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
    plt.title("Matriz de Confusión (RandomForest)")
    plt.xlabel("Predicción")
    plt.ylabel("Valor real")
    plt.tight_layout()
    plt.savefig("./ScoringModel/confusion_matrix.png")
    plt.close()

    # Guardar reporte de clasificación a CSV
    report = classification_report(y_test, y_pred, output_dict=True)
    df_report = pd.DataFrame(report).transpose()
    df_report.to_csv("./ScoringModel/classification_report.csv", index=True)
    print("[INFO] Se guardó 'confusion_matrix.png' y 'classification_report.csv' en ./ScoringModel/")

    # Determinar columnas finales
    if preprocessor is not None:
        ohe_features = preprocessor.named_transformers_["cat"].get_feature_names_out()
        numeric_cols = [
            "Edad",
            "Numero_Inasistencias",
            "Porc_Asistencia_Refuerzo",
            "Participacion_Extracurriculares",
            "Anio_Escolar_Cod"
        ]
        columnas_finales = list(ohe_features) + numeric_cols
    else:
        columnas_finales = [f"col_{i}" for i in range(X.shape[1])]

    print("[DEBUG] columnas_finales (OneHot):", columnas_finales)
    return best_rf, columnas_finales

def guardar_modelo_python(modelo, columnas_finales, preprocessor, modelo_path, columnas_originales=None):
    """
    Guarda el modelo, la lista de columnas finales y originales, y el preprocessor,
    en formato pickle.
    """
    dict_cols = {
        'finales': columnas_finales,
        'originales': columnas_originales
    }
    with open(modelo_path, 'wb') as fm:
        pickle.dump(modelo, fm)
    with open(modelo_path.replace('.pkl','_columns.pkl'), 'wb') as fc:
        pickle.dump(dict_cols, fc)
    with open(modelo_path.replace('.pkl','_preprocessor.pkl'), 'wb') as fp:
        pickle.dump(preprocessor, fp)

    print(f"[DEBUG] Modelo guardado en: {modelo_path}")
    print(f"[DEBUG] columns.pkl => finales={columnas_finales}, originales={columnas_originales}")


def cargar_modelo_python(modelo_path):
    """
    Carga (modelo, columnas_finales, columnas_originales, preprocessor) desde disco.
    """
    with open(modelo_path, 'rb') as fm:
        modelo = pickle.load(fm)

    with open(modelo_path.replace('.pkl','_columns.pkl'), 'rb') as fc:
        all_cols = pickle.load(fc)
        columnas_finales = all_cols['finales']
        columnas_originales = all_cols['originales']

    with open(modelo_path.replace('.pkl','_preprocessor.pkl'), 'rb') as fp:
        preprocessor = pickle.load(fp)

    print("[DEBUG] Al cargar el modelo, columnas_finales =", columnas_finales)
    print("[DEBUG] Al cargar el modelo, columnas_originales =", columnas_originales)
    return modelo, columnas_finales, columnas_originales, preprocessor

########################################
# 3) Predicción
########################################

def predecir_probabilidades_python(modelo, df_entrada, cols_originales, preprocessor):
    """
    Recibe un DataFrame df_entrada con las mismas columnas originales (sin OneHot),
    lo reordena con 'cols_originales', aplica preprocessor (OneHotEncoder),
    y llama a 'predict_proba' y 'predict'.

    Retorna lista de listas: 
      [
        [prob_classA, prob_classB, prob_classC, prob_classD, prob_classE, class_pred],
        ...
      ]
    """
    if cols_originales is None:
        raise ValueError("[ERROR] No se definieron las columnas originales para la predicción.")

    print("[DEBUG] df_entrada.columns antes de recortar:", list(df_entrada.columns))
    print("[DEBUG] cols_originales a usar:", cols_originales)

    df_entrada = df_entrada[cols_originales].copy()  # recortar
    print("[DEBUG] df_entrada.shape tras recorte:", df_entrada.shape)

    # Aplicar la transformación (OneHot, etc.)
    df_transf = preprocessor.transform(df_entrada)
    print("[DEBUG] df_transf.shape tras preprocessor:", df_transf.shape)

    probabilidades = modelo.predict_proba(df_transf)
    predicciones = modelo.predict(df_transf)

    resultados = []
    for i in range(len(probabilidades)):
        fila_prob = [float(prob) for prob in probabilidades[i]]  # p.ej. 5 probabilidades
        fila_final = fila_prob + [str(predicciones[i])]          # + la clase (A..E)
        resultados.append(fila_final)

    return resultados

########################################
# 4) Entrenar/cargar automáticamente el modelo
########################################

modelo_path = "./ScoringModel/random_forest_model.pkl"
file_path = "./ETL/Dataset/datos_2022_2027_proyectado_seleccion.csv"

if not os.path.exists(modelo_path):
    print(f"[INFO] No existe {modelo_path}. Entrenando modelo...")
    X, y, preprocessor, columnas_originales = cargar_datos_python(file_path, use_smote=True)
    rf_model, columnas_finales = entrenar_modelo_python(
        X, y,
        preprocessor=preprocessor, 
        n_iter=10,            # puedes ajustar
        test_size=0.3         # tamaño del test
    )
    guardar_modelo_python(rf_model, columnas_finales, preprocessor, modelo_path, 
                          columnas_originales=columnas_originales)
    print(f"[INFO] Modelo entrenado y guardado en: {modelo_path}")
else:
    print(f"[INFO] Ya existe {modelo_path}, cargándolo...")
    rf_model, columnas_finales, columnas_originales, preprocessor = cargar_modelo_python(modelo_path)
