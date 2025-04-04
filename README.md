
This project runs **three separate services**:

- 🖥️ **Frontend** (React + Vite) → `http://localhost:5173`  
- 📧 **Node.js Mail Backend** → `http://localhost:7000`  
- 🧪 **Python Image Processing Backend (FastAPI)** → `http://localhost:8000`

---

## 📁 Folder Structure
project-root/
  client/ # Frontend (React) 
  server/ # Backend (Node.js for mail) 
  main.py # Python FastAPI entry point 

### 1️⃣ Frontend Setup (Port 5173)

cd client
npm install --force
npm run dev

2️⃣ Node.js Backend for Mail (Port 7000)
cd ../server
npm install
npm start

3️⃣ Python Backend for Image Processing (Port 8000)

1.Navigate to the project root:
  cd ..
  
2.Create a virtual environment:
  python -m venv venv

3.Activate the virtual environment:
  Windows: .\venv\Scripts\activate
  Mac:   source venv/bin/activate
  
4.Install required dependencies:
   pip install -r requirements.txt

5.Run the FastAPI server:
  uvicorn main:app --reload






