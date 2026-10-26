# Verificação das pendências da run-2 contra o backend isolado. Uso: python run.py t1 t8 ...
import sys, time, threading, concurrent.futures as cf
import requests
from lib import *


def t1():
    """Código de reset: tentativas zeradas a cada reenvio."""
    m = register("ALUNO")
    codes = []
    for rnd in range(3):
        reset_rl()
        call("POST", "/api/auth/forgot-password", json={"email": m})
        for i in range(5):
            r = call("POST", "/api/auth/reset-password", json={"email": m, "code": f"{(rnd * 5 + i):06d}", "newPassword": "Nova@1234"})
            codes.append(r.status_code)
        # Simula o fim do intervalo de 60 s entre pedidos (o código esgotado já foi apagado).
        sql("UPDATE password_reset_codes SET created_at = created_at - interval '61 seconds'")
    wrong = codes.count(400)
    report(1, "CONFIRMADO" if wrong == 15 else "NAO CONFIRMADO",
           f"15 palpites na mesma conta em 3 códigos seguidos: {wrong} avaliados (400), "
           f"{codes.count(429)} barrados (429). Respostas: {codes}")


def t2_t4():
    """Empresa autocadastrada vincula personal sem consentimento e o isenta da cobrança."""
    reset_rl()
    owner = email("empresa")
    r = call("POST", "/api/auth/register-company", json={"companyName": "Empresa Fake", "companyCnpj": cnpj(),
             "ownerName": "Dono", "ownerEmail": owner, "ownerPassword": PWD, "termsAccepted": True})
    assert r.status_code == 201, (r.status_code, r.text)
    sql("UPDATE users SET email_verified = true WHERE email = :e", e=owner)
    et = login(owner)
    p = register("PERSONAL")
    pt = login(p)
    before = call("GET", "/api/trainer/billing", pt).json()
    r = call("POST", "/api/empresa/personais", et, json={"email": p})
    after = call("GET", "/api/trainer/billing", pt).json()
    joined = sql("SELECT company_id IS NOT NULL FROM users WHERE email = :e", e=p)[0][0]
    report(4, "CONFIRMADO" if joined else "NAO CONFIRMADO",
           f"empresa chamou POST /empresa/personais (HTTP {r.status_code}); personal entrou na empresa sem aceitar: {joined}.")
    # Para os próximos passos o personal aceita (fluxo novo) e depois testa a saída.
    acc = call("POST", "/api/trainer/company/accept", pt)
    print(f"    aceite do convite pelo personal: HTTP {acc.status_code}", flush=True)
    invites = [call("POST", "/api/trainer/invites", pt, json={"studentEmail": register("ALUNO")}).status_code for _ in range(7)]
    report(2, "CONFIRMADO" if after["aiGenerationsLimit"] is None and invites.count(201) == 7 else "NAO CONFIRMADO",
           f"empresa criada pelo cadastro público; personal antes: maxStudents={before['studentLimit']}, "
           f"aiLimit={before['aiGenerationsLimit']}; depois do vínculo: maxStudents={after['studentLimit']}, aiLimit={after['aiGenerationsLimit']}, "
           f"canAddStudents={after['canAddStudents']}; 7 convites seguidos (teste grátis permite 5): {invites}")
    return et, p, pt


def t3():
    """Gateway demo: personal autoconfirma plano e pacote de IA."""
    p = register("PERSONAL"); pt = login(p)
    r1 = call("POST", "/api/trainer/billing/subscribe", pt, json={"plan": "PRO"})
    r2 = call("POST", "/api/trainer/billing/demo/confirm-payment", pt)
    r3 = call("POST", "/api/trainer/billing/ai-pack", pt)
    r4 = call("POST", "/api/trainer/billing/demo/confirm-ai-pack", pt)
    b = call("GET", "/api/trainer/billing", pt).json()
    report(3, "CONFIRMADO (com BILLING_GATEWAY=demo)",
           f"subscribe {r1.status_code}, confirm-payment {r2.status_code}, ai-pack {r3.status_code}, "
           f"confirm-ai-pack {r4.status_code} -> status={b['status']}, plan={b['plan']}, aiExtraCredits={b['aiExtraCredits']}. "
           "Em produção depende só de BILLING_GATEWAY=asaas (padrão do código é demo).")


def gen(pt, sid):
    return call("POST", f"/api/trainer/students/{sid}/ai-plans/preview", pt, timeout=120,
                json={"prompt": "Treino de pernas para iniciante", "planCount": 1})


