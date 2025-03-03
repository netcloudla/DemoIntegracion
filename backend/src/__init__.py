from flask import Flask
from .routes import ExtractFieldsRoutes
from .routes import TransformFieldsRoutes

from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def init_app(config):
    app.config.from_object(config)

    app.register_blueprint(ExtractFieldsRoutes.main)
    app.register_blueprint(TransformFieldsRoutes.main)

    return app