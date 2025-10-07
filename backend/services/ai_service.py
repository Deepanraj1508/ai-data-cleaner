import requests
import json
import os
from typing import Dict, List
import pandas as pd

class AIService:
    def __init__(self):
        self.lm_studio_url = os.getenv("LM_STUDIO_URL", "http://localhost:1234/v1")
        self.api_key = os.getenv("LM_STUDIO_API_KEY", "lm-studio")
        self.use_openai = os.getenv("USE_OPENAI", "false").lower() == "true"
    
    async def get_suggestions(self, df: pd.DataFrame, issues: List[Dict]) -> Dict:
        """Get AI-powered suggestions for cleaning operations"""
        
        # Prepare context for AI
        context = self.prepare_context(df, issues)
        
        try:
            if self.use_openai:
                suggestions = await self.get_openai_suggestions(context)
            else:
                suggestions = await self.get_lm_studio_suggestions(context)
            
            return suggestions
        except Exception as e:
            print(f"AI Service Error: {e}")
            # Return empty suggestions on error
            return {}
    
    def prepare_context(self, df: pd.DataFrame, issues: List[Dict]) -> str:
        """Prepare context for AI model"""
        context_parts = []
        
        # Add data overview
        context_parts.append(f"Data Overview:")
        context_parts.append(f"- Total Rows: {len(df)}")
        context_parts.append(f"- Total Columns: {len(df.columns)}")
        context_parts.append(f"- Columns: {', '.join(df.columns.tolist())}")
        context_parts.append("")
        
        # Add sample data
        context_parts.append("Sample Data (first 3 rows):")
        context_parts.append(df.head(3).to_string())
        context_parts.append("")
        
        # Add detected issues
        context_parts.append("Detected Issues:")
        for i, issue in enumerate(issues, 1):
            context_parts.append(f"{i}. {issue.get('title', 'Unknown')} - {issue.get('description', '')}")
        
        return "\n".join(context_parts)
    
    async def get_lm_studio_suggestions(self, context: str) -> Dict:
        """Get enhanced data cleaning and automation suggestions from LM Studio"""

        prompt = f"""
    You are an expert data scientist specializing in automated data cleaning and preprocessing.
    Your task is to analyze the dataset or data description provided below and recommend intelligent cleaning operations.

    ### PROJECT CONTEXT
    You are contributing to the "AI Data Cleaning & Automation Tool" — an intelligent assistant that detects, cleans, and standardizes unstructured or inconsistent datasets (CSV, Excel, JSON, etc.).

    ### INPUT DATA CONTEXT
    {context}

    ---

    ### COMMON DATA QUALITY ISSUES TO CONSIDER

    🧹 **1. Missing or Null Values**
    - Empty cells in key columns (e.g., no email, no price, missing date)
    - NaN, NULL, or placeholder values like "-", "?", or "N/A"

    📋 **2. Duplicate Records**
    - Identical rows repeated more than once
    - Same entity ID appearing multiple times with the same data

    ✍️ **3. Inconsistent Formatting**
    - Mixed date formats (e.g., 01/02/2025, 2025-02-01, Feb 1 25)
    - Text casing inconsistencies (e.g., John Doe, john doe, JOHN DOE)
    - Number formatting differences (e.g., 1,000 vs 1000 vs 1.000)

    🧠 **4. Outliers or Invalid Values**
    - Negative or unrealistic values (e.g., age = 999)
    - Invalid category values not in the defined list

    🧪 **5. Data Type Mismatches**
    - Numbers or dates stored as text (e.g., "123" or "2025-01-01" as string)

    🌐 **6. Inconsistent Categories / Labels**
    - Variations like "USA", "U.S.A.", "United States"
    - Misspellings in category names (e.g., "Electornics" → "Electronics")

    ⏱ **7. Structural Issues**
    - Extra blank rows or columns
    - Column headers misplaced or merged cells breaking parsing

    ---

    ### OBJECTIVE
    Analyze the dataset for the above issues and provide structured, automation-ready recommendations.

    ### REQUIRED OUTPUT FORMAT
    Respond in a structured JSON-like format with the following fields:

    1. **column_name_recommendations** – Suggested renaming or normalization of headers.
    2. **format_standardization** – Conversions for consistent data types, formats, and encodings.
    3. **missing_value_strategy** – Handling strategies (imputation, drop, inference, etc.) with short reasoning.
    4. **data_validation_rules** – Logical or range-based rules ensuring data integrity.
    5. **automation_opportunities** – Potential cleaning tasks suitable for automation (e.g., deduplication, normalization).

    ### STYLE & RESPONSE GUIDELINES
    - Keep recommendations concise, actionable, and technically implementable.
    - Suggest both **manual fixes** and **automated approaches**.
    - Use JSON-like formatting for easy parsing.
    - Avoid generic advice; be specific to the provided context.
    """

        try:
            response = requests.post(
                f"{self.lm_studio_url}/chat/completions",
                headers={"Content-Type": "application/json"},
                json={
                    "model": "local-model",
                    "messages": [
                        {"role": "system", "content": "You are a senior data cleaning and automation expert."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.5,
                    "max_tokens": 900
                },
                timeout=60
            )

            if response.status_code == 200:
                result = response.json()
                suggestion_text = result['choices'][0]['message']['content']
                return self.parse_ai_suggestions(suggestion_text)
            else:
                print(f"LM Studio API error: {response.status_code}")
                return {}
        
        except Exception as e:
            print(f"LM Studio connection error: {e}")
            return {}

    
    async def get_openai_suggestions(self, context: str) -> Dict:
        """Get suggestions from OpenAI (placeholder for future implementation)"""
        # TODO: Implement OpenAI API integration
        return {}
    
    def parse_ai_suggestions(self, text: str) -> Dict:
        """Parse AI response into structured suggestions"""
        suggestions = {}
        
        # Simple parsing logic - can be enhanced
        lines = text.split('\n')
        current_category = None
        
        for line in lines:
            line = line.strip()
            if line.startswith('1.') or 'column' in line.lower():
                current_category = 'column_naming'
                suggestions[current_category] = line
            elif line.startswith('2.') or 'format' in line.lower():
                current_category = 'date_format'
                suggestions[current_category] = line
            elif line.startswith('3.') or 'missing' in line.lower():
                current_category = 'missing_values'
                suggestions[current_category] = line
            elif line.startswith('4.') or 'validation' in line.lower():
                current_category = 'data_validation'
                suggestions[current_category] = line
        
        return suggestions