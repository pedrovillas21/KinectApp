# Helpers do teste isolado: API do backend e acesso direto ao Postgres de teste.
import random, uuid, datetime
import requests, pg8000.native

API = "http://kinetic-test-api:8080"
GEM = "http://fake-gemini:8000"
PWD = "Senha@123"


def db():
    return pg8000.native.Connection("postgres", host="kinetic-test-db", password="testpass", database="postgres")


def sql(q, **kw):
    c = db()
    try:
        return c.run(q, **kw)
    finally:
        c.close()


def reset_rl():
    # Zera os contadores de rate limit entre os passos (só no banco de teste).
    # Mantém os limites de palpites por conta (item 1), que são justamente o que se testa.
    sql("DELETE FROM rate_limit_counters WHERE key NOT LIKE '%-guess:%'")


def cpf():
    n = [random.randint(0, 9) for _ in range(9)]
    for k in (10, 11):
        s = sum(d * w for d, w in zip(n, range(k, 1, -1)))
        n.append((s * 10 % 11) % 10)
    return "".join(map(str, n))


def cnpj():
    n = [random.randint(0, 9) for _ in range(8)] + [0, 0, 0, 1]
    for w in ([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]):
        s = sum(d * x for d, x in zip(n, w))
        r = s % 11
        n.append(0 if r < 2 else 11 - r)
    return "".join(map(str, n))


def phone():
    return f"(11) 9{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"


def email(tag):
    return f"{tag}-{uuid.uuid4().hex[:8]}@teste.local"


def call(method, path, token=None, **kw):
    h = kw.pop("headers", {})
    if token:
        h["Authorization"] = "Bearer " + token
    return requests.request(method, API + path, headers=h, timeout=kw.pop("timeout", 60), **kw)


def register(role="ALUNO", mail=None, verify=True, ph=None, doc=None):
    mail = mail or email(role.lower())
    body = {"nome": f"Teste {role}", "email": mail, "senha": PWD, "role": role,
            "phone": ph or phone(), "termsAccepted": True}
    if role == "PERSONAL":
        body["cpf"] = doc or cpf()
    reset_rl()
    r = call("POST", "/api/auth/register", json=body)
    assert r.status_code == 201, (r.status_code, r.text)
    if verify:
        sql("UPDATE users SET email_verified = true WHERE email = :e", e=mail)
    return mail


def login(mail, pwd=PWD):
    reset_rl()
    r = call("POST", "/api/auth/login", json={"email": mail, "senha": pwd})
    assert r.status_code == 200, (r.status_code, r.text)
    return r.json()["token"]


def uid(mail):
    return str(sql("SELECT id FROM users WHERE email = :e", e=mail)[0][0])


def link(trainer_tok, student_mail):
    """Convida e aceita: devolve o token do aluno."""
    r = call("POST", "/api/trainer/invites", trainer_tok, json={"studentEmail": student_mail})
    assert r.status_code in (200, 201), (r.status_code, r.text)
    st = login(student_mail)
    inv = call("GET", "/api/me/invites", st).json()
    r = call("POST", f"/api/me/invites/{inv[0]['id']}/accept", st)
    assert r.status_code == 200, (r.status_code, r.text)
    return st


def plan(trainer_tok, student_id):
    body = {"title": "Ficha T", "estimatedDurationMinutes": 40, "exercises": [
        {"name": "Supino", "muscles": "PEITO", "type": "COMPOSTO", "sets": 3, "reps": "10", "section": "PRINCIPAL"}]}
    r = call("POST", f"/api/trainer/students/{student_id}/plans", trainer_tok, json=body)
    assert r.status_code in (200, 201), (r.status_code, r.text)
    return r.json()


def today():
    return datetime.date.today().isoformat()


results = {}


def report(item, verdict, evidence):
    results[item] = (verdict, evidence)
    print(f"[{item}] {verdict}: {evidence}", flush=True)
