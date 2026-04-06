function enableFields(form) {
    // 1. CAPTURA DO ESTADO ATUAL (Tratamento seguro)
    var state = getValue("WKNumState");
    var etapa = (state != null && state !== "") ? parseInt(state) : 0;

    // ======================================================================
    // 2. LÓGICA DE BLOQUEIO PROGRESSIVA LINEAR
    // ======================================================================
    
    // ETAPA 4: Aprovação do Conselho (Diretoria)
    if (etapa === 4) {
        bloquearPlanejamento(form);
        bloquearControladoria(form);
    }
    // ETAPA 6: Avaliação Técnica (Controladoria)
    else if (etapa === 6) {
        bloquearPlanejamento(form);
        bloquearDiretoria(form);
    }
    // ETAPAS 12, 14 ou 25+ (Solicitação de Ata, Assinatura e Execução Financeira)
    else if (etapa >= 12) {
        bloquearPlanejamento(form);
        bloquearControladoria(form);
        bloquearDiretoria(form);
        
        // Se já passou para a Execução Financeira (Etapas 25 para cima)
        if (etapa >= 25) {
            bloquearAta(form);
        } else {
            // Se ainda está emitindo a Ata, bloqueia o Financeiro
            bloquearFinanceiro(form);
        }
    }
}

// ==========================================================================
// FUNÇÕES AUXILIARES DE BLOQUEIO (Isoladas com Try/Catch Individual)
// ==========================================================================

function bloquearPlanejamento(form) {
    var camposCabecalho = ["anoReferencia", "regimeTributario", "receitaBruta", "basePresumida", "origemLucro", "valorProposto", "empresaFilial", "centroCusto", "solicitacoesVinculadas", "valorExcedente", "valorIRRF", "valorLiquidoPagar", "dataAtaAnterior", "naturezaOrcamentaria"];
    for (var i = 0; i < camposCabecalho.length; i++) {
        try { form.setEnabled(camposCabecalho[i], false); } catch(e) {}
    }
    
    var indicesSocios = form.getChildrenIndexes("tabela_socios");
    for (var j = 0; j < indicesSocios.length; j++) {
        var linha = indicesSocios[j];
        try { form.setEnabled("nomeSocio___" + linha, false); } catch(e) {}
        try { form.setEnabled("cpfCnpjSocio___" + linha, false); } catch(e) {}
        try { form.setEnabled("centroCustoSocio___" + linha, false); } catch(e) {}
        try { form.setEnabled("naturezaOrcamentariaSocio___" + linha, false); } catch(e) {}
        try { form.setEnabled("percCapitalSocio___" + linha, false); } catch(e) {}
        try { form.setEnabled("percDistSocio___" + linha, false); } catch(e) {}
        try { form.setEnabled("valorSocio___" + linha, false); } catch(e) {}
        try { form.setEnabled("bancoSocio___" + linha, false); } catch(e) {}
        try { form.setEnabled("agenciaSocio___" + linha, false); } catch(e) {}
        try { form.setEnabled("contaSocio___" + linha, false); } catch(e) {}
    }
}

function bloquearControladoria(form) {
    var campos = ["checkDRE", "checkReserva", "checkSaldo", "checkRegime", "checkDctf", "checkLimite50k", "checkLei15270", "decisaoControladoria", "parecerControladoria"];
    for (var i = 0; i < campos.length; i++) {
        try { form.setEnabled(campos[i], false); } catch(e) {}
    }
}

function bloquearDiretoria(form) {
    var campos = ["decisaoDiretoria", "motivoRejeicaoDir", "obsDiretoria"];
    for (var i = 0; i < campos.length; i++) {
        try { form.setEnabled(campos[i], false); } catch(e) {}
    }
}

function bloquearAta(form) {
    var campos = ["dataAta", "localAta", "horarioAta", "periodoReferenciaAta", "resultadoLiquido", "totalDisponivel", "assinaturaRepresentante", "assinaturaFinanceiro", "justificativaAta"];
    for (var i = 0; i < campos.length; i++) {
        try { form.setEnabled(campos[i], false); } catch(e) {}
    }
}

function bloquearFinanceiro(form) {
    var indicesPagamentos = form.getChildrenIndexes("tabela_pagamentos");
    for (var i = 0; i < indicesPagamentos.length; i++) {
        var linha = indicesPagamentos[i];
        try { form.setEnabled("pagValorBruto___" + linha, false); } catch(e) {}
        try { form.setEnabled("pagValorAntecipado___" + linha, false); } catch(e) {}
        try { form.setEnabled("pagSaldoPagar___" + linha, false); } catch(e) {}
        try { form.setEnabled("pagDataProgramada___" + linha, false); } catch(e) {}
        try { form.setEnabled("pagStatus___" + linha, false); } catch(e) {}
        try { form.setEnabled("pagDataEfetiva___" + linha, false); } catch(e) {}
        try { form.setEnabled("pagProtocolo___" + linha, false); } catch(e) {}
    }
}