function displayFields(form, customHTML){

    // =========================================================
    // BLOCO 1: Captura de Variáveis Globais (Mapeamento do BPMN)
    // =========================================================
    var ATIVIDADES = {
        INICIO: 0,
        INICIALIZACAO: 1,
        PLANEJAMENTO_FINANCEIRO: 2,
        APROVACAO_CONSELHO: 4,
        AVALIACAO_TECNICA: 6, // Corrigido erro de digitação aqui
        SOLICITACAO_ATA: 12,
        ASSINATURA_ATA: 14,
        REJEICAO_FIM: 19,
        INTEGRACAO_RM_TOTVS: 89,
        PROGRAMACAO_PAGAMENTOS: 25,
        VALIDACAO_PAGAMENTO: 27,
        CONCILIACAO_FINANCEIRA: 32,
        ANEXACAO_COMPROVANTE: 33,
        PROVISOES_FINANCEIRAS: 34,
        INTEGRACAO_RM_TOTVS_REGULAR: 35,
        PROGRAMACAO_PAGAMENTO_REGULAR: 36,
        CONCILIACAO_FINANCEIRA_REGULAR: 37,
        INTEGRACAO_CONTABIL_REGULAR: 38,
        FIM: 40,
        INTEGRACAO_CONTABIL: 43,
        CONCILIACAO_CONTABIL: 44,
        GATEWAY_APROVACAO_1: 65,
        GATEWAY_DECISAO_2: 68,
        GATEWAY_ASSINATURA_ATA_3: 72,
        GATEWAY_SALDO_EXISTENTE_4: 76
    };

    // ---------------------------------------------------------
    // TRAVA DE SEGURANÇA SÊNIOR (Evitando o bug do NaN no Fluig)
    // ---------------------------------------------------------
    var state = getValue("WKNumState");
    // Se for nulo ou vazio (início do processo), força o 0. Caso contrário, converte com segurança.
    var atividadeAtual = (state != null && state !== "") ? parseInt(state) : ATIVIDADES.INICIO;
    
    var modoFormulario = form.getFormMode();

    // =========================================================
    // BLOCO 2: Injeção de dados no HTML (Ponte Back-end -> Front-end)
    // =========================================================
    customHTML.append("<script>");
    customHTML.append("    $('#atividadeAtual').val('" + atividadeAtual + "');");
    customHTML.append("    $('#modoFormulario').val('" + modoFormulario + "');");
    customHTML.append("</script>");

    // =========================================================
    // BLOCO 3: Regras de Visibilidade de Painéis (Segurança de Tela)
    // =========================================================

    // Etapa 1: Início / Planejamento Financeiro (Atividades 0, 1 e 2)
    if (atividadeAtual === ATIVIDADES.INICIO || atividadeAtual === ATIVIDADES.INICIALIZACAO || atividadeAtual === ATIVIDADES.PLANEJAMENTO_FINANCEIRO) {
        
        // No início, ninguém precisa ver a aprovação da diretoria nem os dados da Ata.
        form.setVisibleById("panelAvaliacoes", false);
        form.setVisibleById("panelConclusao", false);
        
    } 
    // Etapa 2 e 3: Avaliações (Aprovação Diretoria [1] e Avaliação Controladoria [2])
    else if (atividadeAtual === ATIVIDADES.APROVACAO_CONSELHO || atividadeAtual === ATIVIDADES.AVALIACAO_TECNICA) {
        
        // Aqui, o painel de "Estruturação" e "Avaliações" ficam visíveis. 
        // Ocultamos apenas a parte de Ata e Execução Financeira, pois o processo não chegou lá.
        form.setVisibleById("panelConclusao", false);
        
    }
    
    // NOTA ARQUITETÔNICA: 
    // Para todas as demais etapas de backoffice (Solicitação de Ata [3], Programação de Pagamentos [4], etc), 
    // nenhum 'if' será acionado. Isso significa que TODOS os painéis ficarão visíveis para que 
    // o Financeiro possa consultar o histórico completo, protegidos pelo 'enableFields.js' que já construímos.
}
