from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import psycopg2 

app = FastAPI(title="DeepShield API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- THE VAULT KEYS ---
DB_HOST = "localhost"
DB_NAME = "deepshield_db"
DB_USER = "deepshield_user"
DB_PASS = "deepshield_password"

class UserAuth(BaseModel):
    email: str
    password: str

@app.on_event("startup")
def startup_db_setup():
    try:
        conn = psycopg2.connect(host=DB_HOST, dbname=DB_NAME, user=DB_USER, password=DB_PASS)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print("ERROR:", e)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "System & Vault Online!"}

# --- REGISTRATION SYSTEM ---
@app.post("/register")
def register_user(user: UserAuth):
    try:
        conn = psycopg2.connect(host=DB_HOST, dbname=DB_NAME, user=DB_USER, password=DB_PASS)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (email, password_hash) VALUES (%s, %s)", (user.email, user.password))
        conn.commit()
        cursor.close()
        conn.close()
        return {"status": "success", "message": "Identity Secured!"}
    except psycopg2.errors.UniqueViolation:
        raise HTTPException(status_code=400, detail="Email already exists!")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Registration failed.")

# --- NEW: LOGIN SYSTEM ---
@app.post("/login")
def login_user(user: UserAuth):
    try:
        conn = psycopg2.connect(host=DB_HOST, dbname=DB_NAME, user=DB_USER, password=DB_PASS)
        cursor = conn.cursor()
        # Search the vault for this exact email
        cursor.execute("SELECT password_hash FROM users WHERE email = %s", (user.email,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()

        # Security Checks
        if not result:
            raise HTTPException(status_code=400, detail="Identity not found.")
        if result[0] != user.password:
            raise HTTPException(status_code=400, detail="Incorrect passphrase.")

        return {"status": "success", "message": "Authentication successful!"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Login failed.")

# --- SCANNER SYSTEM ---
@app.get("/scan")
async def run_scan():
    await asyncio.sleep(2) # Simulate deep web scraping
    return {
        "status": "complete",
        "threats_found": 0,
        "dark_web": "No Leaks Found",
        "score": "100% Secure"
    }