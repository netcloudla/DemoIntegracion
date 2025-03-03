import traceback

from src.llm.fields_extractor import FieldsExtractor

class ExtractFieldsService():

    @classmethod
    def get_question(cls, question):
        try:
            fields_service = FieldsExtractor(question)
            answer = fields_service.default()
            print(answer)
            return answer
        except Exception as ex:
            print("error First", str(ex))
            return None
        
    def get_fields(columnas):
        try:
            fields_service = FieldsExtractor("none")
            answer = fields_service.identify_fields(columnas)
            return answer
        except Exception as ex:
            print("error First", str(ex))
            return None