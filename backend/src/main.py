from fastapi import FastAPI, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from extractor import extract
import uuid
import os
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
UPLOAD_FOLDER = "../uploads"

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads folder if not exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.post("/extract_from_doc")
def extract_from_doc(
        file_format: str = Form(...),
        file: UploadFile = File(...)
):
    logger.info(f"Received file_format: {file_format}")  # Debug file_format
    logger.info(f"Received file: {file.filename}")

    contents = file.file.read()

    file_path = os.path.join(UPLOAD_FOLDER, str(uuid.uuid4()) + ".pdf")

    with open(file_path, "wb") as f:
        f.write(contents)

    logger.info(f"File saved at: {file_path}")

    try:
        data = extract(file_path, file_format)
        logger.info(f"Extraction successful with format: {file_format}")
    except Exception as e:
        logger.error(f"Error during extraction: {str(e)}")
        data = {
            'error': str(e)
        }

    # Delete the file after processing
    if os.path.exists(file_path):
        os.remove(file_path)
        logger.info(f"File deleted: {file_path}")

    return data

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
