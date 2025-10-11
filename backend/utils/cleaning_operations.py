import pandas as pd
import re
from typing import List, Dict, Tuple
from datetime import datetime
import numpy as np

class CleaningOperations:
    def remove_empty_rows(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
        """Remove rows where all columns are empty (NaN or empty string)"""
        original_count = len(df)
        # Consider both NaN and empty string as empty
        mask = df.apply(lambda row: row.isna().all() or all((str(x).strip() == '' or pd.isna(x)) for x in row), axis=1)
        df = df[~mask]
        removed_count = original_count - len(df)
        return df, removed_count
    def apply_cleaning(self, df: pd.DataFrame, issues: List[Dict], selected_issue_ids: List[int]) -> Tuple[pd.DataFrame, Dict]:
        """Apply selected cleaning operations"""
        cleaned_df = df.copy()
        changes = {
            'rows_removed': 0,
            'values_fixed': 0,
            'columns_renamed': 0
        }
        
        # Filter selected issues
        selected_issues = [issue for issue in issues if issue['id'] in selected_issue_ids]
        
        for issue in selected_issues:
            issue_type = issue['type']

            if issue_type == 'column_naming':
                cleaned_df, renamed_count = self.fix_column_names(cleaned_df, issue)
                changes['columns_renamed'] += renamed_count

            elif issue_type == 'date_format':
                cleaned_df, fixed_count = self.fix_date_formats(cleaned_df, issue)
                changes['values_fixed'] += fixed_count

            elif issue_type == 'duplicates':
                cleaned_df, removed_count = self.remove_duplicates(cleaned_df)
                changes['rows_removed'] += removed_count

            elif issue_type == 'phone_format':
                cleaned_df, fixed_count = self.fix_phone_formats(cleaned_df, issue)
                changes['values_fixed'] += fixed_count

            elif issue_type == 'whitespace':
                cleaned_df, fixed_count = self.fix_whitespace(cleaned_df, issue)
                changes['values_fixed'] += fixed_count

            elif issue_type == 'missing_values':
                cleaned_df, removed_count = self.handle_missing_values(cleaned_df)
                changes['rows_removed'] += removed_count

        # Always remove rows where all columns are empty (NaN or empty string)
        cleaned_df, removed_empty = self.remove_empty_rows(cleaned_df)
        changes['rows_removed'] += removed_empty

        return cleaned_df, changes
    
    
    def fix_column_names(self, df: pd.DataFrame, issue: Dict) -> Tuple[pd.DataFrame, int]:
        """Rename columns according to suggestions"""
        rename_map = {s['from']: s['to'] for s in issue.get('suggestions', [])}
        df = df.rename(columns=rename_map)
        return df, len(rename_map)
    
    def fix_date_formats(self, df: pd.DataFrame, issue: Dict) -> Tuple[pd.DataFrame, int]:
        """Standardize date formats"""
        column = issue.get('column')
        if not column:
            return df, 0
        
        fixed_count = 0
        def parse_date(val):
            nonlocal fixed_count
            if pd.isna(val):
                return val
            
            try:
                # Try parsing various formats
                parsed_date = pd.to_datetime(val, infer_datetime_format=True)
                fixed_count += 1
                return parsed_date.strftime('%Y-%m-%d')
            except:
                return val
        
        df[column] = df[column].apply(parse_date)
        return df, fixed_count
    
    def remove_duplicates(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
        """Remove duplicate rows"""
        original_count = len(df)
        df = df.drop_duplicates()
        removed_count = original_count - len(df)
        return df, removed_count
    
    def fix_phone_formats(self, df: pd.DataFrame, issue: Dict) -> Tuple[pd.DataFrame, int]:
        """Standardize phone number formats"""
        column = issue.get('column')
        if not column:
            return df, 0

        # Normalize column names for case-insensitive matching
        df.columns = df.columns.str.strip()
        column_map = {col.lower(): col for col in df.columns}
        col_key = column.strip().lower()

        if col_key not in column_map:
            print(f"[WARN] Column '{column}' not found. Available columns: {list(df.columns)}")
            return df, 0

        real_column = column_map[col_key]

        fixed_count = 0
        def standardize_phone(val):
            nonlocal fixed_count
            if pd.isna(val):
                return val
            digits = re.sub(r'\D', '', str(val))
            if len(digits) == 10:
                fixed_count += 1
                return f"{digits[:3]}-{digits[3:6]}-{digits[6:]}"
            return val

        df[real_column] = df[real_column].apply(standardize_phone)
        return df, fixed_count

    
    def fix_whitespace(self, df: pd.DataFrame, issue: Dict) -> Tuple[pd.DataFrame, int]:
        """Trim whitespace from text columns"""
        columns = issue.get('columns', [])
        fixed_count = 0
        
        for col in columns:
            if col in df.columns and df[col].dtype == 'object':
                original = df[col].copy()
                df[col] = df[col].astype(str).str.strip()
                fixed_count += (original != df[col]).sum()
        
        return df, fixed_count
    
    def handle_missing_values(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
        """Remove rows with excessive missing values"""
        # Remove rows where more than 50% of values are missing
        threshold = len(df.columns) * 0.5
        original_count = len(df)
        df = df.dropna(thresh=threshold)
        removed_count = original_count - len(df)
        return df, removed_count
    
def replace_nan(obj):
    import math
    if isinstance(obj, float) and math.isnan(obj):
        return None
    elif isinstance(obj, dict):
        return {k: replace_nan(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [replace_nan(item) for item in obj]
    return obj

def convert_numpy_types(obj):
    if isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: convert_numpy_types(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    return obj