function enableFields(form) {
    
    // 1. DEFINIÇÃO DAS CONSTANTES DE ATIVIDADES (Mapeamento do BPMN)
    var INICIO = 0;
    var INICIALIZACAO = 1;
    var PLANEJADOR_FINANCEIRO = 2;
    var APROVACAO_CONSELHO = 4;
    var AVALICAO_TECNICA = 6;
    var GATEWAY_APROVACAO_1 = 65;
    var REJEICAO_FIM = 19;
    var GATEWAY_DECISAO_2 = 68;
    var SOLICITACAO_ATA = 12;
    var ASSINATURA_ATA = 14;
    var GATEWAY_ASSINATURA_ATA_3 = 72;
    var PROVISOES_FINANCEIRAS = 34;
    var INTEGRACAO_RM_TOTVS_REGULAR = 35;
    var PROGRAMACAO_PAGAMENTO_REGULAR = 36;
    var CONCILIACAO_FINANCEIRA_REGULAR = 37;
    var INTEGRACAO_CONTABIL_REGULAR = 38;
    var GATEWAY_SALDO_EXISTENTE_4 = 76;
    var FIM = 40;

    var INTEGRACAO_RM_TOTVS = 23;
    var PROGRAMACAO_PAGAMENTOS = 25;
    var VALIDACAO_PAGAMENTO = 27;
    var CONCILIACAO_FINANCEIRA = 32;
    var ANEXACAO_COMPROVANTE = 33;
    var INTEGRACAO_CONTABIL = 43;
    var CONCILICACAO_CONTABIL = 44;

    // 2. CAPTURA DO ESTADO ATUAL (Convertido para Inteiro)
    var atividadeAtual = getValue("WKNumState") != null ? parseInt(getValue("WKNumState")) : INICIO;

    // 3. AGRUPAMENTOS DE ETAPAS (Para simplificar os IFs)
    var etapasAta = [SOLICITACAO_ATA, ASSINATURA_ATA];
    
    var etapasFinanceiro = [
        PROVISOES_FINANCEIRAS, PROGRAMACAO_PAGAMENTOS, VALIDACAO_PAGAMENTO,
        CONCILIACAO_FINANCEIRA, ANEXACAO_COMPROVANTE, CONCILICACAO_CONTABIL,
        PROGRAMACAO_PAGAMENTO_REGULAR, CONCILIACAO_FINANCEIRA_REGULAR
    ];

    // ======================================================================
    // 4. LÓGICA DE BLOQUEIO PROGRESSIVA
    // ======================================================================

    // ETAPA 2: Aprovação da Diretoria (Não pode mexer no Planejamento)
	if (atividadeAtual === APROVACAO_CONSELHO) {
        bloquearPlanejamentoFinanceiro(form);
    } 
    
    // ETAPA 3: Avaliação da Controladoria (Não pode mexer no Planejamento nem na Diretoria)
    else if (atividadeAtual === AVALICAO_TECNICA) {
        bloquearPlanejamentoFinanceiro(form);
        bloquearDiretoria(form);
    } 
    
    // ETAPAS 4 e 5: Ata e Execução Financeira (Histórico intocável)
    else if (etapasAta.indexOf(atividadeAtual) > -1 || etapasFinanceiro.indexOf(atividadeAtual) > -1) {
        
        // Bloqueia todo o histórico inicial para todos
        bloquearPlanejamentoFinanceiro(form);
        bloquearDiretoria(form);
        bloquearControladoria(form);

        if (etapasFinanceiro.indexOf(atividadeAtual) > -1) {
            // Se já chegou no Financeiro, ele não pode alterar a Ata
            bloquearAta(form);
        } else {
            // Se estiver na etapa da Ata, o analista não pode alterar os Pagamentos
            bloquearFinanceiro(form);
        }
    }
}

// ==========================================================================
// FUNÇÕES AUXILIARES DE BLOQUEIO (Clean Code)
// Isolar esses blocos evita repetição de código (DRY - Don't Repeat Yourself)
// ==========================================================================

function bloquearPlanejamentoFinanceiro(form) {
    // 1. Bloqueia os campos fixos do cabeçalho
    form.setEnabled("anoReferencia", false);
    form.setEnabled("regimeTributario", false);
    form.setEnabled("receitaBruta", false);
    form.setEnabled("basePresumida", false);
    form.setEnabled("origemLucro", false);
    form.setEnabled("valorProposto", false);
    form.setEnabled("empresaFilial", false);
    form.setEnabled("centroCusto", false);

    // 2. Bloqueia todos os campos das novas colunas da Tabela Pai x Filho de Sócios
    var indicesSocios = form.getChildrenIndexes("tabela_socios");
    for (var i = 0; i < indicesSocios.length; i++) {
        var linha = indicesSocios[i];
        
        // Bloqueio das colunas refatoradas
        form.setEnabled("nomeSocio___" + linha, false);
        form.setEnabled("cpfCnpjSocio___" + linha, false);
        form.setEnabled("centroCustoSocio___" + linha, false); 
        form.setEnabled("percCapitalSocio___" + linha, false); 
        form.setEnabled("percDistSocio___" + linha, false);    
        form.setEnabled("valorSocio___" + linha, false);
        form.setEnabled("bancoSocio___" + linha, false);       
        form.setEnabled("agenciaSocio___" + linha, false);     
        form.setEnabled("contaSocio___" + linha, false);       
    }
}

function bloquearDiretoria(form) {
    form.setEnabled("decisaoDiretoria", false);
    form.setEnabled("motivoRejeicaoDir", false);
    form.setEnabled("obsDiretoria", false);
}

function bloquearControladoria(form) {
    form.setEnabled("checkRegime", false);
    form.setEnabled("checkDctf", false);
    form.setEnabled("checkLei9249", false);
    form.setEnabled("decisaoControladoria", false);
    form.setEnabled("parecerControladoria", false);
}

function bloquearAta(form) {
    form.setEnabled("dataAta", false);
    form.setEnabled("localAta", false);
    form.setEnabled("horarioAta", false);
    form.setEnabled("periodoReferenciaAta", false);
    form.setEnabled("resultadoLiquido", false);
    form.setEnabled("totalDisponivel", false);
    form.setEnabled("assinaturaRepresentante", false);
    form.setEnabled("assinaturaFinanceiro", false);
    form.setEnabled("justificativaAta", false);
}

function bloquearFinanceiro(form) {
    var indicesPagamentos = form.getChildrenIndexes("tabela_pagamentos");
    for (var i = 0; i < indicesPagamentos.length; i++) {
        var linha = indicesPagamentos[i];


		// Colunas de Compensação
        form.setEnabled("pagValorBruto___" + linha, false);
        form.setEnabled("pagValorAntecipado___" + linha, false);
        form.setEnabled("pagSaldoPagar___" + linha, false);

        form.setEnabled("pagDataProgramada___" + linha, false);
        form.setEnabled("pagStatus___" + linha, false);
        form.setEnabled("pagDataEfetiva___" + linha, false);
        form.setEnabled("pagProtocolo___" + linha, false);
    }
}	