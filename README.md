
# Random Forest Simulator

![Preview](https://i.ibb.co/6mvdCDD/preview.png)

## Descripción

Random Forest Simulator es una aplicación web construida con Django que permite predecir datos utilizando modelos de machine learning. La aplicación soporta un modelo clasificatorio entrenado en Python, y proporciona una interfaz intuitiva para cargar datos y hacer predicciones de rendimiento académico basado en una serie de variables que se explican mediante tooltips sobre los campos.

## Características

- **Predicción con Modelo en Python**: El servidor al inciar construye un modelo clasificatorio de Random Forest que se exporta como un pkl
- **Cargador de CSV**: Los usuarios pueden cargar archivos CSV para predecir un conjunto de datos.
- **Validación de Entradas**: El formulario de predicción incluye validaciones para asegurar que los datos de entrada sean correctos.
- **Gráfico de Resultados**: Los resultados de las predicciones se muestran en un gráfico de barras que indica las probabilidades de diferentes rangos.

## Arquitectura del Proyecto

El proyecto está estructurado en varias partes clave:

- **Backend (Django)**: Maneja las solicitudes del usuario, procesa los datos, y realiza las predicciones utilizando modelos de machine learning.
- **Frontend (HTML, CSS, JavaScript)**: Proporciona la interfaz de usuario para cargar datos, realizar predicciones y mostrar los resultados.
- **Modelos de Machine Learning (Python)**: Implementaciones de modelos de machine learning que se utilizan para realizar las predicciones.
- **Procesos ETL**: Procesos de extracción, transformación y carga que preparan los datos para el entrenamiento y predicción de modelos.

## Instalación

1. Clona el repositorio:

    ```sh
    git clone https://github.com/tu-usuario/decision-tree-simulator.git
    cd decision-tree-simulator
    ```

2. Crea y activa un entorno virtual:

    ```sh
    python -m venv env
    source env/bin/activate  # En Windows usa `env\Scripts\activate`
    ```

3. Instala las dependencias:

    ```sh
    pip install -r requirements.txt
    ```

4. Configura las variables de entorno:

    Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

    ```env
    SECRET_KEY='your-secret-key'
    MODE='developmen or production'
    DATABASE_URL='your-database-url-connection-string'
    DEBUG='True'
    ```

5. Realiza las migraciones de la base de datos:

    ```sh
    python manage.py migrate
    ```

6. Ejecuta el servidor de desarrollo:

    ```sh
    python manage.py runserver
    ```

## Uso

1. **Formulario de Predicción**:
    - Ingresa los datos requeridos en el formulario.
    - Haz clic en "Predecir" para ver los resultados.

2. **Predicción con CSV**:
    - Ve a la sección de carga de CSV.
    - Descarga el template con instrucciones y agrega tus datos, asegurate de borrar las intrucciones.
    - Carga tu csv
    - Si todo está correcto, se descarga automáticamente tu archivo con predicciones.

## Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue o un pull request en GitHub.

## Autor

**Bryan Garay**
- **Correo**: bryangarayacademico@gmail.com

Si tienes alguna pregunta o sugerencia, no dudes en ponerte en contacto.

---

¡Gracias por usar Random Forest Simulator!
