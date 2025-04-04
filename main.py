import os
import cv2
import pytesseract
import spacy
import numpy as np
import openai
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
 
# Initialize FastAPI app
app = FastAPI()
 
# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Change this to specific origins if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
# Configure Tesseract OCR path (Ensure Tesseract is installed)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
 
# Load NLP model
nlp = spacy.load("en_core_web_sm")
 
# OpenAI GPT Configuration (Replace with actual API key)
OPENAI_API_KEY = ""
client = openai.OpenAI(api_key=OPENAI_API_KEY)
 
def clean_text_with_gpt(text):
    """Cleans extracted text using GPT-4"""
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that cleans and formats extracted text."},
            {"role": "user", "content": f"Clean and properly format this text: {text}"}
        ]
    )
    return response.choices[0].message.content.strip()
 
def extract_medicines(text):
    """Extracts potential medicine names using NLP"""
    doc = nlp(text)
    medicines = set()
   
    for entity in doc.ents:
        if entity.label_ in ["PRODUCT", "ORG"]:  # PRODUCT often captures drug names
            medicines.add(entity.text)
   
    return list(medicines) if medicines else text.split("\n")  # Fallback to line splitting
 
@app.post("/process_prescription")
async def process_prescription(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes))
   
    extracted_text = pytesseract.image_to_string(np.array(image))
    medicines_list = extract_medicines(extracted_text)
   
    return {
        "detected_medicines": medicines_list,
        "extracted_text": extracted_text
            }
 
# Run using: uvicorn filename:app --reload