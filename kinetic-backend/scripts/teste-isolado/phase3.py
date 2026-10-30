# Fase 3: redes de empresas, filiais por usuário e segundo fator (TOTP).
# As senhas geradas só existem no e-mail: o host as lê do log (DEV_LOG_EMAIL_CONTENT=true)
# e passa para o passo seguinte. Estado entre passos em /t/state.json.
#   python phase3.py root                 -> ROOT entra com 2FA e cria a rede + dono
#   python phase3.py owner <senha>        -> dono entra com 2FA e cria 2 filiais
#   python phase3.py units <u1> <s1> <u2> <s2>
import base64, hashlib, hmac, json, struct, sys, time, uuid
from lib import *

STATE = "/t/state.json"
ROOT_MAIL, ROOT_PWD = "root-check@teste.local", "RootSeed@999"


def load():
    try:
        return json.load(open(STATE))
    except FileNotFoundError:
        return {}


def save(s):
    json.dump(s, open(STATE, "w"))


def totp(secret, offset=0):
    key = base64.b32decode(secret + "=" * (-len(secret) % 8))
    step = int(time.time()) // 30 + offset
    h = hmac.new(key, struct.pack(">Q", step), hashlib.sha1).digest()
    o = h[-1] & 0x0F
    return "%06d" % ((struct.unpack(">I", h[o:o + 4])[0] & 0x7FFFFFFF) % 1_000_000)


def wait_next_step():
    time.sleep(30 - time.time() % 30 + 1)


def raw_login(ident, pwd):
    reset_rl()
    return call("POST", "/api/auth/login", json={"email": ident, "senha": pwd})


def login_2fa(ident, pwd, state_key, s):
    """Entra com senha + app autenticador (cadastra o app na primeira vez). Devolve o access token."""
    r = raw_login(ident, pwd)
    body = r.json()
    assert r.status_code == 403 and body["code"] in ("TOTP_REQUIRED", "TOTP_SETUP_REQUIRED"), (r.status_code, r.text)
    ch = body["challengeToken"]
    if body["code"] == "TOTP_SETUP_REQUIRED":
        reset_rl()
        setup = call("POST", "/api/auth/totp/setup", json={"challengeToken": ch}).json()
        s[state_key] = setup["secret"]
    # O backend recusa o mesmo código duas vezes: se esta conta já usou a janela atual, espera a próxima.
    if s.get(state_key + "_step") == int(time.time()) // 30:
        wait_next_step()
    reset_rl()
    v = call("POST", "/api/auth/totp/verify", json={"challengeToken": ch, "code": totp(s[state_key])})
    assert v.status_code == 200, (v.status_code, v.text)
    s[state_key + "_step"] = int(time.time()) // 30
    data = v.json()
    if data["recoveryCodes"]:
        s[state_key + "_recovery"] = data["recoveryCodes"]
    token = data["session"]["token"]
    # Conta nova aceita os Termos no primeiro acesso (o painel mostra o TermsGate).
    call("POST", "/api/users/me/terms-acceptance", token)
    return token, ch, body["code"]


def step_root():
    s = load()
    reset_rl()
    r = call("POST", "/api/auth/register-company", json={"companyName": "X", "companyCnpj": cnpj(), "ownerName": "X",
             "ownerEmail": email("x"), "ownerPassword": PWD, "termsAccepted": True})
    print(f"[2] cadastro público de empresa: HTTP {r.status_code}")
    # Senha certa de ROOT sem o código não abre sessão.
    r = raw_login(ROOT_MAIL, ROOT_PWD)
    print(f"[2fa] login do ROOT só com senha: HTTP {r.status_code} code={r.json().get('code')} (sem token: {'token' not in r.json()})")
    tok, ch, code = login_2fa(ROOT_MAIL, ROOT_PWD, "root_secret", s)
    p = call("GET", "/api/users/profile", headers={"Authorization": "Bearer " + ch})
    print(f"[2fa] ROOT cadastrou o app ({code}) e entrou; challengeToken usado como Bearer: HTTP {p.status_code}")
    slug = "rede" + uuid.uuid4().hex[:6]
    owner = email("dono")
    r = call("POST", "/api/root/companies", tok, json={"companyName": "Rede Teste", "companyCnpj": cnpj(),
             "slug": slug, "ownerName": "Dono Teste", "ownerEmail": owner})
    print(f"[rede] ROOT criou a rede {slug}: HTTP {r.status_code}; dono {owner}")
    s.update(root_token=tok, slug=slug, owner=owner)
    save(s)
    print("OWNER_EMAIL=" + owner)


