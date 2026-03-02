function displayFields(form,customHTML){ 
	
	// =========================================================
    // BLOCO 1: Captura de Variáveis Globais
    // =========================================================
	var atividadeAtual = getValue("WKNumState") != null ? getValue("WKNumState") : 0;
	var modoFormulario = form.getFormMode();
	var usuarioAtual = getValue();
	
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
    if (atividadeAtual == 0 || atividadeAtual == 4 || atividadeAtual == "StartEvent_1" || atividadeAtual == "Task_PlanFin") {
        // Oculta painel de Avaliações (Diretoria/Controladoria) e Painel de Conclusão (Ata/Financeiro)
        form.setVisibleById("panelAvaliacoes", false); 
        form.setVisibleById("panelConclusao", false);
    } 
    // Etapa 2 e 3: Avaliações (Aprovação Diretoria e Avaliação Controladoria)
    else if (atividadeAtual == "Task_AprovConselho" || atividadeAtual == "Task_AvalTecnica") {
        // Exibe o painel de Estruturação e Avaliações, mas oculta a Conclusão (Atas e Pagamentos)
        form.setVisibleById("panelConclusao", false);
    }
    
    // Etapas 4 em diante: O Back-end não precisa mais ocultar nenhum painel, 
    // pois todos (Estruturação, Avaliações e Conclusão) servirão de histórico de consulta
    // para quem for gerar a Ata e realizar os pagamentos.
}
