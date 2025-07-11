from fastapi import FastAPI
import os

app = FastAPI()

@app.get("/config")
def get_config():
    return {
        "COSMOS_DB_ENDPOINT": os.getenv("COSMOS_DB_ENDPOINT", "NOT_SET"),
        "AIDIAGEXPERT_ENDPOINT": os.getenv("AIDIAGEXPERT_ENDPOINT", "NOT_SET"),
        "AIDIAGEXPERT_KEY": os.getenv("AIDIAGEXPERT_KEY", "NOT_SET"),
        "AZURE_STORAGE_CONNECTION_STRING_1": os.getenv("AZURE_STORAGE_CONNECTION_STRING_1", "NOT_SET")
    }
