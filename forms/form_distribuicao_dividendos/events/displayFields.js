function displayFields(form,customHTML){ 
	
	// =========================================================
    // BLOCO 1: Captura de Variáveis Globais
    // =========================================================
	var ATIVIDADES = {
        INICIO: 0,
        INICIALIZACAO: 1,
        PLANEJAMENTO_FINANCEIRO: 2,
        APROVACAO_CONSELHO: 4,
        AVALIACAO_TECNICA: 6,
        SOLICITACAO_ATA: 12,
        ASSINATURA_ATA: 14,
        REJEICAO_FIM: 19,
        INTEGRACAO_RM_TOTVS: 23,
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

    var atividadeAtual = getValue("WKNumState") != null ? getValue("WKNumState") : ATIVIDADES.INICIO;
    atividadeAtual = parseInt(atividadeAtual); // Força a conversão para Número Inteiro
    
    var modoFormulario = form.getFormMode();
    var usuarioAtual = getValue("WKUser"); // Corrigido com a chamada correta do Fluig
	
	// =========================================================
    // BLOCO 2: Injeção de dados no HTML (Ponte Back-end -> Front-end)
    // =========================================================
    customHTML.append("<script>");
    customHTML.append("    $('#atividadeAtual').val('" + atividadeAtual + "');");
    customHTML.append("    $('#modoFormulario').val('" + modoFormulario + "');");
    customHTML.append("</script>");

	// =========================================================
    // BLOCO 3: Regras de Visibilidade de Painéis (Segurança de Back-end)
    // =========================================================
    
    // Etapa 1: Início / Planejamento Financeiro
    // Etapa 1: Início / Planejamento Financeiro
    if (atividadeAtual == ATIVIDADES.INICIO || atividadeAtual == ATIVIDADES.INICIALIZACAO || atividadeAtual == ATIVIDADES.PLANEJAMENTO_FINANCEIRO) {
        // Oculta painel de Avaliações (Diretoria/Controladoria) e Painel de Conclusão (Ata/Financeiro)
        form.setVisibleById("panelAvaliacoes", false); 
        form.setVisibleById("panelConclusao", false);
    } 
    // Etapa 2 e 3: Avaliações (Aprovação Diretoria e Avaliação Controladoria)
    else if (atividadeAtual == ATIVIDADES.APROVACAO_CONSELHO || atividadeAtual == ATIVIDADES.AVALIACAO_TECNICA) {
        // Exibe o painel de Estruturação e Avaliações, mas oculta a Conclusão (Atas e Pagamentos)
        form.setVisibleById("panelConclusao", false);
    }
}
