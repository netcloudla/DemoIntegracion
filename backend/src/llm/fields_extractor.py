from decouple import config
from src.llm.model_client import ModelClient
from src.llm.prompts.prompt_manager import PromptManager

class FieldsExtractor:
    def __init__(self, question):
        PATH_PROMPTS = config('PATH_PROMPT_DOCUMENTS')
        self.llm_service = ModelClient()
        self.prompt_manager = PromptManager(PATH_PROMPTS)
        self.question = question

    def default(self):
        
        variables = {
            'content': self.question,
        }

        prompt = self.prompt_manager.format_prompt("default", variables)
        response = self.llm_service.get_response(prompt)
        return response
    
    def identify_fields(self,campos_excel):
        text_campos = ""
        for df_name, columnas in campos_excel.items():
            text_campos += f"- {df_name}: {columnas}\n"
        
        variables = {
            'content': text_campos
        }

        prompt = self.prompt_manager.format_prompt("identify_fields", variables)
        response = self.llm_service.get_response(prompt)
        return response