import pandas as pd
import numpy as np
import re
from typing import List, Dict, Any
from datetime import datetime

class DataAnalyzer:
    def __init__(self):
        self.issue_id_counter = 1
    
    def analyze(self, df: pd.DataFrame) -> List[Dict]:
        """Analyze dataframe and return list of issues"""
        issues = []
        
        # Check column naming
        column_issues = self.check_column_names(df)
        if column_issues:
            issues.append(column_issues)
        
        # Check for date format inconsistencies
        date_issues = self.check_date_formats(df)
        issues.extend(date_issues)
        
        # Check for missing values
        missing_issues = self.check_missing_values(df)
        if missing_issues:
            issues.append(missing_issues)
        
        # Check for duplicates
        duplicate_issues = self.check_duplicates(df)
        if duplicate_issues:
            issues.append(duplicate_issues)
        
        # Check data type consistency
        type_issues = self.check_data_types(df)
        issues.extend(type_issues)
        
        # Check for phone number formats
        phone_issues = self.check_phone_formats(df)
        issues.extend(phone_issues)
        
        # Check for email validation
        email_issues = self.check_email_formats(df)
        issues.extend(email_issues)
        
        # Check for whitespace issues
        whitespace_issues = self.check_whitespace(df)
        if whitespace_issues:
            issues.append(whitespace_issues)
        
        return issues
    
    def convert_to_native_types(self, obj):
        """Convert numpy types to native Python types"""
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, dict):
            return {key: self.convert_to_native_types(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self.convert_to_native_types(item) for item in obj]
        return obj
    
    def check_column_names(self, df: pd.DataFrame) -> Dict:
        """Check for column naming issues"""
        suggestions = []
        has_issues = False
        
        for col in df.columns:
            normalized = self.normalize_column_name(col)
            if normalized != col:
                suggestions.append({'from': col, 'to': normalized})
                has_issues = True
        
        if has_issues:
            return {
                'id': int(self.get_next_id()),
                'type': 'column_naming',
                'severity': 'medium',
                'title': 'Inconsistent Column Names',
                'description': f'Found {len(suggestions)} columns with spaces or special characters',
                'suggestions': suggestions,
                'auto_fix': True
            }
        return None
    
    def normalize_column_name(self, col: str) -> str:
        """Normalize column name to snake_case"""
        # Remove special characters, convert to lowercase
        normalized = re.sub(r'[^\w\s]', '', col.lower())
        # Replace spaces with underscores
        normalized = re.sub(r'\s+', '_', normalized.strip())
        # Remove duplicate underscores
        normalized = re.sub(r'_+', '_', normalized)
        return normalized
    
    def check_date_formats(self, df: pd.DataFrame) -> List[Dict]:
        """Check for date format inconsistencies"""
        issues = []
        
        for col in df.columns:
            if self.is_potential_date_column(col):
                date_formats = self.detect_date_formats(df[col])
                if len(date_formats) > 1:
                    issues.append({
                        'id': int(self.get_next_id()),
                        'type': 'date_format',
                        'severity': 'high',
                        'title': f'Inconsistent Date Formats in "{col}"',
                        'description': f'Found {len(date_formats)} different date formats',
                        'column': col,
                        'examples': list(date_formats)[:5],
                        'suggestion': 'Standardize to YYYY-MM-DD format',
                        'auto_fix': True
                    })
        
        return issues
    
    def is_potential_date_column(self, col_name: str) -> bool:
        """Check if column name suggests it contains dates"""
        date_keywords = ['date', 'time', 'day', 'month', 'year', 'created', 'updated', 'modified']
        col_lower = col_name.lower()
        return any(keyword in col_lower for keyword in date_keywords)
    
    def detect_date_formats(self, series: pd.Series) -> set:
        """Detect different date formats in a series"""
        formats = set()
        
        for val in series.dropna().head(100):
            val_str = str(val)
            
            # Check various date patterns
            if re.match(r'\d{4}[-/]\d{1,2}[-/]\d{1,2}', val_str):
                formats.add('YYYY-MM-DD or YYYY/MM/DD')
            elif re.match(r'\d{1,2}[-/]\d{1,2}[-/]\d{4}', val_str):
                formats.add('DD-MM-YYYY or MM-DD-YYYY')
            elif re.match(r'\w{3}\s+\d{1,2},?\s+\d{4}', val_str):
                formats.add('Mon DD, YYYY')
            elif re.match(r'\d{1,2}\s+\w+\s+\d{4}', val_str):
                formats.add('DD Month YYYY')
        
        return formats
    
    def check_missing_values(self, df: pd.DataFrame) -> Dict:
        """Check for missing values"""
        missing_counts = df.isnull().sum()
        columns_with_missing = missing_counts[missing_counts > 0]
        
        if len(columns_with_missing) > 0:
            total_missing = int(missing_counts.sum())
            # Convert to native Python types
            columns_dict = {str(k): int(v) for k, v in columns_with_missing.items()}
            
            return {
                'id': int(self.get_next_id()),
                'type': 'missing_values',
                'severity': 'medium',
                'title': 'Missing Values Detected',
                'description': f'{total_missing} missing values across {len(columns_with_missing)} columns',
                'columns': columns_dict,
                'suggestion': 'Remove rows with critical missing data or fill with appropriate values',
                'auto_fix': False
            }
        return None
    
    def check_duplicates(self, df: pd.DataFrame) -> Dict:
        """Check for duplicate rows"""
        duplicate_count = int(df.duplicated().sum())
        
        if duplicate_count > 0:
            return {
                'id': int(self.get_next_id()),
                'type': 'duplicates',
                'severity': 'high',
                'title': 'Duplicate Rows Found',
                'description': f'Found {duplicate_count} duplicate rows',
                'count': duplicate_count,
                'suggestion': 'Remove duplicate rows to ensure data integrity',
                'auto_fix': True
            }
        return None
    
    def check_data_types(self, df: pd.DataFrame) -> List[Dict]:
        """Check for data type inconsistencies"""
        issues = []
        
        for col in df.columns:
            if df[col].dtype == 'object':
                # Check if column should be numeric
                numeric_ratio = self.get_numeric_ratio(df[col])
                if numeric_ratio > 0.7 and numeric_ratio < 1.0:
                    non_numeric = df[col][pd.to_numeric(df[col], errors='coerce').isna()].dropna()
                    if len(non_numeric) > 0:
                        issues.append({
                            'id': int(self.get_next_id()),
                            'type': 'data_type',
                            'severity': 'medium',
                            'title': f'Mixed Data Types in "{col}"',
                            'description': f'Column appears mostly numeric but contains {len(non_numeric)} non-numeric values',
                            'column': col,
                            'examples': [str(x) for x in non_numeric.head(3).tolist()],
                            'suggestion': 'Convert to numeric or remove non-numeric values',
                            'auto_fix': False
                        })
        
        return issues
    
    def get_numeric_ratio(self, series: pd.Series) -> float:
        """Get ratio of numeric values in series"""
        try:
            numeric_series = pd.to_numeric(series, errors='coerce')
            return float(numeric_series.notna().sum() / len(series.dropna()))
        except:
            return 0.0
    
    def check_phone_formats(self, df: pd.DataFrame) -> List[Dict]:
        """Check for phone number format inconsistencies"""
        issues = []
        phone_keywords = ['phone', 'mobile', 'tel', 'contact']
        
        for col in df.columns:
            col_lower = col.lower()
            if any(keyword in col_lower for keyword in phone_keywords):
                formats = self.detect_phone_formats(df[col])
                if len(formats) > 1:
                    issues.append({
                        'id': int(self.get_next_id()),
                        'type': 'phone_format',
                        'severity': 'low',
                        'title': f'Inconsistent Phone Formats in "{col}"',
                        'description': f'Found {len(formats)} different phone number formats',
                        'column': col,
                        'examples': list(formats)[:3],
                        'suggestion': 'Standardize to XXX-XXX-XXXX or (XXX) XXX-XXXX format',
                        'auto_fix': True
                    })
        
        return issues
    
    def detect_phone_formats(self, series: pd.Series) -> set:
        """Detect different phone number formats"""
        formats = set()
        
        for val in series.dropna().head(50):
            val_str = str(val)
            
            if re.match(r'\d{3}-\d{3}-\d{4}', val_str):
                formats.add('XXX-XXX-XXXX')
            elif re.match(r'\(\d{3}\)\s*\d{3}-\d{4}', val_str):
                formats.add('(XXX) XXX-XXXX')
            elif re.match(r'\d{10}', val_str):
                formats.add('XXXXXXXXXX')
            elif re.match(r'\d{3}\s+\d{3}\s+\d{4}', val_str):
                formats.add('XXX XXX XXXX')
        
        return formats
    
    def check_email_formats(self, df: pd.DataFrame) -> List[Dict]:
        """Check for invalid email formats"""
        issues = []
        email_keywords = ['email', 'mail', 'e-mail']
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        for col in df.columns:
            col_lower = col.lower()
            if any(keyword in col_lower for keyword in email_keywords):
                invalid_emails = []
                for val in df[col].dropna():
                    if not re.match(email_pattern, str(val)):
                        invalid_emails.append(str(val))
                
                if len(invalid_emails) > 0:
                    issues.append({
                        'id': int(self.get_next_id()),
                        'type': 'data_validation',
                        'severity': 'high',
                        'title': f'Invalid Email Formats in "{col}"',
                        'description': f'Found {len(invalid_emails)} invalid email addresses',
                        'column': col,
                        'examples': invalid_emails[:3],
                        'suggestion': 'Flag or remove invalid email entries',
                        'auto_fix': False
                    })
        
        return issues
    
    def check_whitespace(self, df: pd.DataFrame) -> Dict:
        """Check for leading/trailing whitespace"""
        columns_with_whitespace = []
        
        for col in df.columns:
            if df[col].dtype == 'object':
                has_whitespace = df[col].astype(str).str.strip().ne(df[col].astype(str)).any()
                if has_whitespace:
                    columns_with_whitespace.append(col)
        
        if columns_with_whitespace:
            return {
                'id': int(self.get_next_id()),
                'type': 'whitespace',
                'severity': 'low',
                'title': 'Whitespace Issues',
                'description': f'Found leading/trailing whitespace in {len(columns_with_whitespace)} columns',
                'columns': columns_with_whitespace,
                'suggestion': 'Trim whitespace from text fields',
                'auto_fix': True
            }
        return None
    
    def enhance_with_ai(self, issues: List[Dict], ai_suggestions: Dict) -> List[Dict]:
        """Enhance rule-based issues with AI suggestions"""
        # Merge AI suggestions into issues
        for issue in issues:
            issue_type = issue.get('type')
            if issue_type in ai_suggestions:
                issue['ai_suggestion'] = ai_suggestions[issue_type]
        
        return issues
    
    def get_next_id(self) -> int:
        """Get next issue ID"""
        current_id = self.issue_id_counter
        self.issue_id_counter += 1
        return current_id