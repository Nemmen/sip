from http.server import BaseHTTPRequestHandler
import json

class handler(BaseHTTPRequestHandler):
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
        
        response = {
            "match_score": round(match_score, 2),
            "matched_skills": list(matched),
            "skill_gaps": list(skill_gaps),
            "recommendations": recommendations
        }
        
        self.wfile.write(json.dumps(response).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
