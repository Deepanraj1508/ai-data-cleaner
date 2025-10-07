import pandas as pd
import os
import aiofiles
from typing import Dict, List
import json
from datetime import datetime

class FileHandler:
    def __init__(self):
        self.upload_dir = os.getenv("UPLOAD_DIR", "./storage/uploads")
        self.cleaned_dir = os.getenv("CLEANED_DIR", "./storage/cleaned")
        os.makedirs(self.upload_dir, exist_ok=True)
        os.makedirs(self.cleaned_dir, exist_ok=True)
    
    async def save_upload(self, file, file_id: str) -> tuple:
        """Save uploaded file and return path and size"""
        ext = file.filename.split('.')[-1]
        file_path = os.path.join(self.upload_dir, f"{file_id}.{ext}")
        
        file_size = 0
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            file_size = len(content)
            await f.write(content)
        
        return file_path, file_size
    
    def read_file(self, file_path: str) -> pd.DataFrame:
        
        """Read CSV or Excel file"""
        if file_path.endswith('.csv'):
            return pd.read_csv(file_path)
        elif file_path.endswith(('.xlsx', '.xls')):
            return pd.read_excel(file_path)
        else:
            raise ValueError("Unsupported file format")
    
    def get_preview(self, df: pd.DataFrame, rows: int = 20) -> Dict:
        """Get preview of dataframe"""
        preview_df = df.head(rows)
        
        # Replace NaN with None for JSON serialization
        preview_data = preview_df.where(pd.notnull(preview_df), None).values.tolist()
        
        return {
            "columns": df.columns.tolist(),
            "rows": preview_data,
            "dtypes": df.dtypes.astype(str).to_dict()
        }
    
    def save_cleaned_data(self, df: pd.DataFrame, original_filename: str, file_id: str) -> str:
        """Save cleaned data permanently with proper naming"""
        # Extract base name without extension
        base_name = os.path.splitext(original_filename)[0]
        original_ext = os.path.splitext(original_filename)[1]
        
        # Create cleaned filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        cleaned_filename = f"{base_name}_cleaned_{timestamp}{original_ext}"
        
        # Save to cleaned directory
        cleaned_path = os.path.join(self.cleaned_dir, cleaned_filename)
        
        if original_ext.lower() == '.csv':
            df.to_csv(cleaned_path, index=False)
        else:  # Excel format
            df.to_excel(cleaned_path, index=False, engine='openpyxl')
        
        return cleaned_filename
    
    def export_data(self, df: pd.DataFrame, format: str, cleaned_filename: str) -> str:
        """Export cleaned data to specified format for download"""
        base_name = os.path.splitext(cleaned_filename)[0]
        
        if format.lower() == 'csv':
            output_path = os.path.join(self.cleaned_dir, f"{base_name}.csv")
            df.to_csv(output_path, index=False)
        
        elif format.lower() == 'xlsx':
            output_path = os.path.join(self.cleaned_dir, f"{base_name}.xlsx")
            df.to_excel(output_path, index=False, engine='openpyxl')
        
        elif format.lower() == 'json':
            output_path = os.path.join(self.cleaned_dir, f"{base_name}.json")
            df.to_json(output_path, orient='records', indent=2)
        
        elif format.lower() == 'sql':
            output_path = os.path.join(self.cleaned_dir, f"{base_name}.sql")
            # Extract table name from filename
            table_name = base_name.lower().replace(' ', '_').replace('-', '_')
            # Remove _cleaned suffix for table name
            table_name = table_name.replace('_cleaned', '')
            sql_content = self.generate_sql(df, table_name)
            with open(output_path, 'w') as f:
                f.write(sql_content)
        
        else:
            raise ValueError(f"Unsupported export format: {format}")
        
        return output_path
    
    def generate_sql(self, df: pd.DataFrame, table_name: str) -> str:
        """Generate SQL INSERT statements"""
        sql_lines = []
        
        # Create table statement
        columns = []
        for col in df.columns:
            dtype = df[col].dtype
            if dtype == 'int64':
                col_type = 'INTEGER'
            elif dtype == 'float64':
                col_type = 'DECIMAL(10,2)'
            else:
                col_type = 'VARCHAR(255)'
            columns.append(f"    {col} {col_type}")
        
        create_table = f"CREATE TABLE {table_name} (\n"
        create_table += ",\n".join(columns)
        create_table += "\n);\n\n"
        sql_lines.append(create_table)
        
        # Insert statements
        for _, row in df.iterrows():
            values = []
            for val in row:
                if pd.isna(val):
                    values.append('NULL')
                elif isinstance(val, (int, float)):
                    values.append(str(val))
                else:
                    # Escape single quotes
                    escaped_val = str(val).replace("'", "''")
                    values.append(f"'{escaped_val}'")
            
            insert_stmt = f"INSERT INTO {table_name} ({', '.join(df.columns)}) VALUES ({', '.join(values)});\n"
            sql_lines.append(insert_stmt)
        
        return ''.join(sql_lines)
    
    def get_media_type(self, format: str) -> str:
        """Get media type for file format"""
        media_types = {
            'csv': 'text/csv',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'json': 'application/json',
            'sql': 'text/plain'
        }
        return media_types.get(format.lower(), 'application/octet-stream')
    
    def get_file_size(self, file_path: str) -> int:
        """Get file size in bytes"""
        return os.path.getsize(file_path)