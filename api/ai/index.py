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
            "version": "1.0.0",
            "endpoints": [
                "GET /api/ai - Service info",
                "GET /api/ai/health - Health check",
                "POST /api/ai/match - Skill matching",
                "POST /api/ai/recommendations - Get recommendations"
            ]
        }
        self.wfile.write(json.dumps(response).encode())
