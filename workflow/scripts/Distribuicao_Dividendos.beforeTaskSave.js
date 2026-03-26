function beforeTaskSave(colleagueId,nextSequenceId,userList){
	/*log.info("[AUDITORIA] beforeTaskSave Iniciado...");

    // =========================================================
    // TAREFA 2: O "Radar" de Etapas
    // =========================================================
    // Captura o ID da etapa em que o usuário está no momento do clique
    var atividadeAtual = getValue("WKNumState");

    // O ID 4 é a "Aprovação do Conselho" (Diretoria) no nosso diagrama BPMN
    if (atividadeAtual == 4 || atividadeAtual == 6) {

        // =========================================================
        // TAREFA 3: O Crachá e o Relógio (Segurança de Servidor)
        // =========================================================
        // Pega a matrícula exata de quem está logado apertando o botão
        var usuarioLogado = getValue("WKUser");

        // Invoca o relógio interno do servidor Fluig (Inviolável)
        var formatadorData = new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm:ss");
        var dataExata = formatadorData.format(new java.util.Date());

        // =========================================================
        // TAREFA 4: O Carimbo Invisível (Gravando no Banco)
        // =========================================================
        // Injeta esses valores no banco de dados da solicitação de forma silenciosa
        hAPI.setCardValue("usuarioAprovacaoDiretoria", usuarioLogado);
        hAPI.setCardValue("dataAprovacaoDiretoria", dataExata);

        log.info("[AUDITORIA] Diretoria assinou. Usuário: " + usuarioLogado + " | Data: " + dataExata);
    
    
    // =========================================================
        // 4. Auditoria da Controladoria (Avaliação Técnica - ID 6)
        // =========================================================
        else if (atividadeAtual == 6) {
            hAPI.setCardValue("usuarioAvaliacaoControladoria", usuarioLogado);
            hAPI.setCardValue("dataAvaliacaoControladoria", dataExata);
            
            log.info("[AUDITORIA] Controladoria avaliou os impostos. Usuário: " + usuarioLogado + " | Data: " + dataExata);
        }
	}*/
}