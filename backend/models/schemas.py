from pydantic import BaseModel
from typing import List, Dict, Optional, Any

class FileUploadResponse(BaseModel):
    file_id: str
    filename: str
    preview: Dict
    stats: Dict

class Issue(BaseModel):
    id: int
    type: str
    severity: str
    title: str
    description: str
    suggestion: Optional[str] = None
    suggestions: Optional[List[Dict]] = None
    examples: Optional[List[str]] = None
    column: Optional[str] = None
    columns: Optional[List[str]] = None

class AnalysisResponse(BaseModel):
    file_id: str
    issues: List[Issue]
    stats: Dict

class CleaningRequest(BaseModel):
    selected_issues: List[int]

class CleaningResponse(BaseModel):
    file_id: str
    preview: Dict
    changes: Dict
    stats: Dict