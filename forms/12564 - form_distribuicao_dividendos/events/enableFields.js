function enableFields(form) {
    
    // 1. DEFINIÇÃO DAS CONSTANTES DE ATIVIDADES (Mapeamento do BPMN)
    var INICIO = 0;
    var INICIALIZACAO = 1;
    var PLANEJADOR_FINANCEIRO = 2;
    var APROVACAO_CONSELHO = 4;
    var AVALIACAO_TECNICA = 6;
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

    var INTEGRACAO_RM_TOTVS = 89;
    var PROGRAMACAO_PAGAMENTOS = 25;
    var VALIDACAO_PAGAMENTO = 27;
    var CONCILIACAO_FINANCEIRA = 32;
    var ANEXACAO_COMPROVANTE = 33;
    var INTEGRACAO_CONTABIL = 43;
    var CONCILIACAO_CONTABIL = 44;

    // 2. CAPTURA DO ESTADO ATUAL (Convertido para Inteiro)
    var state = getValue("WKNumState");
	var atividadeAtual = (state != null && state !== "" && state !== "null") ? parseInt(state) : INICIO;
    
	// 3. AGRUPAMENTOS DE ETAPAS (Para simplificar os IFs)
    var etapasAta = [SOLICITACAO_ATA, ASSINATURA_ATA];
    
    var etapasFinanceiro = [
        PROVISOES_FINANCEIRAS, PROGRAMACAO_PAGAMENTOS, VALIDACAO_PAGAMENTO,
        CONCILIACAO_FINANCEIRA, ANEXACAO_COMPROVANTE, CONCILIACAO_CONTABIL,
        PROGRAMACAO_PAGAMENTO_REGULAR, CONCILIACAO_FINANCEIRA_REGULAR
    ];

    // ======================================================================
    // 4. LÓGICA DE BLOQUEIO PROGRESSIVA
    // ======================================================================

    // Aprovação da Diretoria (Não pode mexer no Planejamento)
	if (atividadeAtual === APROVACAO_CONSELHO) {
        bloquearPlanejamentoFinanceiro(form);
    } 
    
    // Avaliação da Controladoria (Não pode mexer no Planejamento nem na Diretoria)
    else if (atividadeAtual === AVALIACAO_TECNICA) {
	    bloquearDiretoria(form);    
		bloquearPlanejamentoFinanceiro(form);
        
    } 
    
    // Ata e Execução Financeira (Histórico intocável)
    else if (etapasAta.indexOf(atividadeAtual) > -1 || etapasFinanceiro.indexOf(atividadeAtual) > -1) {
        
        // Bloqueia todo o histórico inicial para todos
        bloquearDiretoria(form);
        bloquearControladoria(form);
		bloquearPlanejamentoFinanceiro(form);

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
    // 1. Array de campos fixos (Escalável e limpo com os novos campos da Lei 15.270)
    var camposCabecalho = [
        "anoReferencia", "regimeTributario", "receitaBruta", "basePresumida",
        "origemLucro", "valorProposto", "empresaFilial", "centroCusto", "solicitacoesVinculadas",
        "valorExcedente", "valorIRRF", "valorLiquidoPagar", "dataAtaAnterior", "naturezaOrcamentaria"
    ];

    
    // Se um campo não existir, ele não derruba os outros!
    for (var c = 0; c < camposCabecalho.length; c++) {
        try {
            form.setEnabled(camposCabecalho[c], false);
        } catch (e) {
            log.info("Aviso de Arquitetura: Campo não encontrado para bloqueio: " + camposCabecalho[c]);
        }
    }

    // 2. Bloqueia os campos da Tabela Pai x Filho de Sócios
    var indicesSocios = form.getChildrenIndexes("tabela_socios");
    for (var i = 0; i < indicesSocios.length; i++) {
        var linha = indicesSocios[i];
        
        var camposTabela = [
            "nomeSocio___" + linha, "cpfCnpjSocio___" + linha, "centroCustoSocio___" + linha,
            "naturezaOrcamentariaSocio___" + linha, // Novo campo bloqueado
            "percCapitalSocio___" + linha, "percDistSocio___" + linha, "valorSocio___" + linha,
            "bancoSocio___" + linha, "agenciaSocio___" + linha, "contaSocio___" + linha
        ];
        
        for (var j = 0; j < camposTabela.length; j++) {
            try {
                form.setEnabled(camposTabela[j], false);
            } catch (e) {
                log.info("Aviso de Arquitetura: Campo da tabela não encontrado: " + camposTabela[j]);
            }
        }
    }
}

function bloquearDiretoria(form) {
    form.setEnabled("decisaoDiretoria", false);
    form.setEnabled("motivoRejeicaoDir", false);
    form.setEnabled("obsDiretoria", false);
}

function bloquearControladoria(form) {
    // Grupo Contábil
    form.setEnabled("checkDRE", false);
    form.setEnabled("checkReserva", false);
    form.setEnabled("checkSaldo", false);
    
    // Grupo Fiscal
    form.setEnabled("checkRegime", false);
    form.setEnabled("checkDctf", false);
    form.setEnabled("checkLimite50k", false);
    form.setEnabled("checkLei15270", false);
    
    // Decisão e Parecer
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