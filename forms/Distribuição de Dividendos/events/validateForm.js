function validateForm(form) {

    // 1. DEFINIÇÃO DAS CONSTANTES DE ATIVIDADES (Mapeamento do BPMN)
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

    // 2. CAPTURA DO ESTADO ATUAL
    var atividadeAtual = getValue("WKNumState") != null ? parseInt(getValue("WKNumState")) : ATIVIDADES.INICIO;

    // 3. VARIÁVEL ACUMULADORA DE ERROS
    var msgErro = "";

    // ----------------------------------------------------------------------
    // ETAPA 1: PLANEJAMENTO FINANCEIRO
    // ----------------------------------------------------------------------
    if (atividadeAtual === ATIVIDADES.INICIO || atividadeAtual === ATIVIDADES.INICIALIZACAO) {

        // 1.1 Validação dos Campos Fixos
        if (form.getValue("anoReferencia") == "") {
            msgErro += "- O campo 'Ano de Referência' é obrigatório.<br>";
        }
        if (form.getValue("regimeTributario") == "") {
            msgErro += "- A seleção do 'Regime Tributário' é obrigatória.<br>";
        }
        if (form.getValue("formaDistribuicao") == "") {
            msgErro += "- A 'Forma de Distribuição' (Proporcional/Desproporcional) é obrigatória.<br>";
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
        if (form.getValue("origemLucro") == "consolidacao") {
            if (form.getValue("solicitacoesVinculadas") == "") {
                msgErro += "- Para a Consolidação, é obrigatório informar o número das 'Solicitações Vinculadas' (Trilha de Auditoria).<br>";
            }
        }
        if (form.getValue("valorProposto") == "") {
            msgErro += "- O 'Valor Proposto para Distribuição' é obrigatório.<br>";
        }
        if (form.getValue("empresaFilial") == "") {
            msgErro += "- A 'Empresa/Filial' é obrigatória.<br>";
        }
        if (form.getValue("centroCusto") == "") {
            msgErro += "- O 'Centro de Custos' é obrigatório.<br>";
        }



        // 1.2 Validação da Tabela Pai x Filho (Distribuição por Sócio)
        // 1.2 Validação da Tabela Pai x Filho (Distribuição por Sócio) e Bloqueio Matemático
        var indicesSocios = form.getChildrenIndexes("tabela_socios");

        if (indicesSocios.length == 0) {
            msgErro += "- É obrigatório adicionar pelo menos um sócio na Tabela de Rateio.<br>";
        } else {
            // Variáveis para o Muro de Contenção Matemático
            var somaPercentual = 0;
            var somaValores = 0;

            // Pega o valor proposto e já converte para número (float)
            var valorProposto = getFloatValue(form.getValue("valorProposto"));

            for (var i = 0; i < indicesSocios.length; i++) {
                var linha = indicesSocios[i];
                var numeroLinhaReal = i + 1;

                // Validação de Preenchimento Obrigatório das novas colunas
                if (form.getValue("nomeSocio___" + linha) == "") {
                    msgErro += "- O Sócio da linha " + numeroLinhaReal + " não foi informado.<br>";
                }
                if (form.getValue("centroCustoSocio___" + linha) == "") {
                    msgErro += "- O Centro de Custo (Rateio) da linha " + numeroLinhaReal + " é obrigatório.<br>";
                }
                if (form.getValue("percDistSocio___" + linha) == "") {
                    msgErro += "- O Percentual de Distribuição da linha " + numeroLinhaReal + " é obrigatório.<br>";
                }
                if (form.getValue("bancoSocio___" + linha) == "" || form.getValue("agenciaSocio___" + linha) == "" || form.getValue("contaSocio___" + linha) == "") {
                    msgErro += "- Os Dados Bancários (Banco, Agência e Conta) do sócio na linha " + numeroLinhaReal + " são obrigatórios.<br>";
                }

                // Acumula os valores para a prova real (Matemática)
                somaPercentual += getFloatValue(form.getValue("percDistSocio___" + linha));
                somaValores += getFloatValue(form.getValue("valorSocio___" + linha));
            }

            // 1.3 Regra de Negócio (O Muro de Contenção)
            if (somaPercentual.toFixed(2) !== "100.00") {
                msgErro += "- A soma dos Percentuais de Distribuição deve ser exatos 100% (Total Atual: " + somaPercentual.toFixed(2) + "%).<br>";
            }

            if (somaValores.toFixed(2) !== valorProposto.toFixed(2)) {
                msgErro += "- A soma dos Valores a Receber na tabela não bate com o 'Valor Proposto para Distribuição'.<br>";
            }
        }
    }

    // ----------------------------------------------------------------------
    // ETAPA 2: APROVAÇÃO DO CONSELHO / DIRETORIA
    // ----------------------------------------------------------------------
    else if (atividadeAtual === ATIVIDADES.APROVACAO_CONSELHO) {
        var decisaoDiretoria = form.getValue("decisaoDiretoria");

        if (decisaoDiretoria == null || decisaoDiretoria == "") {
            msgErro += "- É obrigatório selecionar a Decisão da Diretoria (Aprovar ou Rejeitar).<br>";
        } else if (decisaoDiretoria == "Rejeitar") {
            if (form.getValue("motivoRejeicaoDir") == null || form.getValue("motivoRejeicaoDir") == "") {
                msgErro += "- Ao rejeitar a proposta, é obrigatório selecionar o Motivo da Rejeição.<br>";
            }
        }
    }

    // ----------------------------------------------------------------------
    // ETAPA 3: AVALIAÇÃO TÉCNICA / CONTROLADORIA
    // ----------------------------------------------------------------------
    else if (atividadeAtual === ATIVIDADES.AVALIACAO_TECNICA) {
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

    // ----------------------------------------------------------------------
    // ETAPA 4: SOLICITAÇÃO E GERAÇÃO DE ATA
    // ----------------------------------------------------------------------
    else if (atividadeAtual === ATIVIDADES.PLANEJAMENTO_SOLICITA_ATA_FLUIG) {
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
        if (form.getValue("lucrosAcumulados") == "") {
            msgErro += "- Os 'Lucros Acumulados Anteriores' são obrigatórios.<br>";
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
        if (form.getValue("statusAssinaturaAta") == "") {
            msgErro += "- O 'Status de Assinatura' (Mock API) deve ser selecionado para avançar.<br>";
        }
    }

    // ----------------------------------------------------------------------
    // ETAPA 5 E 6: EXECUÇÃO FINANCEIRA E AUDITORIA CONTÁBIL
    // ----------------------------------------------------------------------
    // ----------------------------------------------------------------------
    // ETAPA 5 E 6: EXECUÇÃO FINANCEIRA E AUDITORIA CONTÁBIL
    // ----------------------------------------------------------------------
    else {
        // Agrupamento das etapas para facilitar a leitura
        var etapasProgramacao = [
            ATIVIDADES.FINANCEIRO_PROGRAMA_PAGAMENTO_SOLICITADO,
            ATIVIDADES.PLANEJAMENTO_FINANCEIRO_SOLICITA_PROVISAO_PAGAMENTOS
        ];

        var etapasConciliacao = [
            ATIVIDADES.FINANCEIRO_CONCILIA_PAGAMENTO,
            ATIVIDADES.FINANCEIRO_ANEXA_COMPROVANTE_PAGAMENTO_FLUIG,
            ATIVIDADES.CONTABILIDADE_CONCILIA_MOVIMENTACAO
        ];

        // Captura todas as linhas da tabela de pagamentos
        var indicesPagamentos = form.getChildrenIndexes("tabela_pagamentos");

        if (indicesPagamentos.length == 0) {
            msgErro += "- É obrigatório existir pelo menos uma linha na Programação de Pagamentos.<br>";
        } else {

            // 5.1: Etapas de Programação (Exige apenas a Data Programada para o RM)
            if (etapasProgramacao.indexOf(atividadeAtual) > -1) {
                for (var p = 0; p < indicesPagamentos.length; p++) {
                    var linhaProg = indicesPagamentos[p];
                    if (form.getValue("pagDataProgramada___" + linhaProg) == "") {
                        msgErro += "- A 'Data Programada' é obrigatória na linha " + (p + 1) + " de pagamentos.<br>";
                    }
                }
            }

            // 5.2: Etapas de Conciliação e Comprovação (TAREFA 4: Exige Liquidado e Protocolo)
            else if (etapasConciliacao.indexOf(atividadeAtual) > -1) {
                for (var c = 0; c < indicesPagamentos.length; c++) {
                    var linhaConc = indicesPagamentos[c];

                    if (form.getValue("pagStatus___" + linhaConc) !== "Liquidado") {
                        msgErro += "- O pagamento da linha " + (c + 1) + " deve estar com o status 'Liquidado' para avançar na conciliação.<br>";
                    }
                    if (form.getValue("pagDataEfetiva___" + linhaConc) == "") {
                        msgErro += "- A 'Data Efetiva' (Qive/Manual) é obrigatória na linha " + (c + 1) + ".<br>";
                    }
                    if (form.getValue("pagProtocolo___" + linhaConc) == "") {
                        msgErro += "- O 'Protocolo Bancário' é obrigatório na linha " + (c + 1) + ".<br>";
                    }
                }

                // ----------------------------------------------------------------------
                // ETAPA 6: AUDITORIA DE ENCERRAMENTO CONTÁBIL
                // ----------------------------------------------------------------------
                if (atividadeAtual === ATIVIDADES.CONTABILIDADE_CONCILIA_MOVIMENTACAO) {
                    if (form.getValue("auditAta") != "sim" ||
                        form.getValue("auditValores") != "sim" ||
                        form.getValue("auditImpostos") != "sim") {
                        msgErro += "- Todos os itens do 'Checklist de Auditoria de Encerramento' devem ser validados pela Controladoria.<br>";
                    }
                    if (form.getValue("decisaoSaldoFinal") == "") {
                        msgErro += "- É obrigatório informar a decisão sobre o 'Saldo Remanescente'.<br>";
                    }
                }
            }
        }
    }

    // ----------------------------------------------------------------------
    // DISPARO DO ALERTA E BLOQUEIO DO FORMULÁRIO
    // ----------------------------------------------------------------------
    if (msgErro !== "") {
        throw "<br><br><strong>Atenção! Verifique os seguintes campos obrigatórios antes de enviar:</strong><br><br>" + msgErro;
    }
}

// ==========================================================================
// FUNÇÕES AUXILIARES DE BACK-END
// ==========================================================================

// Converte String monetária do formulário ('1.500,50') para Float do Servidor (1500.50)
function getFloatValue(valorString) {
    if (valorString == null || valorString == undefined || valorString == "") {
        return 0;
    }
    // Remove os pontos de milhar e troca a vírgula decimal por ponto
    var valorLimpo = String(valorString).replace(/\./g, '').replace(',', '.');
    return parseFloat(valorLimpo) || 0;
}