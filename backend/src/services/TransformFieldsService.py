import traceback
from google.cloud import bigquery

from src.llm.fields_extractor import FieldsExtractor

class TransformFieldsService():

    @classmethod
    def create_table(cls,dataframe):
        try:
            client = bigquery.Client()

            project_id = "netcloud-genai"
            dataset_id = "datasets"
            table_id = "testing"
            table_ref = f"{project_id}.{dataset_id}.{table_id}"

            schema = [bigquery.SchemaField(col, "STRING") for col in dataframe.columns]


            # Configurar el esquema basado en el DataFrame
            job_config = bigquery.LoadJobConfig(
                schema=schema,  # Detecta automáticamente los tipos de datos
                write_disposition="WRITE_TRUNCATE"  # Falla si la tabla ya existe
            )

            # Crear la tabla en BigQuery (si no existe)
            client.load_table_from_dataframe(dataframe.astype(str), table_ref, job_config=job_config).result()
        except Exception as ex:
            print("error First", str(ex))
            return None