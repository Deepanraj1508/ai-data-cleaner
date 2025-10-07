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
        """Get suggestions from LM Studio"""
        prompt = f"""You are a data cleaning expert. Analyze the following dataset and provide suggestions for cleaning operations.

{context}

Provide specific recommendations for:
1. Column name improvements
2. Data format standardization
3. Handling missing values
4. Data validation rules

Keep responses concise and actionable."""

        try:
            response = requests.post(
                f"{self.lm_studio_url}/chat/completions",
                headers={"Content-Type": "application/json"},
                json={
                    "model": "local-model",
                    "messages": [
                        {"role": "system", "content": "You are a data cleaning expert."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 500
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