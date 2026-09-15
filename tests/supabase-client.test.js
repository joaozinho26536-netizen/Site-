// Testes das regras de negócio "puras" (sem rede) de assets/supabase-client.js.
// Roda com `npm test` (node --test tests/), sem dependência nenhuma além do
// próprio Node — o arquivo real do navegador é carregado com um `window` de
// mentirinha só pra satisfazer window.supabase.createClient(...) na primeira
// linha; nenhuma chamada de rede acontece nestes testes.
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

global.window = global;
global.window.supabase = { createClient: () => ({ auth: {} }) };
require(path.join(__dirname, '..', 'assets', 'supabase-client.js'));
const RO = global.RO;

test('fmtBRL formata em real brasileiro', () => {
  assert.equal(RO.fmtBRL(1234.5), 'R$\xa01.234,50');
  assert.equal(RO.fmtBRL(0), 'R$\xa00,00');
  assert.equal(RO.fmtBRL(null), 'R$\xa00,00');
  assert.equal(RO.fmtBRL(undefined), 'R$\xa00,00');
});

test('fmtDate formata YYYY-MM-DD em dd/mm/aaaa sem deslocar por fuso', () => {
  assert.equal(RO.fmtDate('2026-03-01'), '01/03/2026');
  assert.equal(RO.fmtDate(''), '');
  assert.equal(RO.fmtDate(null), '');
});

test('onlyDigits remove tudo que não é número', () => {
  assert.equal(RO.onlyDigits('(19) 99876-5432'), '19998765432');
  assert.equal(RO.onlyDigits('111.111.111-11'), '11111111111');
  assert.equal(RO.onlyDigits(null), '');
});

test('normName maiusculiza, tira espaço nas pontas e colapsa espaços duplos', () => {
  assert.equal(RO.normName('  maria   da silva  '), 'MARIA DA SILVA');
  assert.equal(RO.normName(''), '');
});

test('parseNumBR/fmtNumBR fazem o caminho de ida e volta do formato brasileiro', () => {
  assert.equal(RO.parseNumBR('1.234,50'), 1234.5);
  assert.equal(RO.parseNumBR('0,00'), 0);
  assert.equal(RO.parseNumBR(''), 0);
  assert.equal(RO.fmtNumBR(1234.5), '1.234,50');
  assert.equal(RO.fmtNumBR(0), '0,00');
});

test('nextCodigo pega o maior código numérico existente + 1', () => {
  const map = new Map([['1', {}], ['2', {}], ['10', {}]]);
  assert.equal(RO.nextCodigo(map), '11');
  assert.equal(RO.nextCodigo(new Map()), '1');
});

test('nextCodigo ignora chaves não puramente numéricas', () => {
  const map = new Map([['5', {}], ['5a', {}], ['abc', {}]]);
  assert.equal(RO.nextCodigo(map), '6');
});

test('nextPedidoNumero pega o maior número de pedido + 1', () => {
  const map = new Map([['101', {}], ['205', {}]]);
  assert.equal(RO.nextPedidoNumero(map), 206);
  assert.equal(RO.nextPedidoNumero(new Map()), 1);
});

test('estoqueControlado/estoqueBaixo', () => {
  assert.equal(RO.estoqueControlado({ estoque: 10 }), true);
  assert.equal(RO.estoqueControlado({ estoque: 0 }), true);
  assert.equal(RO.estoqueControlado({ estoque: null }), false);
  assert.equal(RO.estoqueControlado({ estoque: '' }), false);
  assert.equal(RO.estoqueControlado({}), false);

  assert.equal(RO.estoqueBaixo({ estoque: 3, estoque_min: 5 }), true);
  assert.equal(RO.estoqueBaixo({ estoque: 5, estoque_min: 5 }), true, 'igual ao mínimo já conta como baixo');
  assert.equal(RO.estoqueBaixo({ estoque: 6, estoque_min: 5 }), false);
  assert.equal(RO.estoqueBaixo({ estoque: 3 }), true, 'sem estoque_min definido, usa 5 como padrão');
  assert.equal(RO.estoqueBaixo({ estoque: null, estoque_min: 5 }), false, 'não controlado nunca é "baixo"');
});

test('parcelaVencimentoEstimado soma N meses à data da compra', () => {
  const pedido = { data_compra: '2026-01-31' };
  assert.equal(RO.parcelaVencimentoEstimado(pedido, 1).toISOString().slice(0, 10), '2026-03-03', 'JS soma meses "estourando" o dia 31 em fevereiro — comportamento existente, não corrigido aqui');
  assert.equal(RO.parcelaVencimentoEstimado({ data_compra: '2026-01-10' }, 2).toISOString().slice(0, 10), '2026-03-10');
  assert.equal(RO.parcelaVencimentoEstimado({}, 1), null);
});

test('proximoPagamentoPedido acha a parcela não paga com vencimento mais próximo', () => {
  const pedido = {
    data_compra: '2026-01-10',
    itens: [{
      parcelas: [
        { n: 1, data_pgto: '2026-02-10' }, // já paga, ignorada
        { n: 3, data_pgto: null },
        { n: 2, data_pgto: null },
      ],
    }],
  };
  const prox = RO.proximoPagamentoPedido(pedido);
  assert.equal(prox.toISOString().slice(0, 10), '2026-03-10', 'a parcela 2 (mar/2026) vence antes da 3 (abr/2026)');
});

