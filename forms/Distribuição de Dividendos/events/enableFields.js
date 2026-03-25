function enableFields(form) {

    // 1. DEFINIÇÃO DAS CONSTANTES DE ATIVIDADES (Mapeamento do BPMN)
    var ATIVIDADES = {
        INICIO: 0,
        INICIALIZACAO: 4,
        APROVACAO_CONSELHO: 5,
        AVALIACAO_TECNICA: 9,
        GATEWAY_APROVACAO_CONSELHO: 7,
        GATEWAY_ANTECIPCAO_1: 11,
        INTEGRACAO_RM: 23,
        FINANCEIRO_PROGRAMA_PAGAMENTO_SOLICITADO: 17,
        GATEWAY_PAGAMENTO_REALIZADO: 28,
        FINANCEIRO_CONCILIA_PAGAMENTO: 32,
        FINANCEIRO_ANEXA_COMPROVANTE_PAGAMENTO_FLUIG: 34,
        GATEWAY_ANTECIPACAO_2: 36,
        FIM_01: 38,
        FIM_02: 51,
        GERA_ATA_ASSINATURA_SOCIOS: 19,
        GATEWAY_ASSINADA: 21,
        ANTECIPACAO_ANTERIOR: 26,
        INTEGRA_CONTABILIDADE: 42,
        CONTABILIDADE_CONCILIA_MOVIMENTACAO: 48,
        GATEWAY_SALDO_ANTEIPACAO_EXISTENTE: 50,
        SOLICITA_DISTRIBUICAO_ANTECIPACAO: 54,
        PLANEJAMENTO_AVALIA_ENCAMINHA_DISTRIBUICAO: 56,
        PLANEJAMENTO_FINANCEIRO_SOLICITA_PROVISAO_PAGAMENTOS: 45,
        PLANEJAMENTO_SOLICITA_ATA_FLUIG: 13
    };

    // 2. CAPTURA DO ESTADO ATUAL (Convertido para Inteiro)
    var atividadeAtual = getValue("WKNumState") != null ? parseInt(getValue("WKNumState")) : ATIVIDADES.INICIO;

    // 3. AGRUPAMENTOS DE ETAPAS (Para simplificar os IFs)
    var etapasAta = [ATIVIDADES.PLANEJAMENTO_SOLICITA_ATA_FLUIG, ATIVIDADES.GERA_ATA_ASSINATURA_SOCIOS];
    var etapasFinanceiro = [
        ATIVIDADES.FINANCEIRO_PROGRAMA_PAGAMENTO_SOLICITADO, ATIVIDADES.FINANCEIRO_CONCILIA_PAGAMENTO, 
        ATIVIDADES.FINANCEIRO_ANEXA_COMPROVANTE_PAGAMENTO_FLUIG, ATIVIDADES.CONTABILIDADE_CONCILIA_MOVIMENTACAO, 
        ATIVIDADES.PLANEJAMENTO_FINANCEIRO_SOLICITA_PROVISAO_PAGAMENTOS
    ];

    // ======================================================================
    // 4. LÓGICA DE BLOQUEIO PROGRESSIVA
    // ======================================================================

    // ETAPA 2: Aprovação da Diretoria (Não pode mexer no Planejamento)
    if (atividadeAtual === ATIVIDADES.APROVACAO_CONSELHO) {
        bloquearPlanejamentoFinanceiro(form);
    }
    // ETAPA 3: Avaliação da Controladoria (Não pode mexer no Planejamento nem na Diretoria)
    else if (atividadeAtual === ATIVIDADES.AVALIACAO_TECNICA) {
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
    // FIM DO PROCESSO: Auditoria Total (Tudo Bloqueado)
    else if (atividadeAtual === ATIVIDADES.FIM_01 || atividadeAtual === ATIVIDADES.FIM_02) {
        bloquearPlanejamentoFinanceiro(form);
        bloquearDiretoria(form);
        bloquearControladoria(form);
        bloquearAta(form);
        bloquearFinanceiro(form);
        bloquearAuditoria(form); 
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
    form.setEnabled("formaDistribuicao", false); // Tarefa 4: Novo campo
    form.setEnabled("receitaBruta", false);
    form.setEnabled("basePresumida", false);
    form.setEnabled("origemLucro", false);
    form.setEnabled("solicitacoesVinculadas", false); // Tarefa 4: Novo campo
    form.setEnabled("valorProposto", false);
    form.setEnabled("empresaFilial", false);
    form.setEnabled("centroCusto", false);
    
    // Tarefa 3: Bloqueio estrutural da Tabela Pai x Filho
    form.setEnabled("tabela_socios", false); 

    // 2. Bloqueia todos os campos internos da Tabela Pai x Filho de Sócios
    var indicesSocios = form.getChildrenIndexes("tabela_socios");
    for (var i = 0; i < indicesSocios.length; i++) {
        var linha = indicesSocios[i];
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
    form.setEnabled("lucrosAcumulados", false); // Tarefa 4: Novo campo
    form.setEnabled("totalDisponivel", false);
    form.setEnabled("assinaturaRepresentante", false);
    form.setEnabled("assinaturaFinanceiro", false);
    form.setEnabled("justificativaAta", false);
    form.setEnabled("statusAssinaturaAta", false); // Tarefa 4: Novo campo
}

function bloquearFinanceiro(form) {
    // Tarefa 3: Bloqueio estrutural da Tabela Pai x Filho (agora no lugar certo)
    form.setEnabled("tabela_pagamentos", false);

    var indicesPagamentos = form.getChildrenIndexes("tabela_pagamentos");
    for (var i = 0; i < indicesPagamentos.length; i++) {
        var linha = indicesPagamentos[i];
        form.setEnabled("pagValorBruto___" + linha, false);
        form.setEnabled("pagValorAntecipado___" + linha, false);
        form.setEnabled("pagSaldoPagar___" + linha, false);
        form.setEnabled("pagDataProgramada___" + linha, false);
        form.setEnabled("pagStatus___" + linha, false);
        form.setEnabled("pagDataEfetiva___" + linha, false);
        form.setEnabled("pagProtocolo___" + linha, false);
    }
}

// Tarefa 5: Criação do Bloqueio de Auditoria de Encerramento
function bloquearAuditoria(form) {
    form.setEnabled("auditAta", false);
    form.setEnabled("auditValores", false);
    form.setEnabled("auditImpostos", false);
    form.setEnabled("decisaoSaldoFinal", false);
}