function validateForm(form) {
    // 1. Captura a atividade atual do processo
    var atividadeAtual = getValue("WKNumState") != null ? getValue("WKNumState") : 0;
    atividadeAtual = atividadeAtual.toString();

    // 2. Variável que vai acumular todas as mensagens de erro
    var msgErro = "";

    if (atividadeAtual == 0 || atividadeAtual == 4 || atividadeAtual == "StartEvent_1" || atividadeAtual == "Task_PlanFin") {

        // 1. Validação dos Campos Fixos
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

        // 2. Validação da Tabela Pai x Filho (Distribuição por Sócio)
        var indicesSocios = form.getChildrenIndexes("tabela_socios");

        // Verifica se adicionaram pelo menos uma linha na tabela
        if (indicesSocios.length == 0) {
            msgErro += "- É obrigatório adicionar pelo menos um sócio na Tabela de Rateio.<br>";
        } else {
            // Se tem linha, verifica se preencheram os campos de cada linha
            for (var i = 0; i < indicesSocios.length; i++) {
                var linha = indicesSocios[i];
                var numeroLinhaReal = i + 1; // Apenas para mostrar na mensagem de erro de forma amigável

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
    } else if (atividadeAtual == "Task_AprovConselho") {

        var decisaoDiretoria = form.getValue("decisaoDiretoria");

        // 1. Valida se o Diretor selecionou uma das opções (Aprovar ou Rejeitar)
        if (decisaoDiretoria == null || decisaoDiretoria == "") {
            msgErro += "- É obrigatório selecionar a Decisão da Diretoria (Aprovar ou Rejeitar).<br>";
        }
        // 2. Validação condicional: Se a decisão for "Rejeitar", o motivo é obrigatório
        else if (decisaoDiretoria == "Rejeitar") {
            if (form.getValue("motivoRejeicaoDir") == "") {
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
    } else if (atividadeAtual == "Task_AvalTecnica") {

        var decisaoControladoria = form.getValue("decisaoControladoria");

        // 1. Valida se uma decisão foi tomada
        if (decisaoControladoria == null || decisaoControladoria == "") {
            msgErro += "- É obrigatório selecionar a Decisão da Controladoria.<br>";
        }

        // 2. Checklist Fiscal (Obrigatório se for Aprovar ou Aprovar com Ressalvas)
        if (decisaoControladoria == "Aprovar" || decisaoControladoria == "Aprovar com Ressalvas") {
            if (form.getValue("checkRegime") != "sim" ||
                form.getValue("checkDctf") != "sim" ||
                form.getValue("checkLei9249") != "sim") {
                msgErro += "- Para aprovar a proposta, todos os itens do Checklist Fiscal devem estar marcados.<br>";
            }
        }

        // 3. Parecer obrigatório em caso de Rejeição ou Ressalvas
        if (decisaoControladoria == "Rejeitar" || decisaoControladoria == "Aprovar com Ressalvas") {
            if (form.getValue("parecerControladoria") == null || form.getValue("parecerControladoria") == "") {
                msgErro += "- O Parecer da Controladoria é obrigatório ao Rejeitar ou Aprovar com Ressalvas.<br>";
            }
        }
    }

    // Validações da Etapa de Solicitação de Ata
    else if (atividadeAtual == "Task_SolAta") {
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
        throw "<br><br><strong>Atenção! Verifique os seguintes campos obrigatórios antes de enviar:</strong><br>" + msgErro;
    }
}