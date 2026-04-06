function beforeTaskSave(colleagueId, nextSequenceId, userList) {
log.info("[AUDITORIA] beforeTaskSave Iniciado...");

    // =========================================================
    // O "Radar" de Etapas e Auditoria Segura
    // =========================================================
    // Captura o ID da etapa em que o usuário está no momento do clique
    var atividadeAtual = getValue("WKNumState");
    var usuarioLogado = getValue("WKUser");

    // Invoca o relógio interno do servidor Fluig (Inviolável)
    var formatadorData = new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm:ss");
    var dataExata = formatadorData.format(new java.util.Date());

    // 1. Auditoria da Diretoria (Aprovação do Conselho - ID 4)
    if (atividadeAtual == 4) {
        hAPI.setCardValue("usuarioAprovacaoDiretoria", usuarioLogado);
        hAPI.setCardValue("dataAprovacaoDiretoria", dataExata);

        log.info("[AUDITORIA] Diretoria assinou. Usuário: " + usuarioLogado + " | Data: " + dataExata);
    } 
    // 2. Auditoria da Controladoria (Avaliação Técnica - ID 6)
    else if (atividadeAtual == 6) {
        hAPI.setCardValue("usuarioAvaliacaoControladoria", usuarioLogado);
        hAPI.setCardValue("dataAvaliacaoControladoria", dataExata);
        log.info("[AUDITORIA] Controladoria avaliou os impostos. Usuário: " + usuarioLogado + " | Data: " + dataExata);
    }
    
}