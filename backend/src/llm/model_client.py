import vertexai
from vertexai.generative_models import GenerativeModel, SafetySetting
import yaml
from decouple import config

class ModelClient:
    def __init__(self):

        PROJECT = config('PROJECT_V2')
        LOCATION = config('LOCATION')
        
        vertexai.init(project=PROJECT, location=LOCATION)
        self.model_config, self.safety_settings = self.load_llm_config()

    def load_llm_config(self):
        PATH_SETTING = config('PATH_SETTING')
        with open(PATH_SETTING, 'r') as file:
            setting_config = yaml.safe_load(file)
        model_config = setting_config['generation_config']
        safety_settings = []
        
        for setting in setting_config['safety_settings']:
            safety_settings.append(
                SafetySetting(
                    category=SafetySetting.HarmCategory[setting['category']],
                    threshold=SafetySetting.HarmBlockThreshold[setting['threshold']],
                )
            )
        
        return model_config, safety_settings

    def get_response(self, prompt: str) -> str:
        generation_config = {
            "max_output_tokens": self.model_config['max_output_tokens'],
            "temperature": self.model_config['temperature'],
            "top_p": self.model_config['top_p'],
        }
        
        model = GenerativeModel(
            self.model_config['model'],
        )
        
        try:
            answer = model.generate_content(
                [prompt],
                generation_config=generation_config,
                safety_settings=self.safety_settings,
                stream=False,
            )
            return answer.text
        except ValueError as e:
            print("Ocurrio un error en el LLM: ", e)
        
        return -1