from flask import Blueprint, json, request, jsonify
import pandas as pd
from flask_cors import CORS
from src.services.TransformFieldsService import TransformFieldsService
main = Blueprint('transform-fields_blueprint', __name__)
import unidecode

def limpiar_nombre(col):
    col = col.strip().lower()  # Convertir a minúsculas y quitar espacios al inicio/final
    col = unidecode.unidecode(col)  # Quitar tildes
    col = col.replace(" ", "_")  # Reemplazar espacios por "_"
    col = "".join(c if c.isalnum() or c == "_" else "" for c in col)  # Eliminar caracteres especiales
    return col


@main.route('/transform-fields', methods=['POST'])
def process_first_doc():
    try:
        datos = request.get_json()  # Recibe el JSON desde React
        df = pd.DataFrame(datos)  # Convierte a DataFrame
        df = df.astype(str)
        df.columns = [limpiar_nombre(col) for col in df.columns]
        print(df)
        response = TransformFieldsService.create_table(df)
        

        return jsonify({"mensaje": "Datos recibidos correctamente", "filas": len(df)}), 200
        
    except Exception as ex:

        return jsonify({'message': "ERROR", 'success': False})