def step_owner(owner_pwd):
    s = load()
    tok, ch, code = login_2fa(s["owner"], owner_pwd, "owner_secret", s)
    print(f"[2fa] dono entrou com a senha do e-mail + app ({code}); códigos de recuperação: {len(s.get('owner_secret_recovery', []))}")
    # O mesmo código não entra duas vezes.
    r = raw_login(s["owner"], owner_pwd)
    reset_rl()
    again = call("POST", "/api/auth/totp/verify", json={"challengeToken": r.json()["challengeToken"],
                 "code": totp(s["owner_secret"])})
    print(f"[2fa] mesmo código reaproveitado: HTTP {again.status_code}")
    contact = email("responsavel")
    units = []
    for name, user in [("Filial Centro", "centro"), ("Filial Sul", "sul")]:
        r = call("POST", "/api/dono/unidades", tok, json={"nome": name, "cnpj": cnpj(), "address": "Rua A, 1",
                 "phone": "1133334444", "responsibleName": "Resp " + user, "responsibleEmail": contact, "usuario": user})
        units.append(r.json())
        print(f"[filial] {name}: HTTP {r.status_code} usuário={r.json().get('username')} (e-mail de contato repetido)")
    r = call("POST", "/api/dono/unidades", tok, json={"nome": "Sem CNPJ", "cnpj": "", "responsibleName": "R",
             "responsibleEmail": contact, "usuario": "x"})
    print(f"[filial] sem CNPJ: HTTP {r.status_code} {r.text[:60]!r}")
    s.update(owner_token=tok, owner_pwd=owner_pwd, units=units)
    save(s)


def step_units(u1, s1, u2, s2):
    s = load()
    t1, _, code = login_2fa(u1, s1, "u1_secret", s)
    print(f"[filial] {u1} entrou por usuário + app ({code})")
    reset_rl()
    r = call("POST", "/api/users/change-password", t1, json={"currentPassword": s1, "newPassword": "Nova@12345"})
    print(f"[filial] filial tentou trocar a própria senha: HTTP {r.status_code} {r.text[:70]!r}")
    ot = s["owner_token"]
    unit1 = next(u for u in s["units"] if u["username"] == u1)
    a = call("GET", f"/api/dono/unidades/{unit1['id']}/analytics", ot)
    net = call("GET", "/api/dono/analytics", ot)
    other = call("GET", f"/api/dono/unidades/{uuid.uuid4()}/analytics", ot)
    print(f"[dono] analytics da filial: {a.status_code}; consolidado: {net.status_code}; filial de outra rede/inexistente: {other.status_code}")
    # Nova senha gerada pelo dono derruba o token antigo da filial.
    r = call("POST", f"/api/dono/unidades/{unit1['id']}/nova-senha", ot)
    p = call("GET", "/api/users/profile", t1)
    print(f"[filial] dono gerou nova senha: HTTP {r.status_code}; token antigo da filial: HTTP {p.status_code}")
    # Código de recuperação: vale uma vez.
    t2, _, _ = login_2fa(u2, s2, "u2_secret", s)
    rec = s["u2_secret_recovery"][0]
    out = []
    for _ in range(2):
        ch = raw_login(u2, s2).json()["challengeToken"]
        reset_rl()
        out.append(call("POST", "/api/auth/totp/recover", json={"challengeToken": ch, "code": rec}).status_code)
    print(f"[2fa] código de recuperação usado 2 vezes: {out}")
    # ROOT redefine o 2FA da filial: o próximo login volta ao cadastro do app.
    acc2 = next(u for u in s["units"] if u["username"] == u2)["accountId"]
    # Ação destrutiva do ROOT: o motivo vai para a trilha de auditoria (400 sem ele).
    rr = call("POST", f"/api/root/users/{acc2}/reset-2fa", s["root_token"],
              json={"reason": "Teste isolado: celular perdido da filial"})
    after = raw_login(u2, s2).json().get("code")
    print(f"[2fa] ROOT redefiniu o 2FA da filial: HTTP {rr.status_code}; próximo login: {after}")
    # Força bruta no código: o limite por conta chega antes de 11 tentativas.
    ch = raw_login(u2, s2).json()["challengeToken"]
    reset_rl()
    call("POST", "/api/auth/totp/setup", json={"challengeToken": ch})
    codes = []
    for _ in range(11):
        reset_rl()
        codes.append(call("POST", "/api/auth/totp/verify", json={"challengeToken": ch, "code": "000000"}).status_code)
    print(f"[2fa] 11 códigos errados na mesma conta: {codes}")
    save(s)


if __name__ == "__main__":
    {"root": step_root, "owner": step_owner, "units": step_units}[sys.argv[1]](*sys.argv[2:])
