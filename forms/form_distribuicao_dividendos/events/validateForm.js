function validateForm(form) {
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

    // 1. Captura a atividade atual do processo e converte para número
    var atividadeAtual = getValue("WKNumState") != null ? getValue("WKNumState") : ATIVIDADES.INICIO;
    atividadeAtual = parseInt(atividadeAtual);

    // 2. Variável que vai acumular todas as mensagens de erro
    var msgErro = "";

    if (atividadeAtual == ATIVIDADES.INICIO || atividadeAtual == ATIVIDADES.INICIALIZACAO || atividadeAtual == ATIVIDADES.PLANEJAMENTO_FINANCEIRO) {
        
        if (form.getValue("anoReferencia") == "") {
            msgErro += "- O campo 'Ano de Referência' é obrigatório.<br>";
        }
        if (form.getValue("regimeTributario") == "") {
            msgErro += "- A seleção do 'Regime Tributário' é obrigatória.<br>";
        }
        if (form.getValue("receitaBruta") == "") {
            msgErro += "- O campo 'Receita Bruta do Período' é obrigatório.<br>";
        }
        if (form.getValue("basePresumida") == "") {
            msgErro += "- O campo 'Base de Cálculo Presumida' é obrigatório.<br>";
        }
        if (form.getValue("origemLucro") == null || form.getValue("origemLucro") == "") {
            msgErro += "- A 'Origem do Lucro' (Corrente ou Anterior) deve ser selecionada.<br>";
        }
        if (form.getValue("valorProposto") == "") {
            msgErro += "- O 'Valor Proposto para Distribuição' é obrigatório.<br>";
        }
        if (form.getValue("centroCusto") == "") {
            msgErro += "- O 'Centro de Custos' é obrigatório.<br>";
        }

        var indicesSocios = form.getChildrenIndexes("tabela_socios");
        
        if (indicesSocios.length == 0) {
            msgErro += "- É obrigatório adicionar pelo menos um sócio na Tabela de Rateio.<br>";
        } else {
            for (var i = 0; i < indicesSocios.length; i++) {
                var linha = indicesSocios[i];
                var numeroLinhaReal = i + 1; 
                
                if (form.getValue("nomeSocio___" + linha) == "") {
                    msgErro += "- O Sócio da linha " + numeroLinhaReal + " não foi informado.<br>";
                }
                if (form.getValue("percSocio___" + linha) == "") {
                    msgErro += "- O Percentual de Participação da linha " + numeroLinhaReal + " é obrigatório.<br>";
                }
                if (form.getValue("dadosBancariosSocio___" + linha) == "") {
                    msgErro += "- Os Dados Bancários do sócio na linha " + numeroLinhaReal + " são obrigatórios.<br>";
                }
            }
        }
    } else if (atividadeAtual == ATIVIDADES.APROVACAO_CONSELHO) {
        var decisaoDiretoria = form.getValue("decisaoDiretoria");
        
        if (decisaoDiretoria == null || decisaoDiretoria == "") {
            msgErro += "- É obrigatório selecionar a Decisão da Diretoria (Aprovar ou Rejeitar).<br>";
        } else if (decisaoDiretoria == "Rejeitar") {
            if (form.getValue("motivoRejeicaoDir") == null || form.getValue("motivoRejeicaoDir") == "") {
                msgErro += "- Ao rejeitar a proposta, é obrigatório selecionar o Motivo da Rejeição.<br>";
            }
        }
    } else if (atividadeAtual == "Task_AprovConselho") {

        var decisaoDiretoria = form.getValue("decisaoDiretoria");

        // 1. Valida se o Diretor selecionou uma das opções (Aprovar ou Rejeitar)
        if (decisaoDiretoria == null || decisaoDiretoria == "") {
            msgErro += "- É obrigatório selecionar a Decisão da Diretoria (Aprovar ou Rejeitar).<br>";
        }
        // 2. Validação condicional: Se a decisão for "Rejeitar", o motivo é obrigatório
        else if (decisaoDiretoria == "Rejeitar") {
            if (form.getValue("motivoRejeicaoDir") == null || form.getValue("motivoRejeicaoDir") == "") {
                msgErro += "- Ao rejeitar a proposta, é obrigatório selecionar o Motivo da Rejeição.<br>";
            }
        }
    } else if (atividadeAtual == ATIVIDADES.AVALIACAO_TECNICA) {
        var decisaoControladoria = form.getValue("decisaoControladoria");

        if (decisaoControladoria == null || decisaoControladoria == "") {
            msgErro += "- É obrigatório selecionar a Decisão da Controladoria.<br>";
        }

        if (decisaoControladoria == "Aprovar" || decisaoControladoria == "Aprovar com Ressalvas") {
            if (form.getValue("checkRegime") != "sim" || 
                form.getValue("checkDctf") != "sim" || 
                form.getValue("checkLei9249") != "sim") {
                msgErro += "- Para aprovar a proposta, todos os itens do Checklist Fiscal devem estar marcados.<br>";
            }
        }

        if (decisaoControladoria == "Rejeitar" || decisaoControladoria == "Aprovar com Ressalvas") {
            if (form.getValue("parecerControladoria") == null || form.getValue("parecerControladoria") == "") {
                msgErro += "- O Parecer da Controladoria é obrigatório ao Rejeitar ou Aprovar com Ressalvas.<br>";
            }
        }
    }

    // Validações da Etapa de Solicitação de Ata
    else if (atividadeAtual == ATIVIDADES.SOLICITACAO_ATA) {
        if (form.getValue("dataAta") == "") {
            msgErro += "- A 'Data da Ata' é obrigatória.<br>";
        }
        if (form.getValue("localAta") == "") {
            msgErro += "- O 'Local' da Ata é obrigatório.<br>";
        }
        if (form.getValue("horarioAta") == "") {
            msgErro += "- O 'Horário' da Ata é obrigatório.<br>";
        }
        if (form.getValue("periodoReferenciaAta") == "") {
            msgErro += "- O 'Período de Referência' é obrigatório.<br>";
        }
        if (form.getValue("resultadoLiquido") == "") {
            msgErro += "- O 'Resultado Líquido do Exercício' é obrigatório.<br>";
        }
        if (form.getValue("totalDisponivel") == "") {
            msgErro += "- O 'Total Disponível para Distribuição' é obrigatório.<br>";
        }
        if (form.getValue("assinaturaRepresentante") != "sim") {
            msgErro += "- É obrigatório marcar a assinatura do Representante Legal.<br>";
        }
        if (form.getValue("justificativaAta") == null || form.getValue("justificativaAta") == "") {
            msgErro += "- A 'Justificativa da Distribuição e Impacto' é obrigatória.<br>";
        }
    }

    // 3. Verifica se houve algum erro. Se sim, trava o formulário e exibe a mensagem!
    if (msgErro !== "") {
        throw "<br><br><strong>Atenção! Verifique os seguintes campos obrigatórios antes de enviar:</strong><br><br>" + msgErro;
    }
}