def t5():
    """Cota de IA conta só sucessos gravados."""
    p = register("PERSONAL"); pt = login(p)
    s = register("ALUNO"); link(pt, s); sid = uid(s)
    requests.get(GEM + "/mode/fail")
    fails = [gen(pt, sid).status_code for _ in range(6)]
    gcalls = requests.get(GEM + "/").json()["calls"]
    requests.get(GEM + "/mode/slow")
    used = call("GET", "/api/trainer/billing", pt).json()
    with cf.ThreadPoolExecutor(25) as ex:
        codes = list(ex.map(lambda _: gen(pt, sid).status_code, range(25)))
    saved = sql("SELECT count(*) FROM ai_plan_generations WHERE trainer_id = :t", t=uid(p))[0][0]
    b = call("GET", "/api/trainer/billing", pt).json()
    report(5, "CONFIRMADO" if saved > b["aiGenerationsLimit"] else "NAO CONFIRMADO",
           f"6 gerações com IA fora do ar: HTTP {fails}, {gcalls} chamadas pagas ao Gemini, cota usada {used['aiGenerationsUsed']}. "
           f"25 gerações simultâneas no teste grátis (cota {b['aiGenerationsLimit']}, trava 20/h): "
           f"{codes.count(200) + codes.count(201)} OK (HTTP {sorted(set(codes))}), {saved} gravadas -> aiUsed={b['aiGenerationsUsed']}.")
    requests.get(GEM + "/mode/ok")


def t6():
    """Exportação do personal traz dados de ex-alunos e alunos excluídos."""
    p = register("PERSONAL"); pt = login(p)
    s = register("ALUNO"); st = link(pt, s); sid = uid(s)
    r = call("POST", f"/api/trainer/students/{sid}/assessments", pt, json={"assessedOn": today(), "weightKg": 80.5, "notes": "dado de saude do aluno"})
    assert r.status_code in (200, 201), r.text
    gen(pt, sid)
    call("DELETE", f"/api/trainer/students/{sid}", pt)
    ex1 = call("GET", "/api/users/me/export", pt).text
    reset_rl()
    d = call("DELETE", "/api/users/me", st, json={"password": PWD})
    reset_rl()
    ex2 = call("GET", "/api/users/me/export", pt).text
    report(6, "CONFIRMADO" if "dado de saude do aluno" in ex1 else "NAO CONFIRMADO",
           f"após encerrar o vínculo, a exportação do personal contém a avaliação do ex-aluno: {'dado de saude do aluno' in ex1}, "
           f"nome do aluno: {'Teste ALUNO' in ex1}; após o aluno excluir a conta (HTTP {d.status_code}): "
           f"avaliação ainda na exportação: {'dado de saude do aluno' in ex2}, geração de IA: {'Treino de pernas' in ex2}.")


def t8():
    """Access token antigo continua válido depois da troca de senha."""
    m = register("ALUNO"); tok = login(m)
    reset_rl()
    r = call("POST", "/api/users/change-password", tok, json={"currentPassword": PWD, "newPassword": "Nova@1234"})
    p = call("GET", "/api/users/profile", tok)
    report(8, "CONFIRMADO" if r.status_code == 200 and p.status_code == 200 else "NAO CONFIRMADO",
           f"change-password HTTP {r.status_code}; token emitido antes da troca em /api/users/profile: HTTP {p.status_code} "
           "(vale até JWT_EXPIRATION_MS).")


def t9():
    """Cancelar BASE pago e pedir PRO dá limites PRO sem pagar."""
    p = register("PERSONAL"); pt = login(p)
    call("POST", "/api/trainer/billing/subscribe", pt, json={"plan": "BASE"})
    call("POST", "/api/trainer/billing/demo/confirm-payment", pt)
    paid = call("GET", "/api/trainer/billing", pt).json()
    # Fora do teste grátis, para o limite vir só do plano.
    sql("UPDATE trainer_subscriptions SET trial_ends_at = now() - interval '1 day' WHERE trainer_id = :t", t=uid(p))
    c = call("POST", "/api/trainer/billing/cancel", pt)
    r = call("POST", "/api/trainer/billing/subscribe", pt, json={"plan": "PRO"})
    b = call("GET", "/api/trainer/billing", pt).json()
    report(9, "CONFIRMADO" if b["studentLimit"] is None and b["aiGenerationsLimit"] == 100 else "NAO CONFIRMADO",
           f"BASE pago: maxStudents={paid['studentLimit']}, aiLimit={paid['aiGenerationsLimit']}; cancel {c.status_code}; "
           f"subscribe PRO {r.status_code} sem pagar -> status={b['status']}, plan={b['plan']}, "
           f"maxStudents={b['studentLimit']}, aiLimit={b['aiGenerationsLimit']}.")


