# Gemini falso para o teste isolado: /mode/ok|fail|slow troca o comportamento; conta as chamadas.
import json, time, threading
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler

state = {"mode": "ok", "calls": 0}
lock = threading.Lock()

PLAN = {
    "understood": [{"title": "Teste", "detail": "ficha de teste"}],
    "attentionPoints": [],
    "plans": [{
        "title": "Ficha A", "subtitle": None, "estimatedDurationMinutes": 40,
        "exercises": [{"name": "Agachamento", "muscles": "QUADRICEPS", "type": "COMPOSTO", "sets": 3,
                       "reps": "10", "weight": "20kg (RPE 7)", "restTime": "60s", "section": "PRINCIPAL",
                       "notes": None, "attention": None}]
    }]
}


class H(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, code, body):
        data = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path.startswith("/mode/"):
            state["mode"] = self.path.split("/")[2]
            with lock:
                state["calls"] = 0
        self._send(200, state)

    def do_POST(self):
        self.rfile.read(int(self.headers.get("Content-Length", 0)))
        with lock:
            state["calls"] += 1
        if state["mode"] == "fail":
            return self._send(503, {"error": "unavailable"})
        if state["mode"] == "slow":
            time.sleep(4)
        self._send(200, {"candidates": [{"content": {"parts": [{"text": json.dumps(PLAN)}]}}]})


ThreadingHTTPServer(("0.0.0.0", 8000), H).serve_forever()
