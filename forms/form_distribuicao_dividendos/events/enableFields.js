function enableFields(form) {

        // =========================================================
    // BLOCO 1: Constantes e Captura de Variáveis Globais
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

    // 1. Captura a atividade atual e converte para Número Inteiro
    var atividadeAtual = getValue("WKNumState") != null ? getValue("WKNumState") : ATIVIDADES.INICIO;
    atividadeAtual = parseInt(atividadeAtual);

    if (atividadeAtual == ATIVIDADES.APROVACAO_CONSELHO) {
        
        form.setEnabled("anoReferencia", false);
        form.setEnabled("regimeTributario", false);
        form.setEnabled("receitaBruta", false);
        form.setEnabled("basePresumida", false);
        form.setEnabled("origemLucro", false);
        form.setEnabled("valorProposto", false);
        form.setEnabled("centroCusto", false);
        
        var indicesSocios = form.getChildrenIndexes("tabela_socios");
        for (var i = 0; i < indicesSocios.length; i++) {
            var linha = indicesSocios[i];
            form.setEnabled("nomeSocio___" + linha, false);
            form.setEnabled("cpfCnpjSocio___" + linha, false);
            form.setEnabled("percSocio___" + linha, false);
            form.setEnabled("valorSocio___" + linha, false);
            form.setEnabled("dadosBancariosSocio___" + linha, false);
        }
    } else if (atividadeAtual == ATIVIDADES.AVALIACAO_TECNICA) {
        
        form.setEnabled("anoReferencia", false);
        form.setEnabled("regimeTributario", false);
        form.setEnabled("receitaBruta", false);
        form.setEnabled("basePresumida", false);
        form.setEnabled("origemLucro", false);
        form.setEnabled("valorProposto", false);
        form.setEnabled("centroCusto", false);
        
        var indicesSocios = form.getChildrenIndexes("tabela_socios");
        for (var i = 0; i < indicesSocios.length; i++) {
            var linha = indicesSocios[i];
            form.setEnabled("nomeSocio___" + linha, false);
            form.setEnabled("cpfCnpjSocio___" + linha, false);
            form.setEnabled("percSocio___" + linha, false);
            form.setEnabled("valorSocio___" + linha, false);
            form.setEnabled("dadosBancariosSocio___" + linha, false);
        }

        form.setEnabled("decisaoDiretoria", false);
        form.setEnabled("motivoRejeicaoDir", false);
        form.setEnabled("obsDiretoria", false);
    } else {
        // Listas atualizadas utilizando as constantes
        var etapasAta = [
            ATIVIDADES.SOLICITACAO_ATA, 
            ATIVIDADES.ASSINATURA_ATA
        ];
        
        var etapasFinanceiro = [
            ATIVIDADES.PROVISOES_FINANCEIRAS, 
            ATIVIDADES.PROGRAMACAO_PAGAMENTOS, 
            ATIVIDADES.VALIDACAO_PAGAMENTO, 
            ATIVIDADES.CONCILIACAO_FINANCEIRA, 
            ATIVIDADES.ANEXACAO_COMPROVANTE, 
            ATIVIDADES.CONCILIACAO_CONTABIL, 
            ATIVIDADES.PROGRAMACAO_PAGAMENTO_REGULAR, 
            ATIVIDADES.CONCILIACAO_FINANCEIRA_REGULAR
        ];

        // indexOf vai procurar o número da atividade atual dentro das nossas listas de números
        if (etapasAta.indexOf(atividadeAtual) > -1 || etapasFinanceiro.indexOf(atividadeAtual) > -1) {
            form.setEnabled("anoReferencia", false);
            form.setEnabled("regimeTributario", false);
            form.setEnabled("receitaBruta", false);
            form.setEnabled("basePresumida", false);
            form.setEnabled("origemLucro", false);
            form.setEnabled("valorProposto", false);
            form.setEnabled("centroCusto", false);
            
            var indicesSocios = form.getChildrenIndexes("tabela_socios");
            for (var i = 0; i < indicesSocios.length; i++) {
                var linha = indicesSocios[i];
                form.setEnabled("nomeSocio___" + linha, false);
                form.setEnabled("cpfCnpjSocio___" + linha, false);
                form.setEnabled("percSocio___" + linha, false);
                form.setEnabled("valorSocio___" + linha, false);
                form.setEnabled("dadosBancariosSocio___" + linha, false);
            }

            form.setEnabled("decisaoDiretoria", false);
            form.setEnabled("motivoRejeicaoDir", false);
            form.setEnabled("obsDiretoria", false);

            form.setEnabled("checkRegime", false);
            form.setEnabled("checkDctf", false);
            form.setEnabled("checkLei9249", false);
            form.setEnabled("decisaoControladoria", false);
            form.setEnabled("parecerControladoria", false);
            
            if (etapasFinanceiro.indexOf(atividadeAtual) > -1) {
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
        }
    }
}