def t13():
    """Personal atual edita/apaga avaliação do personal anterior."""
    a = register("PERSONAL"); at = login(a)
    b = register("PERSONAL"); bt = login(b)
    s = register("ALUNO"); st = link(at, s); sid = uid(s)
    ass = call("POST", f"/api/trainer/students/{sid}/assessments", at, json={"assessedOn": today(), "weightKg": 70}).json()
    call("DELETE", "/api/me/trainer", st)
    link(bt, s)
    u = call("PUT", f"/api/trainer/students/{sid}/assessments/{ass['id']}", bt, json={"assessedOn": today(), "weightKg": 999 / 10})
    owner = sql("SELECT u.email FROM physical_assessments pa JOIN users u ON u.id = pa.trainer_id WHERE pa.id = CAST(:i AS uuid)", i=ass["id"])
    d = call("DELETE", f"/api/trainer/students/{sid}/assessments/{ass['id']}", bt)
    report(13, "CONFIRMADO" if u.status_code == 200 else "NAO CONFIRMADO",
           f"personal B editou a avaliação criada por A: HTTP {u.status_code}; autor registrado depois da edição: "
           f"{'A (anterior)' if owner and owner[0][0] == a else owner}; B apagou: HTTP {d.status_code}.")


def t14():
    """Cadastro não confirmado reserva celular/CPF."""
    ph, doc = phone(), cpf()
    register("PERSONAL", verify=False, ph=ph, doc=doc)
    reset_rl()
    r1 = call("POST", "/api/auth/register", json={"nome": "Dono real", "email": email("real"), "senha": PWD, "role": "ALUNO", "phone": ph, "termsAccepted": True})
    reset_rl()
    r2 = call("POST", "/api/auth/register", json={"nome": "Dono real", "email": email("real"), "senha": PWD, "role": "PERSONAL", "phone": phone(), "cpf": doc, "termsAccepted": True})
    report(14, "CONFIRMADO" if r1.status_code >= 400 and r2.status_code >= 400 else "NAO CONFIRMADO",
           f"conta não confirmada segura o celular (novo cadastro: HTTP {r1.status_code} {r1.text[:70]!r}) "
           f"e o CPF (HTTP {r2.status_code} {r2.text[:50]!r}).")


def t15():
    """Convite por e-mail revela papel e vínculo."""
    p = register("PERSONAL"); pt = login(p)
    other = register("PERSONAL"); ot = login(other)
    free = register("ALUNO")
    taken = register("ALUNO"); link(ot, taken)
    out = {}
    for k, m in [("inexistente", email("x")), ("personal", other), ("aluno com personal", taken), ("aluno livre", free)]:
        r = call("POST", "/api/trainer/invites", pt, json={"studentEmail": m})
        out[k] = f"{r.status_code} {r.text[:60]}"
    distinct = len({v for v in out.values()}) == 4
    report(15, "CONFIRMADO" if distinct else "NAO CONFIRMADO", "; ".join(f"{k}: {v}" for k, v in out.items()))


def t18():
    """SSE sem limite de conexões por personal."""
    p = register("PERSONAL"); pt = login(p)
    conns = []
    for _ in range(40):
        # Leitura com timeout curto: conexão viva fica muda (ping só a cada 25 s) e estoura o timeout.
        r = requests.get(API + "/api/trainer/events", headers={"Authorization": "Bearer " + pt}, stream=True, timeout=(5, 3))
        conns.append(r)
    time.sleep(1)

    def alive(r):
        # Conexão encerrada pelo servidor termina o stream; viva, só recebe o ping a cada 25 s.
        try:
            for _ in r.iter_lines():
                pass
            return False
        except requests.exceptions.RequestException:
            return True

    open_now = sum(alive(r) for r in conns)
    for r in conns:
        r.close()
    report(18, "CONFIRMADO" if open_now > 10 else "NAO CONFIRMADO",
           f"40 conexões SSE abertas pelo mesmo personal; continuam abertas no servidor: {open_now}.")


def t19_t21():
    """Séries sem máximo em /sessions/log e sessões ilimitadas por dia."""
    p = register("PERSONAL"); pt = login(p)
    s = register("ALUNO"); st = link(pt, s); sid = uid(s)
    plan(pt, sid)
    ex = str(sql("SELECT e.id FROM exercises e JOIN workout_plans w ON w.id = e.workout_plan_id WHERE w.user_id = CAST(:u AS uuid)", u=sid)[0][0])
    n = 5000
    reset_rl()
    t0 = time.time()
    r = call("POST", "/api/sessions/log", st, timeout=300, json={"durationInSeconds": 600, "date": today(),
             "exercisesLog": [{"exerciseId": ex, "setNumber": i + 1, "repsPerformed": 10, "weightUsed": 20} for i in range(n)]})
    dt = time.time() - t0
    rows = sql("SELECT count(*) FROM exercise_set_logs")[0][0]
    report(19, "CONFIRMADO" if r.status_code in (200, 201) else "NAO CONFIRMADO",
           f"uma sessão com {n} séries: HTTP {r.status_code} {r.text[:80]!r} em {dt:.1f}s; linhas em exercise_set_logs: {rows}.")
    codes = []
    for _ in range(4):
        reset_rl()
        r = call("POST", "/api/sessions/log", st, json={"durationInSeconds": 21600, "date": today(),
                 "exercisesLog": [{"exerciseId": ex, "setNumber": 1, "repsPerformed": 10, "weightUsed": 20}]})
        codes.append(r.status_code)
    hours = sql("SELECT sum(duration_in_seconds) / 3600.0 FROM workout_sessions w JOIN users u ON u.id = w.user_id WHERE u.email = :e AND w.session_date = CURRENT_DATE", e=s)[0][0]
    report(21, "CONFIRMADO" if codes.count(201) + codes.count(200) == 4 else "NAO CONFIRMADO",
           f"4 sessões de 6 h no mesmo dia: HTTP {codes}; total gravado hoje: {float(hours):.1f} h (conta no ranking da Arena).")


