function displayFields(form, customHTML) {

    // =========================================================
    // BLOCO 1: Captura de Variáveis Globais
    // =========================================================
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

    var atividadeAtual = getValue("WKNumState") != null ? getValue("WKNumState") : ATIVIDADES.INICIO;
    atividadeAtual = parseInt(atividadeAtual); // Força a conversão para Número Inteiro

    var modoFormulario = form.getFormMode();
    var usuarioAtual = getValue("WKUser");

    // =========================================================
    // BLOCO 2: Injeção de dados no HTML (Ponte Back-end -> Front-end)
    // =========================================================
    customHTML.append("<script>");
    customHTML.append("    $('#atividadeAtual').val('" + atividadeAtual + "');");
    customHTML.append("    $('#modoFormulario').val('" + modoFormulario + "');");
    customHTML.append("</script>");

    // =========================================================
    // BLOCO 3: Regras de Segurança e Visibilidade (Back-end)
    // =========================================================

    // Regra de Exceção: Se o formulário estiver sendo apenas visualizado (Histórico/Fim)
    if (modoFormulario == "VIEW") {
        return; // Interrompe as regras para que o usuário veja tudo no modo visualização
    }

    // ---------------------------------------------------------
    // TRAVA DE SEGURANÇA: Bloqueio de Edição (Imutabilidade)
    // ---------------------------------------------------------
    // Se a solicitação já saiu das mãos do Planejamento Financeiro, 
    // ninguém mais pode alterar os dados estruturais e os valores do rateio.
    if (atividadeAtual != ATIVIDADES.INICIO && atividadeAtual != ATIVIDADES.INICIALIZACAO) {

        // Bloqueia os campos do Painel de Dados Tributários e Origem
        form.setEnabled("anoReferencia", false);
        form.setEnabled("regimeTributario", false);
        form.setEnabled("formaDistribuicao", false); // Campo novo adicionado recentemente
        form.setEnabled("receitaBruta", false);
        form.setEnabled("basePresumida", false);
        form.setEnabled("origemLucro", false);
        form.setEnabled("solicitacoesVinculadas", false);

        // Bloqueia os campos de valores propostos e classificação
        form.setEnabled("valorProposto", false);
        form.setEnabled("empresaFilial", false);
        form.setEnabled("centroCusto", false);
    }

    // ---------------------------------------------------------
    // VISIBILIDADE DE PAINÉIS
    // ---------------------------------------------------------

    // Etapa 1: Início / Planejamento Financeiro
    if (atividadeAtual == ATIVIDADES.INICIO || atividadeAtual == ATIVIDADES.INICIALIZACAO) {
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