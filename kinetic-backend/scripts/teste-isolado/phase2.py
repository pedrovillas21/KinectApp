# Fase 2 (backend reiniciado com outras variáveis). Uso: python phase2.py <passo>
#   root-setup      cria a conta confirmada que vai virar ROOT (antes de reiniciar com ROOT_USER_EMAIL)
#   root-check      confere a promoção depois do reinício
#   purge-setup     cria um cadastro não confirmado de 4 dias atrás (item 14)
#   asaas           webhooks de estorno/chargeback (BILLING_GATEWAY=asaas, ASAAS_WEBHOOK_TOKEN=whtoken)
import sys
from lib import *

ROOT_MAIL = "root-check@teste.local"


def try_login(mail, pwd):
    reset_rl()
    return call("POST", "/api/auth/login", json={"email": mail, "senha": pwd}).status_code


step = sys.argv[1]

if step == "root-setup":
    register("ALUNO", mail=ROOT_MAIL)
    print("conta confirmada criada:", ROOT_MAIL)

if step == "root-check":
    role = sql("SELECT role FROM users WHERE email = :e", e=ROOT_MAIL)[0][0]
    print(f"[7] conta autocadastrada e confirmada com ROOT_USER_EMAIL -> role: {role}; "
          f"login com a senha do cadastro: HTTP {try_login(ROOT_MAIL, PWD)}; "
          f"login com ROOT_USER_PASSWORD: HTTP {try_login(ROOT_MAIL, 'RootSeed@999')}")

if step == "purge-setup":
    ph = phone()
    m = register("ALUNO", verify=False, ph=ph)
    sql("UPDATE users SET created_at = now() - interval '4 days' WHERE email = :e", e=m)
    print(m, ph)

if step == "purge-check":
    m, ph = sys.argv[2], sys.argv[3]
    left = sql("SELECT count(*) FROM users WHERE email = :e", e=m)[0][0]
    reset_rl()
    r = call("POST", "/api/auth/register", json={"nome": "Dono real", "email": email("real"), "senha": PWD,
             "role": "ALUNO", "phone": ph, "termsAccepted": True})
    print(f"[14] cadastro não confirmado de 4 dias ainda existe: {left == 1}; novo cadastro com o mesmo celular: HTTP {r.status_code}")

if step == "asaas":
    p = "asaas-personal@teste.local"
    t = uid(p)
    # Assinatura PRO paga via Asaas (estado que o webhook PAYMENT_CONFIRMED deixaria) + 20 créditos de IA.
    sql("""INSERT INTO trainer_subscriptions (id, trainer_id, status, plan, trial_ends_at, created_at, updated_at,
           gateway, gateway_customer_id, gateway_subscription_id, current_period_end, ai_extra_credits)
           VALUES (gen_random_uuid(), CAST(:t AS uuid), 'ATIVA', 'PRO', now() - interval '1 day', now(), now(),
           'ASAAS', 'cus_test', 'sub_test', now() + interval '30 days', 20)""", t=t)
    before = sql("SELECT status, plan, current_period_end, ai_extra_credits FROM trainer_subscriptions WHERE trainer_id = CAST(:t AS uuid)", t=t)
    codes = []
    for i, ev in enumerate(["PAYMENT_REFUNDED", "PAYMENT_CHARGEBACK_REQUESTED", "PAYMENT_CHARGEBACK_DISPUTE",
                            "PAYMENT_REFUND_IN_PROGRESS", "PAYMENT_DELETED"]):
        r = call("POST", "/api/webhooks/asaas", headers={"asaas-access-token": "whtoken"},
                 json={"id": f"evt_{i}", "event": ev, "payment": {"id": "pay_1", "subscription": "sub_test", "dueDate": today()}})
        codes.append(f"{ev}={r.status_code}")
    after = sql("SELECT status, plan, current_period_end, ai_extra_credits FROM trainer_subscriptions WHERE trainer_id = CAST(:t AS uuid)", t=t)
    print(f"[16] webhooks aceitos: {codes}; assinatura antes: {before}; depois: {after}")