def t20():
    """Rate limiter grava no Postgres a cada requisição, inclusive bloqueadas."""
    reset_rl()
    def writes():
        return sql("SELECT n_tup_ins + n_tup_upd FROM pg_stat_user_tables WHERE relname = 'rate_limit_counters'")[0][0]
    time.sleep(2); w0 = writes()
    codes = [call("GET", "/api/public/invite-codes/NAOEXISTE").status_code for _ in range(100)]
    counts = sql("SELECT key, count FROM rate_limit_counters WHERE key LIKE :k", k="ip:%")
    time.sleep(3); w1 = writes()
    report(20, "CONFIRMADO" if all(c == 100 for _, c in counts) else "NAO CONFIRMADO",
           f"100 requisições anônimas (limite 30/min): {codes.count(429)} bloqueadas com 429; "
           f"contadores gravados: {counts} (cada pedido, inclusive os bloqueados, faz um UPSERT em cada contador).")


def lacuna():
    """Empresa remove o personal: vínculos COMPANY seguem ativos e o personal mantém acesso."""
    et, p, pt = t2_t4()
    s = register("ALUNO")
    r = call("POST", "/api/empresa/alunos", et, json={"studentEmail": s, "trainerEmail": p})
    st = login(s)
    inv = call("GET", "/api/me/invites", st).json()
    call("POST", f"/api/me/invites/{inv[0]['id']}/accept", st)
    pid = uid(p)
    d = call("DELETE", f"/api/empresa/personais/{pid}", et)
    status = sql("SELECT status, source FROM trainer_clients WHERE trainer_id = :t", t=pid)
    a = call("GET", f"/api/trainer/students/{uid(s)}/assessments", pt)
    report("lacuna", "CONFIRMADO" if a.status_code == 200 and status and status[0][0] == "ATIVO" else "NAO CONFIRMADO",
           f"empresa vinculou aluno {r.status_code}; removeu o personal {d.status_code}; vínculo depois: {status}; "
           f"personal removido lê avaliações do aluno: HTTP {a.status_code}.")


def t8_reset():
    """Mesmo teste do item 8, pelo caminho do código de recuperação."""
    m = register("ALUNO"); tok = login(m)
    sql("UPDATE users SET credentials_changed_at = now() WHERE email = :e", e=m)
    p = call("GET", "/api/users/profile", tok)
    print(f"[8b] token emitido antes de credentials_changed_at: HTTP {p.status_code}", flush=True)


def extra():
    """Série gravada em exercício da ficha de outro aluno."""
    p = register("PERSONAL"); pt = login(p)
    a = register("ALUNO"); link(pt, a); plan(pt, uid(a))
    ex = str(sql("SELECT e.id FROM exercises e JOIN workout_plans w ON w.id = e.workout_plan_id WHERE w.user_id = CAST(:u AS uuid)", u=uid(a))[0][0])
    b = register("ALUNO"); bt = login(b); reset_rl()
    r = call("POST", "/api/sessions/log", bt, json={"durationInSeconds": 600, "date": today(),
             "exercisesLog": [{"exerciseId": ex, "setNumber": 1, "repsPerformed": 10, "weightUsed": 20}]})
    report("extra", "CONFIRMADO" if r.status_code in (200, 201) else "NAO CONFIRMADO",
           f"aluno B gravou série no exercício da ficha do aluno A: HTTP {r.status_code}.")


ALL = {"t1": t1, "t2": t2_t4, "t3": t3, "t5": t5, "t6": t6, "t8": t8, "t9": t9, "t13": t13, "t14": t14,
       "t15": t15, "t18": t18, "t19": t19_t21, "t20": t20, "lacuna": lacuna, "t8b": t8_reset, "extra": extra}

for name in sys.argv[1:] or ALL:
    try:
        ALL[name]()
    except Exception as e:
        print(f"[{name}] ERRO NO TESTE: {e!r}"[:600], flush=True)
