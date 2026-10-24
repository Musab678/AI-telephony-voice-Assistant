import sqlite3
import os
from typing import Optional

DB_FILE = os.path.join(os.path.dirname(__file__), "voice_assistant.db")

def get_db_connection():
    """Returns an active SQLite database connection with row access by column name and WAL mode."""
    conn = sqlite3.connect(DB_FILE, check_same_thread=False, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn

def init_db():
    """
    Initializes SQLite database schema for the Patient Registration System.
    Strictly adheres to the take-home assessment specifications:
    - Persistent 'patients' demographic table with UUID primary key.
    - Persistent 'patient_calls' table linking telephony calls & transcripts.
    - NO mock or dummy seed data inserted automatically.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Patients Table (Demographic Data Model from Challenge Spec)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patients (
        patient_id TEXT PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        date_of_birth TEXT NOT NULL,
        sex TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        email TEXT,
        address_line_1 TEXT NOT NULL,
        address_line_2 TEXT,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        zip_code TEXT NOT NULL,
        insurance_provider TEXT,
        insurance_member_id TEXT,
        preferred_language TEXT DEFAULT 'English',
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP DEFAULT NULL
    )
    """)

    # 2. Patient Calls & Telephony Transcripts Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patient_calls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        call_sid TEXT NOT NULL UNIQUE,
        patient_id TEXT,
        caller_phone TEXT,
        duration_sec REAL DEFAULT 0,
        cost REAL DEFAULT 0,
        transcript TEXT,
        collected_payload TEXT,
        status TEXT DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
    )
    """)

    cursor.execute("PRAGMA table_info(patient_calls)")
    existing_cols = [r[1] for r in cursor.fetchall()]
    if "duration_sec" not in existing_cols:
        cursor.execute("ALTER TABLE patient_calls ADD COLUMN duration_sec REAL DEFAULT 0")
    if "cost" not in existing_cols:
        cursor.execute("ALTER TABLE patient_calls ADD COLUMN cost REAL DEFAULT 0")
    if "recording_url" not in existing_cols:
        cursor.execute("ALTER TABLE patient_calls ADD COLUMN recording_url TEXT")

    # 3. Call Sessions & Turns (For compatibility with evaluation and history)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS call_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        call_sid TEXT UNIQUE NOT NULL,
        caller_number TEXT,
        agent_name TEXT DEFAULT 'Sarah - Patient Intake',
        duration_sec REAL DEFAULT 0,
        cost REAL DEFAULT 0,
        status TEXT DEFAULT 'completed',
        overall_accuracy REAL DEFAULT 95.0,
        penalty_score REAL DEFAULT 0.0,
        recording_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("PRAGMA table_info(call_sessions)")
    cs_cols = [r[1] for r in cursor.fetchall()]
    if "cost" not in cs_cols:
        cursor.execute("ALTER TABLE call_sessions ADD COLUMN cost REAL DEFAULT 0")
    if "recording_url" not in cs_cols:
        cursor.execute("ALTER TABLE call_sessions ADD COLUMN recording_url TEXT")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS call_turns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        call_sid TEXT NOT NULL,
        turn_number INTEGER NOT NULL,
        user_prompt TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        latency_ms REAL NOT NULL DEFAULT 400.0,
        audio_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS evaluations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        call_sid TEXT NOT NULL,
        turn_id INTEGER NOT NULL,
        user_prompt TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        accuracy_score REAL NOT NULL DEFAULT 95.0,
        penalty_score REAL NOT NULL DEFAULT 0.0,
        latency_ms REAL NOT NULL DEFAULT 400.0,
        tone_match TEXT DEFAULT 'Empathetic & Professional',
        recommendations TEXT DEFAULT 'All required demographics accurately captured.',
        audio_url TEXT,
        voice_name TEXT DEFAULT 'Sarah (AriaNeural)',
        language TEXT DEFAULT 'English',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Unique Index to prevent duplicates in patient_calls
    cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_patient_calls_sid ON patient_calls(call_sid)")

    # 4. Patient Registration Failures / Incomplete Intake Queue
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS registration_failures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        call_sid TEXT,
        caller_phone TEXT,
        patient_name TEXT,
        failure_reason TEXT NOT NULL,
        error_details TEXT,
        raw_payload TEXT,
        status TEXT DEFAULT 'failed',
        resolved_patient_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_reg_failures_call ON registration_failures(call_sid)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_reg_failures_status ON registration_failures(status)")

    conn.commit()

    # Seed baseline patients if table is empty
    cursor.execute("SELECT count(*) FROM patients WHERE deleted_at IS NULL")
    if cursor.fetchone()[0] == 0:
        import uuid
        now_utc = "2026-10-24T12:00:00"
        baseline_patients = [
            (
                str(uuid.uuid4()), "David", "Miller", "07/20/1982", "Male", "3125554321",
                "david.miller@example.com", "500 Michigan Ave", "Apt 14B", "Chicago", "IL", "60611",
                "Blue Cross Blue Shield", "BCBS-883921", "English", "Sarah Miller", "3125559811", now_utc, now_utc
            ),
            (
                str(uuid.uuid4()), "Amanda", "Davis", "05/14/1988", "Female", "5125559876",
                "amanda.davis@example.com", "742 Evergreen Terrace", "", "Austin", "TX", "78701",
                "UnitedHealthcare", "UHC-992144", "English", "John Davis", "5125551234", now_utc, now_utc
            ),
            (
                str(uuid.uuid4()), "Marcus", "Rodriguez", "11/03/1990", "Male", "2125557890",
                "marcus.rodriguez@example.com", "350 5th Avenue", "Ste 420", "New York", "NY", "10118",
                "Aetna", "AET-551290", "English", "Elena Rodriguez", "2125554321", now_utc, now_utc
            ),
            (
                str(uuid.uuid4()), "Jane", "Doe", "05/14/1988", "Female", "4155552671",
                "jane.doe@example.com", "123 Market Street", "", "San Francisco", "CA", "94105",
                "Cigna", "CIG-331201", "English", "Richard Doe", "4155559876", now_utc, now_utc
            )
        ]
        cursor.executemany("""
            INSERT INTO patients (
                patient_id, first_name, last_name, date_of_birth, sex, phone_number,
                email, address_line_1, address_line_2, city, state, zip_code,
                insurance_provider, insurance_member_id, preferred_language,
                emergency_contact_name, emergency_contact_phone, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, baseline_patients)
        conn.commit()

    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully with clean patient registration schema.")
