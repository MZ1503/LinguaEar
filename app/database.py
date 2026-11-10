import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# .env file se environment variables load karega
load_dotenv()

# Environment se DATABASE_URL uthayega (Neon-ready)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is missing. Please set it in your .env file.")

# SQLAlchemy engine create karega cloud database ke liye
engine = create_engine(
    DATABASE_URL, 
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# FastAPI dependency ke liye database session function
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()