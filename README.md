---
title: AI Calling Agent
emoji: 🏥
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# Voice AI Patient Registration System — Metro Health Clinic

An end-to-end Voice AI Telephony & EMR Patient Registration System built with **FastAPI**, **React 19**, **Pydantic v2**, **SQLite**, and **Vapi Telephony**.

---

## 📞 Live Telephony Details
- **Voice Agent**: Sarah — Patient Intake Coordinator
- **Telephony Provider**: Vapi (supports any configured inbound telephony line)

---

## 🚀 Key Features
- **Voice AI Intake**: Inbound phone calls automatically collect, verify, and register patient demographics with read-back confirmation.
- **Returning Caller Recognition**: Recognizes callers by phone number and personalizes greeting.
- **Strict Pydantic Validation**: Validates 10-digit U.S. phones, non-future DOB (`MM/DD/YYYY`), valid 2-letter U.S. states, and 5-digit/ZIP+4 codes.
- **Real-Time Validation Failure & Recovery Queue**: If caller disconnects early or enters invalid data, the system flags it in real-time with the exact error cause and audio playback so clinic staff can **"Fix & Register"** directly into the EMR.
- **Modern Clinical Dashboard**: Patient demographic search, audio recordings, quality metrics, and call logs.

---

## 🛠 Local Setup & Running

### 1. Prerequisites
- Python 3.10+
- Node.js 18+

### 2. Backend Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
cd src
uvicorn main:app --host 127.0.0.1 --port 8080 --reload
```
API runs at: `http://127.0.0.1:8080` (Docs: `http://127.0.0.1:8080/docs`)

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Dashboard runs at: `http://127.0.0.1:5173`

---

## ☁️ Render Deployment (Single Web Service)

This repository includes a `render.yaml` blueprint for 1-click cloud deployment:

- **Runtime**: Python 3
- **Build Command**:
  ```bash
  pip install -r requirements.txt && cd frontend && npm install && npm run build && cd ..
  ```
- **Start Command**:
  ```bash
  cd src && uvicorn main:app --host 0.0.0.0 --port $PORT
  ```
- **Environment Variables**:
  - `PYTHON_VERSION`: `3.11.9`
  - `VAPI_API_KEY`: *(Your Vapi Private Key)*
  - `VAPI_PHONE_NUMBER_ID`: *(Your Vapi Phone Number ID)*
  - `VAPI_ASSISTANT_ID`: `53aec48e-3915-4e04-a782-f4ff2e59434d`

---

## 📡 REST API Endpoints

All responses use the standard JSON envelope: `{ "data": ..., "error": null }`.

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/patients` | List/search patients (query by name, phone, DOB) |
| `POST` | `/api/patients` | Register new patient (server-side Pydantic validation) |
| `GET` | `/api/patients/{id}` | Get single patient record by UUID |
| `PUT` | `/api/patients/{id}` | Update patient record |
| `DELETE` | `/api/patients/{id}` | Soft delete patient record |
| `GET` | `/api/patients/failures` | Real-time queue of failed or incomplete intakes |
| `POST` | `/api/patients/failures/{id}/fix` | Resolve failure and register patient into EMR |
| `POST` | `/api/patients/failures/{id}/dismiss` | Dismiss an intake failure |
| `GET` | `/api/patients/calls` | Get call sessions & audio recordings |
| `POST` | `/api/vapi/webhook` | Vapi telephony webhook for live inbound calls |
| `GET` | `/health` | Health check endpoint |

---

## 🧪 Running Unit Tests
```bash
python -m pytest tests/test_patients_api.py -v
```
