# predictor/utils.py

import pandas as pd

def cargar_diccionarios():
    """
    Carga los CSV que definen la correspondencia entre
    texto (A+, A-, B+, ...) y código numérico (10, 9, 8...).
    Retorna una tupla con 6 diccionarios:
      (acompanamiento_Integral_Cod,
       animacion_Lectura_Cod,
       anio_Escolar_Cod,
       estado_Salud_Emocional,
       genero_Cod,
       orientacion_Vocacional_Cod)
    """
    acompanamiento_Integral_Cod = pd.read_csv('ETL/DD/Acompanamiento_Integral_Cod.csv') \
                                   .set_index('Acompanamiento_Integral_Cod')['CODIGO'].to_dict()
    animacion_Lectura_Cod = pd.read_csv('ETL/DD/Animacion_Lectura_Cod.csv') \
                             .set_index('Animacion_Lectura_Cod')['CODIGO'].to_dict()
    anio_Escolar_Cod = pd.read_csv('ETL/DD/Anio_Escolar_Cod.csv') \
                       .set_index('Anio_Escolar_Cod')['CODIGO'].to_dict()
    estado_Salud_Emocional = pd.read_csv('ETL/DD/Estado_Salud_Emocional.csv') \
                              .set_index('Estado_Salud_Emocional')['CODIGO'].to_dict()
    genero_Cod = pd.read_csv('ETL/DD/Genero_Cod.csv') \
                  .set_index('Genero_Cod')['CODIGO'].to_dict()
    orientacion_Vocacional_Cod = pd.read_csv('ETL/DD/Orientacion_Vocacional_Cod.csv') \
                                  .set_index('Orientacion_Vocacional_Cod')['CODIGO'].to_dict()

    return (acompanamiento_Integral_Cod,
            animacion_Lectura_Cod,
            anio_Escolar_Cod,
            estado_Salud_Emocional,
            genero_Cod,
            orientacion_Vocacional_Cod)
