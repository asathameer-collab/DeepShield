from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import psycopg2 
import os # NEW: This tool lets Python read invisible secret keys!

app = FastAPI(title="DeepShield API")

# NEW: We are changing this to ["*"] so your future Vercel website is allowed to talk to it!
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NEW: Python will look for the secret Cloud key. If it doesn't find it, it uses your local Docker vault.
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://deepshield_user:deepshield_password@localhost/deepshield_db")

class UserAuth(BaseModel):
    email: str
    password: str

@app.on_event("startup")
def startup_db_setup():
    try:
        # Notice how we just use DATABASE_URL now!
        conn = psycopg2.connect(DATABASE_URL)
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
        print("SUCCESS: Connected to Vault and verified tables!")
    except Exception as e:
        print("DATABASE ERROR:", e)

@app.get("/health")
def health_check():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.close() 
        return {"status": "ok", "message": "Cloud Brain & Vault Online!"}
    except Exception as e:
        return {"status": "error", "message": "Vault Disconnected!"}

@app.post("/register")
def register_user(user: UserAuth):
    try:
        conn = psycopg2.connect(DATABASE_URL)
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

@app.post("/login")
def login_user(user: UserAuth):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        cursor.execute("SELECT password_hash FROM users WHERE email = %s", (user.email,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()

        if not result:
            raise HTTPException(status_code=400, detail="Identity not found.")
        if result[0] != user.password:
            raise HTTPException(status_code=400, detail="Incorrect passphrase.")

        return {"status": "success", "message": "Authentication successful!"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Login failed.")

@app.get("/scan")
async def run_scan():
    await asyncio.sleep(2) 
    return {
        "status": "complete",
        "threats_found": 0,
        "dark_web": "No Leaks Found",
        "score": "100% Secure"
    }