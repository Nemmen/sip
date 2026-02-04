from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {
            "service": "SIP AI Engine",
            "status": "running",
            "version": "1.0.0"
        }
        self.wfile.write(json.dumps(response).encode())

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        
        try:
            data = json.loads(body) if body else {}
        except:
            data = {}
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        path = self.path
        
        if '/match/skills' in path:
            response = self.match_skills(data)
        elif '/recommendations' in path:
            response = self.get_recommendations(data)
        elif '/embeddings/generate' in path:
            response = self.generate_embeddings(data)
        elif '/analyze/resume' in path:
            response = self.analyze_resume(data)
        else:
            response = {"error": "Not found"}
        
        self.wfile.write(json.dumps(response).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def match_skills(self, data):
        student_skills = set(s.lower() for s in data.get('student_skills', []))
        internship_skills = set(s.lower() for s in data.get('internship_skills', []))
        
        matched = student_skills & internship_skills
        skill_gaps = internship_skills - student_skills
        
        if len(internship_skills) == 0:
            match_score = 0.0
        else:
            match_score = len(matched) / len(internship_skills)
        
        recommendations = []
        if len(skill_gaps) > 0:
            recommendations.append(f"Consider learning: {', '.join(list(skill_gaps)[:3])}")
        if match_score > 0.7:
            recommendations.append("Strong match! Apply with confidence.")
        elif match_score > 0.5:
            recommendations.append("Good match. Highlight your transferable skills.")
        else:
            recommendations.append("Focus on building required skills first.")
        
        return {
            "match_score": round(match_score, 2),
            "matched_skills": list(matched),
            "skill_gaps": list(skill_gaps),
            "recommendations": recommendations
        }

    def get_recommendations(self, data):
        return [
            {
                "internship_id": "mock-id-1",
                "match_score": 0.85,
                "reasoning": "Strong match based on React and TypeScript skills"
            },
            {
                "internship_id": "mock-id-2",
                "match_score": 0.72,
                "reasoning": "Good fit for Python and ML background"
            }
        ]

    def generate_embeddings(self, data):
        text = data.get('text', '')
        return {
            "text": text,
            "embedding_length": 1536,
            "status": "generated"
        }

    def analyze_resume(self, data):
        return {
            "extracted_skills": ["Python", "JavaScript", "React", "SQL"],
            "experience_level": "Intermediate",
            "suggested_roles": ["Full Stack Developer", "Backend Developer"],
            "confidence": 0.82
        }
