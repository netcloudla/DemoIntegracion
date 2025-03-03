import pandas as pd
from src.services.ExtractFieldsService import ExtractFieldsService

archivo_1 = 'test/Clientes.xlsx'
archivo_2 = 'test/Productos.xlsx'
archivo_3 = 'test/Ventas.xlsx'

df1 = pd.read_excel(archivo_1)
df2 = pd.read_excel(archivo_2)
df3 = pd.read_excel(archivo_3)

columnas_df1 = df1.columns.tolist()
columnas_df2 = df2.columns.tolist()
columnas_df3 = df3.columns.tolist()

# Guardar los nombres en un diccionario (opcional)
columnas = {
    "DataFrame 1": columnas_df1,
    "DataFrame 2": columnas_df2,
    "DataFrame 3": columnas_df3
}