test('proximoPagamentoPedido respeita proximo_pagamento_override quando presente', () => {
  const pedido = {
    data_compra: '2026-01-10', proximo_pagamento_override: '2026-12-25',
    itens: [{ parcelas: [{ n: 1, data_pgto: null }] }],
  };
  assert.equal(RO.proximoPagamentoPedido(pedido).toISOString().slice(0, 10), '2026-12-25');
});

test('proximoPagamentoPedido retorna null quando tudo está pago', () => {
  const pedido = { data_compra: '2026-01-10', itens: [{ parcelas: [{ n: 1, data_pgto: '2026-02-10' }] }] };
  assert.equal(RO.proximoPagamentoPedido(pedido), null);
});

test('pagamentosDaParcela usa o array pagamentos quando existe', () => {
  const p = { recebimento: 999, pagamentos: [{ data: '2026-01-01', valor: 50 }] };
  assert.deepEqual(RO.pagamentosDaParcela(p), [{ data: '2026-01-01', valor: 50 }]);
});

test('pagamentosDaParcela sintetiza um pagamento a partir de recebimento quando não há array', () => {
  const p = { recebimento: 100, data_pgto: '2026-01-05' };
  assert.deepEqual(RO.pagamentosDaParcela(p), [{ data: '2026-01-05', valor: 100 }]);
});

test('pagamentosDaParcela retorna vazio quando não há nada pago', () => {
  assert.deepEqual(RO.pagamentosDaParcela({ recebimento: 0 }), []);
});

test('remanescenteParcela nunca fica negativo', () => {
  assert.equal(RO.remanescenteParcela(100, { recebimento: 40, desconto: 10 }), 50);
  assert.equal(RO.remanescenteParcela(100, { recebimento: 150, desconto: 0 }), 0, 'pago a mais não vira saldo negativo');
});

test('pedidoTotais: pedido com tudo pago fica quitado', () => {
  const pedido = {
    valor_entrada: 0,
    itens: [{ valor_venda: 100, uni: 1, valor_parcela: 100, parcelas: [{ recebimento: 100, desconto: 0 }] }],
  };
  const t = RO.pedidoTotais(pedido);
  assert.equal(t.totalGeral, 100);
  assert.equal(t.totalRecebido, 100);
  assert.equal(t.saldoDevedor, 0);
  assert.equal(t.quitado, true);
});

test('pedidoTotais: entrada grande não deve mascarar parcela real em aberto (bug já corrigido no código, teste de regressão)', () => {
  // Pedido de R$100 com entrada de R$90 e uma parcela de R$100 totalmente em
  // aberto. Somando ingenuamente (entrada + parcelas pagas) contra o total
  // geral pareceria "quase quitado", mas a parcela em si não tem nada pago.
  const pedido = {
    valor_entrada: 90,
    itens: [{ valor_venda: 100, uni: 1, valor_parcela: 100, parcelas: [{ recebimento: 0, desconto: 0 }] }],
  };
  const t = RO.pedidoTotais(pedido);
  assert.equal(t.quitado, false, 'a parcela continua 100% em aberto, então o pedido não pode aparecer como quitado');
  assert.equal(t.saldoDevedor, 100);
  assert.equal(t.totalRecebido, 90, 'a entrada conta pro total recebido, mesmo não quitando a parcela');
});

test('pedidoTotais: pedido sem nenhuma parcela lançada não conta como quitado', () => {
  const t = RO.pedidoTotais({ valor_entrada: 0, itens: [{ valor_venda: 100, uni: 1, parcelas: [] }] });
  assert.equal(t.quitado, false);
});

test('listaContasAReceber só lista parcelas com saldo pendente e marca vencidas', () => {
  const ontem = new Date(); ontem.setDate(ontem.getDate() - 40);
  const dataCompraVencida = ontem.toISOString().slice(0, 10); // vence ~10 dias atrás (1 mês depois)
  const pedidos = [
    {
      numero: 1, codigo_cliente: 'c1', data_compra: dataCompraVencida,
      itens: [{ valor_parcela: 100, parcelas_qtd: 1, parcelas: [{ n: 1, recebimento: 0, desconto: 0 }] }],
    },
    {
      numero: 2, codigo_cliente: 'c1', data_compra: '2026-01-01',
      itens: [{ valor_parcela: 50, parcelas_qtd: 1, parcelas: [{ n: 1, recebimento: 50, desconto: 0 }] }],
    },
  ];
  const clientesMap = new Map([['c1', { nome: 'Maria' }]]);
  const linhas = RO.listaContasAReceber(pedidos, clientesMap);
  assert.equal(linhas.length, 1, 'a parcela já paga do pedido 2 não deve aparecer');
  assert.equal(linhas[0].numero, 1);
  assert.equal(linhas[0].valor, 100);
  assert.equal(linhas[0].vencida, true);
  assert.equal(linhas[0].cliente, 'Maria');
});
