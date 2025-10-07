from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks, Depends
from fastapi.responses import FileResponse
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
import os
import uuid
from typing import List
from datetime import datetime
import pytz
import numpy as np
from services.file_handler import FileHandler
from services.data_analyzer import DataAnalyzer
from services.ai_service import AIService
from models.schemas import AnalysisResponse, CleaningRequest, CleaningResponse
from models.database import get_db, FileRecord, init_db
from utils.cleaning_operations import CleaningOperations,replace_nan,convert_numpy_types

# Initialize database
init_db()

router = APIRouter()

file_handler = FileHandler()
data_analyzer = DataAnalyzer()
ai_service = AIService()
cleaning_ops = CleaningOperations()

# Store analysis results temporarily (in-memory cache)
analysis_store = {}

ist = pytz.timezone('Asia/Kolkata')


@router.post("/upload")
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload and preview data file"""
    try:
        # Validate file
        if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
        
        # Generate file ID
        file_id = str(uuid.uuid4())
        
        # Save file and get size
        file_path, file_size = await file_handler.save_upload(file, file_id)
        
        # Read and clean data
        df = file_handler.read_file(file_path)
        df_clean = df.replace({np.nan: None, np.inf: None, -np.inf: None})

        # Create preview
        preview = df_clean.head(20).to_dict(orient="records")
        
        # Store in database
        db_record = FileRecord(
            file_id=file_id,
            original_filename=file.filename,
            upload_date=datetime.utcnow(),
            file_size=file_size,
            total_rows=int(len(df)),
            total_columns=int(len(df.columns)),
            status="uploaded"
        )
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        
        # Store in memory for processing
        analysis_store[file_id] = {
            'file_path': file_path,
            'dataframe': df,
            'original_filename': file.filename
        }
        
        # Return JSON-safe response
        response_data = {
            "file_id": file_id,
            "filename": file.filename,
            "preview": preview,
            "stats": {
                "total_rows": int(len(df)),
                "total_columns": int(len(df.columns)),
                "columns": df.columns.tolist(),
                "file_size": file_size
            }
        }
        
        return jsonable_encoder(response_data)
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze/{file_id}")
async def analyze_data(file_id: str, db: Session = Depends(get_db)):
    """Analyze data and return cleaning suggestions"""
    try:
        if file_id not in analysis_store:
            raise HTTPException(status_code=404, detail="File not found")
        
        df = analysis_store[file_id]['dataframe']
        
        # Perform analysis
        issues = data_analyzer.analyze(df)
        
        # Get AI suggestions for complex issues
        ai_suggestions = await ai_service.get_suggestions(df, issues)
        
        # Merge AI suggestions with rule-based analysis
        enhanced_issues = data_analyzer.enhance_with_ai(issues, ai_suggestions)
        
        # Store analysis results
        analysis_store[file_id]['issues'] = enhanced_issues
        
        # Update database record
        db_record = db.query(FileRecord).filter(FileRecord.file_id == file_id).first()
        if db_record:
            db_record.issues_found = [
                {
                    'type': issue['type'],
                    'severity': issue['severity'],
                    'title': issue['title']
                } for issue in enhanced_issues
            ]
            db_record.issues_count = len(enhanced_issues)
            db_record.status = "analyzed"
            db.commit()
        
        return {
            "file_id": file_id,
            "issues": enhanced_issues,
            "stats": {
                "total_rows": int(len(df)),
                "total_columns": int(len(df.columns)),
                "empty_rows": int(df.isnull().all(axis=1).sum()),
                "duplicate_rows": int(df.duplicated().sum())
            }
        }
    
    except Exception as e:
        # Log error to database
        db_record = db.query(FileRecord).filter(FileRecord.file_id == file_id).first()
        if db_record:
            db_record.error_message = str(e)
            db_record.status = "error"
            db.commit()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/clean/{file_id}")
async def clean_data(file_id: str, request: dict, db: Session = Depends(get_db)):
    """Apply selected cleaning operations"""
    try:
        if file_id not in analysis_store:
            raise HTTPException(status_code=404, detail="File not found")
        
        df = analysis_store[file_id]['dataframe'].copy()
        issues = analysis_store[file_id]['issues']
        original_filename = analysis_store[file_id]['original_filename']
        selected_issue_ids = request.get('selected_issues', [])
        
        # Apply cleaning operations
        cleaned_df, changes = cleaning_ops.apply_cleaning(
            df, 
            issues, 
            selected_issue_ids
        )
        
        # Save cleaned data permanently
        cleaned_filename = file_handler.save_cleaned_data(
            cleaned_df, 
            original_filename,
            file_id
        )
        
        # Store cleaned data
        analysis_store[file_id]['cleaned_df'] = cleaned_df
        analysis_store[file_id]['changes'] = changes
        analysis_store[file_id]['cleaned_filename'] = cleaned_filename
        
        # Update database record
        db_record = db.query(FileRecord).filter(FileRecord.file_id == file_id).first()
        if db_record:
            db_record.cleaned_filename = cleaned_filename
            db_record.cleaned_date = datetime.now(ist)
            db_record.rows_removed = changes.get('rows_removed', 0)
            db_record.values_fixed = changes.get('values_fixed', 0)
            db_record.columns_renamed = changes.get('columns_renamed', 0)
            db_record.status = "cleaned"
            db.commit()
        
        # Get preview of cleaned data
        preview = file_handler.get_preview(cleaned_df, rows=20)
        preview = replace_nan(preview)

        response_data = convert_numpy_types({
            "file_id": file_id,
            "preview": preview,
            "changes": changes,
            "cleaned_filename": cleaned_filename,
            "stats": {
                "original_rows": int(len(df)),
                "cleaned_rows": int(len(cleaned_df)),
                "rows_removed": int(len(df) - len(cleaned_df))
            }
        })
        
        return response_data
    
    except Exception as e:
        # Log error to database
        # import traceback
        # traceback.print_exc()
        db_record = db.query(FileRecord).filter(FileRecord.file_id == file_id).first()
        if db_record:
            db_record.error_message = str(e)
            db_record.status = "error"
            db.commit()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{file_id}/{format}")
async def download_cleaned_data(file_id: str, format: str):
    """Download cleaned data in specified format"""
    try:
        if file_id not in analysis_store:
            raise HTTPException(status_code=404, detail="File not found")
        
        if 'cleaned_df' not in analysis_store[file_id]:
            raise HTTPException(status_code=400, detail="No cleaned data available")
        
        cleaned_df = analysis_store[file_id]['cleaned_df']
        cleaned_filename = analysis_store[file_id]['cleaned_filename']
        
        # Export to requested format
        output_path = file_handler.export_data(
            cleaned_df, 
            format,
            cleaned_filename
        )
        
        # Determine download filename
        base_name = os.path.splitext(cleaned_filename)[0]
        download_filename = f"{base_name}.{format.lower()}"
        
        return FileResponse(
            output_path,
            filename=download_filename,
            media_type=file_handler.get_media_type(format)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_history(db: Session = Depends(get_db)):
    """Get file processing history"""
    records = db.query(FileRecord).order_by(FileRecord.upload_date.desc()).limit(50).all()
    return {
        "records": [
            {
                "file_id": r.file_id,
                "original_filename": r.original_filename,
                "upload_date": r.upload_date.isoformat(),
                "file_size": r.file_size,
                "total_rows": r.total_rows,
                "total_columns": r.total_columns,
                "issues_count": r.issues_count,
                "cleaned_filename": r.cleaned_filename,
                "status": r.status,
                "rows_removed": r.rows_removed,
                "values_fixed": r.values_fixed,
                "columns_renamed": r.columns_renamed
            }
            for r in records
        ]
    }

@router.get("/file/{file_id}")
async def get_file_details(file_id: str, db: Session = Depends(get_db)):
    """Get detailed information about a specific file"""
    record = db.query(FileRecord).filter(FileRecord.file_id == file_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    
    return {
        "file_id": record.file_id,
        "original_filename": record.original_filename,
        "upload_date": record.upload_date.isoformat(),
        "file_size": record.file_size,
        "total_rows": record.total_rows,
        "total_columns": record.total_columns,
        "issues_found": record.issues_found,
        "issues_count": record.issues_count,
        "cleaned_filename": record.cleaned_filename,
        "cleaned_date": record.cleaned_date.isoformat() if record.cleaned_date else None,
        "status": record.status,
        "rows_removed": record.rows_removed,
        "values_fixed": record.values_fixed,
        "columns_renamed": record.columns_renamed,
        "error_message": record.error_message
    }