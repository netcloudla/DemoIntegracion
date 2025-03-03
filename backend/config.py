from decouple import config
import os

class Config():
    PATH_PROMPT_DOCUMENTS = config('PATH_PROMPT_DOCUMENTS')
    PATH_SETTING = config('PATH_SETTING')
    PROJECT = config('PROJECT')
    LOCATION = config('LOCATION')
    #os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "src/utils/json/credenciales.json"


class DevelopmentConfig(Config):
    DEBUG = True

config = {
    'development': DevelopmentConfig
}