from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./storage/data_cleaner.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class FileRecord(Base):
    __tablename__ = "file_records"
    
    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(String, unique=True, index=True)
    original_filename = Column(String)
    upload_date = Column(DateTime, default=datetime.utcnow)
    file_size = Column(Integer)  # in bytes
    total_rows = Column(Integer)
    total_columns = Column(Integer)
    issues_found = Column(JSON)  # Store as JSON array
    issues_count = Column(Integer)
    cleaned_filename = Column(String, nullable=True)
    cleaned_date = Column(DateTime, nullable=True)
    rows_removed = Column(Integer, default=0)
    values_fixed = Column(Integer, default=0)
    columns_renamed = Column(Integer, default=0)
    status = Column(String, default="uploaded")  # uploaded, analyzed, cleaned
    error_message = Column(Text, nullable=True)

def init_db():
    """Initialize database"""
    os.makedirs("./storage", exist_ok=True)
    Base.metadata.create_all(bind=engine)

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()