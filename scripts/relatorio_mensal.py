#!/usr/bin/env python3
"""Relatório mensal do Ramos de Oliveira ERP.

Roda automaticamente pelo GitHub Actions (.github/workflows/relatorio.yml),
uma vez por mês. Lê pedidos e produtos direto do Supabase usando a service
role key (que ignora as políticas de RLS — a forma padrão de uma automação
de backend ler os dados sem depender de um login de usuário) e imprime um
resumo de vendas/custo do mês anterior, parcelas vencidas e produtos com
estoque baixo. A saída fica registrada no log da execução em Actions.

Requer a variável de ambiente SUPABASE_SERVICE_ROLE_KEY (definida como
segredo do repositório, nunca commitada). A service role key nunca deve ir
para o site publicado — só é usada aqui, do lado do servidor.
"""
import os
import sys
from datetime import date, timedelta

import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://bkownolaktcsxlvewijz.supabase.co")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SERVICE_KEY:
    print("Erro: defina a variável de ambiente SUPABASE_SERVICE_ROLE_KEY.", file=sys.stderr)
    sys.exit(1)

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
}


def fetch_all(path, params):
    """Pagina uma consulta REST do PostgREST até esgotar os resultados."""
    rows = []
    limit = 1000
    offset = 0
    while True:
        q = dict(params)
        q["limit"] = limit
        q["offset"] = offset
        resp = requests.get(f"{SUPABASE_URL}/rest/v1/{path}", headers=HEADERS, params=q, timeout=30)
        resp.raise_for_status()
        batch = resp.json()
        rows.extend(batch)
        if len(batch) < limit:
            break
        offset += limit
    return rows


def parcela_vencimento_estimado(data_compra, n):
    """Mesma estimativa usada no site: data da compra + N meses (N = nº da parcela)
    — o sistema não guarda um vencimento real, só a data em que a parcela foi paga."""
    if not data_compra:
        return None
    y, m, d = (int(x) for x in data_compra[:10].split("-"))
    m += n
    y += (m - 1) // 12
    m = ((m - 1) % 12) + 1
    while True:
        try:
            return date(y, m, d)
        except ValueError:
            d -= 1  # dia não existe no mês de destino (ex.: 31 -> fev); recua até caber


def main():
    pedidos = fetch_all(
        "pedidos",
        {
            "select": "numero,data_compra,codigo_cliente,cliente_nome,"
            "pedido_itens(codigo_produto,descricao,uni,valor_venda,valor_compra,valor_parcela,"
            "parcelas(n,data_pgto,recebimento,desconto))"
        },
    )
    produtos = fetch_all("produtos", {"select": "codigo,descricao,estoque,estoque_min"})

    hoje = date.today()
    ultimo_mes_fim = hoje.replace(day=1) - timedelta(days=1)
    mes_alvo = ultimo_mes_fim.strftime("%Y-%m")

    vendas_mes = custo_mes = 0.0
    pedidos_mes = 0
    parcelas_vencidas = []
    total_a_receber = 0.0

    for p in pedidos:
        data_compra = p.get("data_compra") or ""
        itens = p.get("pedido_itens") or []
        if data_compra[:7] == mes_alvo:
            pedidos_mes += 1
            for it in itens:
                uni = float(it.get("uni") or 1)
                vendas_mes += float(it.get("valor_venda") or 0) * uni
                custo_mes += float(it.get("valor_compra") or 0) * uni
        for it in itens:
            valor_parcela = float(it.get("valor_parcela") or 0)
            for parc in it.get("parcelas") or []:
                recebido = float(parc.get("recebimento") or 0)
                desconto = float(parc.get("desconto") or 0)
                saldo = max(0.0, valor_parcela - recebido - desconto)
                if saldo <= 0.005:
                    continue
                total_a_receber += saldo
                if parc.get("data_pgto"):
                    continue
                venc = parcela_vencimento_estimado(data_compra, parc.get("n") or 1)
                if venc and venc < hoje:
                    parcelas_vencidas.append({
                        "pedido": p.get("numero"),
                        "cliente": p.get("cliente_nome") or p.get("codigo_cliente") or "",
                        "vencimento": venc,
                        "valor": saldo,
                        "dias_atraso": (hoje - venc).days,
                    })

    estoque_min_padrao = 5
    baixo_estoque = [
        p for p in produtos
        if p.get("estoque") is not None
        and p.get("estoque") <= (p.get("estoque_min") if p.get("estoque_min") is not None else estoque_min_padrao)
    ]

    print("=" * 64)
    print(f"RAMOS DE OLIVEIRA — Relatório mensal ({mes_alvo})")
    print("=" * 64)
    print(f"Pedidos no mês:                                  {pedidos_mes}")
    print(f"Vendas no mês:                                   R$ {vendas_mes:,.2f}")
    print(f"Custo no mês:                                    R$ {custo_mes:,.2f}")
    print(f"Lucro no mês:                                    R$ {vendas_mes - custo_mes:,.2f}")
    print(f"Total a receber (todas as parcelas em aberto):   R$ {total_a_receber:,.2f}")
    print()
    parcelas_vencidas.sort(key=lambda l: -l["dias_atraso"])
    print(f"Parcelas vencidas: {len(parcelas_vencidas)}")
    for l in parcelas_vencidas[:30]:
        print(f"  Pedido {l['pedido']!s:>5} · {l['cliente']:<30} · vencida há {l['dias_atraso']:>3}d · R$ {l['valor']:,.2f}")
    if len(parcelas_vencidas) > 30:
        print(f"  … e mais {len(parcelas_vencidas) - 30} parcela(s) vencida(s).")
    print()
    print(f"Produtos com estoque baixo: {len(baixo_estoque)}")
    for p in baixo_estoque:
        print(f"  {p.get('descricao')} (cód. {p.get('codigo')}) — {p.get('estoque')} un.")
    print("=" * 64)


if __name__ == "__main__":
    main()
