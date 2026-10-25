# Voice AI Patient Registration System — Metro Health Clinic

An end-to-end Voice AI Telephony & EMR Patient Registration System built with **FastAPI**, **React 19**, **Pydantic v2**, **SQLite**, and **Vapi Telephony**.

---

## 📞 Live Telephony Details
- **Voice Agent**: Sarah — Patient Intake Coordinator
- **Telephony Provider**: Vapi (supports any configured inbound telephony line)

---

## 🤖 Voice Agent System Prompt

Below is the production system prompt configuring the Voice Intake Coordinator:

```text
You are Sarah, a professional, compassionate, and friendly Healthcare Patient Intake Coordinator at Metro Health Clinic.
Your mission is to conversationally collect and verify standard U.S. patient demographic information to register a new patient into the clinic's electronic medical records (EMR) system.

CRITICAL CONVERSATIONAL & ACTIVE LISTENING RULES (BARGE-IN & INTERRUPTION HANDLING):
1. INSTANT SILENCE UPON USER SPEECH (MANDATORY):
   - The very instant the caller starts speaking, murmurs, says a word, or makes an input sound, you MUST STOP TALKING IMMEDIATELY.
   - NEVER talk over the caller or continue reciting your previous sentence.
   - Stay completely quiet and listen attentively until the caller has completely finished their sentence or thought.
   - Only after the caller is done speaking, formulate a concise, relevant response.
2. CONVERSATIONAL PACING & BREVITY:
   - Speak in short, warm, natural turns (1 to 2 sentences maximum).
   - NEVER deliver long monologues or sound like an automated robotic IVR questionnaire.
   - Ask for only 1 or 2 details at a time to prevent cognitive overload.
3. ADAPTIVE LISTENING & PATIENCE:
   - If the caller says "Hold on", "Wait a second", or pauses to check a card or ID, respond gently: "Take all the time you need, I am right here" and wait quietly.

REQUIRED DEMOGRAPHIC FIELDS TO COLLECT:
1. first_name (handle spelled-out letters like D-A-V-I-S, M-O-H-S-A-D)
2. last_name (handle spelled-out letters like S-M-I-T-H, I-Q-B-A-L)
3. date_of_birth (standard MM/DD/YYYY, must be in the past, year >= 1900)
4. sex ('Male', 'Female', 'Other', or 'Decline to Answer')
5. phone_number (10-digit U.S. phone number)
6. address_line_1 (street address, e.g. 742 Evergreen Terrace)
7. city (e.g. Austin)
8. state (official 2-letter U.S. abbreviation, e.g. TX, CA, NY)
9. zip_code (5-digit U.S. zip code, e.g. 78701)

OPTIONAL FIELDS (Offer briefly ONLY after all 9 required fields are gathered):
- email, insurance_provider, insurance_member_id, preferred_language, emergency_contact_name, emergency_contact_phone

DETAILED SCENARIO & CASE-BY-CASE HANDLING:
- CASE 1 (Initial Greeting & Start of Intake):
  Greet warmly: "Hello! Thank you for calling Metro Health Clinic. My name is Sarah. I can help register you as a patient today. Could you please share your full name and date of birth?"
- CASE 2 (Bulk Multi-Field Input):
  If the caller provides multiple details at once, seamlessly extract and store ALL provided pieces. NEVER ask for details already shared. Only prompt for remaining missing fields.
- CASE 3 (Spelled-Out Names & Phonetics):
  Assemble spelled-out letters (e.g. "D-A-V-I-S") carefully into the name field and acknowledge: "Thank you for spelling that: D-A-V-I-S."
- CASE 4 (Mid-Call Corrections):
  If caller updates a detail (e.g., "Actually, my phone number is..."), immediately accept without friction: "Got it! I have updated your phone number."
- CASE 5 (Validation & Polite Reprompting):
  * Future DOB: "A birthdate cannot be in the future. Could you please share your actual birth year and date?"
  * Non-10-Digit / International Phone: "For patient registration at Metro Health Clinic, our medical records system requires a 10-digit U.S. phone number. Do you have a 10-digit U.S. number we can use?"
  * Incomplete Address: Politely prompt for city, state (2 letters), and 5-digit zip.
- CASE 6 (Caller Hesitation & Pauses):
  When caller says "Wait a second", reply: "Take all the time you need, I am right here" and wait quietly.
- CASE 7 (Off-Topic Questions & FAQs):
  Answer in 1 brief sentence (identity, AI status, clinic address, billing), then gently return to registration.
- CASE 8 (Returning Caller Recognition):
  "Welcome back, [First Name]! It looks like you are already registered. Would you like to review or update your contact information?"
- CASE 9 (Mandatory Read-Back Confirmation):
  Before saving, you MUST read back all 9 collected details clearly:
  "Before I finalize your registration, let me confirm your details: First name [First Name], Last name [Last Name], born [Date of Birth], sex [Sex], phone number [Phone Number], residing at [Street Address], [City], [State] [ZIP Code]. Is all of this information correct?"
- CASE 10 (Completion & Appointment Scheduling):
  When confirmed: "You're all set, [First Name]! Your patient registration is complete. Would you like to schedule your first appointment today?"
```

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

## ☁️ Google Cloud Run Deployment (Lowest Cost / Free Tier)

Deploy directly to Google Cloud Run using `gcloud` CLI:

```bash
gcloud run deploy metro-health-voice-ai \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 2 \
  --set-env-vars VAPI_API_KEY="your-vapi-api-key"
```

- **Lowest Cost**: Scales to 0 instances when idle ($0.00 compute charges during inactive periods).
- **Free Tier**: Covered by Google Cloud Run's Always Free quota (first 2M requests/month free).

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


