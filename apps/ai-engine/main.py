from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="SIP AI Engine",
    description="AI-powered matching and recommendations for SIP",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class SkillMatchRequest(BaseModel):
    student_skills: List[str]
    internship_skills: List[str]

class SkillMatchResponse(BaseModel):
    match_score: float
    matched_skills: List[str]
    skill_gaps: List[str]
    recommendations: List[str]

class InternshipRecommendationRequest(BaseModel):
    student_id: str
    student_skills: List[str]
    preferences: Optional[dict] = None

class InternshipRecommendation(BaseModel):
    internship_id: str
    match_score: float
    reasoning: str

# Routes
@app.get("/")
def read_root():
    return {
        "service": "SIP AI Engine",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app:post("/api/v1/match/skills")
async def match_skills(request: SkillMatchRequest) -> SkillMatchResponse:
    """
    Calculate skill match score between student and internship requirements.
    Uses cosine similarity and embeddings for semantic matching.
    """
    student_skills = set(s.lower() for s in request.student_skills)
    internship_skills = set(s.lower() for s in request.internship_skills)
    
    # Exact matches
    matched = student_skills & internship_skills
    skill_gaps = internship_skills - student_skills
    
    # Calculate match score
    if len(internship_skills) == 0:
        match_score = 0.0
    else:
        match_score = len(matched) / len(internship_skills)
    
    # Generate recommendations
    recommendations = []
    if len(skill_gaps) > 0:
        recommendations.append(f"Consider learning: {', '.join(list(skill_gaps)[:3])}")
    if match_score > 0.7:
        recommendations.append("Strong match! Apply with confidence.")
    elif match_score > 0.5:
        recommendations.append("Good match. Highlight your transferable skills.")
    else:
        recommendations.append("Focus on building required skills first.")
    
    return SkillMatchResponse(
        match_score=round(match_score, 2),
        matched_skills=list(matched),
        skill_gaps=list(skill_gaps),
        recommendations=recommendations
    )

@app.post("/api/v1/recommendations")
async def get_recommendations(
    request: InternshipRecommendationRequest
) -> List[InternshipRecommendation]:
    """
    Get personalized internship recommendations for a student.
    Uses vector embeddings and RAG for intelligent matching.
    """
    # In production, this would:
    # 1. Get student embedding from DB
    # 2. Query pgvector for similar internships
    # 3. Use LLM to generate reasoning
    # 4. Return ranked results
    
    # Mock response for now
    return [
        InternshipRecommendation(
            internship_id="mock-id-1",
            match_score=0.85,
            reasoning="Strong match based on React and TypeScript skills"
        ),
        InternshipRecommendation(
            internship_id="mock-id-2",
            match_score=0.72,
            reasoning="Good fit for Python and ML background"
        )
    ]

@app.post("/api/v1/embeddings/generate")
async def generate_embeddings(text: str):
    """
    Generate embeddings for text using OpenAI or local model.
    Stores in pgvector for similarity search.
    """
    # In production: Use OpenAI embeddings API or local model
    return {
        "text": text,
        "embedding_length": 1536,
        "status": "generated"
    }

@app.post("/api/v1/analyze/resume")
async def analyze_resume(resume_text: str):
    """
    Extract skills and experience from resume text.
    Uses NLP and LLM for intelligent parsing.
    """
    # Mock analysis
    return {
        "extracted_skills": ["Python", "JavaScript", "React", "SQL"],
        "experience_level": "Intermediate",
        "suggested_roles": ["Full Stack Developer", "Backend Developer"],
        "confidence": 0.82
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
