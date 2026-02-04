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
        
        # Get student skills for recommendations
        student_skills = data.get('student_skills', [])
        
        # Mock recommendations - in production, use vector DB and ML
        response = [
            {
                "internship_id": "mock-id-1",
                "match_score": 0.85,
                "reasoning": "Strong match based on your skills"
            },
            {
                "internship_id": "mock-id-2",
                "match_score": 0.72,
                "reasoning": "Good fit for your background"
            }
        ]
        
        self.wfile.write(json.dumps(response).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
