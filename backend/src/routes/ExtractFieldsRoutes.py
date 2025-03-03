from flask import Blueprint, json, request, jsonify
from src.services.ExtractFieldsService import ExtractFieldsService
main = Blueprint('extract-fields_blueprint', __name__)



@main.route('/extract-fields', methods=['POST'])
def process_first_doc():
    try:
        columnas = request.get_json()

        if not columnas:
            return jsonify({'message': "columnas no enviadas", 'success': False})
            
        response = ExtractFieldsService.get_fields(columnas=columnas)
        campos_texto = response.split("[campos]:")[1].strip()
        campos_array = [campo.strip() for campo in campos_texto.split(",")]

        return jsonify({'data': campos_array, 'success': True})
        
    except Exception as ex:

        return jsonify({'message': "ERROR", 'success': False})