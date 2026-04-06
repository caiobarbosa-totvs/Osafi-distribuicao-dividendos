function validateForm(form) {

    // 1. DEFINIÇÃO DAS CONSTANTES DE ATIVIDADES (Mapeamento do BPMN)
    var INICIO = 0;
    var INICIALIZACAO = 1;
    var PLANEJADOR_FINANCEIRO = 2;
    var APROVACAO_CONSELHO = 4;
    var AVALIACAO_TECNICA = 6; // Mantido o seu nome original da constante
    var GATEWAY_APROVACAO_1 = 65;
    var REJEICAO_FIM = 19;
    var GATEWAY_DECISAO_2 = 68;
    var SOLICITACAO_ATA = 12;
    var ASSINATURA_ATA = 14;
    var GATEWAY_ASSINATURA_ATA_3 = 72;
    var PROVISOES_FINANCEIRAS = 34;
    var INTEGRACAO_RM_TOTVS_REGULAR = 35;
    var PROGRAMACAO_PAGAMENTO_REGULAR = 36;
    var CONCILIACAO_FINANCEIRA_REGULAR = 37;
    var INTEGRACAO_CONTABIL_REGULAR = 38;
    var GATEWAY_SALDO_EXISTENTE_4 = 76;
    var FIM = 40;

    var INTEGRACAO_RM_TOTVS = 89;
    var PROGRAMACAO_PAGAMENTOS = 25;
    var VALIDACAO_PAGAMENTO = 27;
    var CONCILIACAO_FINANCEIRA = 32;
    var ANEXACAO_COMPROVANTE = 33;
    var INTEGRACAO_CONTABIL = 43;
    var CONCILIACAO_CONTABIL = 44; // Mantido o seu nome original da constante

    // 2. CAPTURA DO ESTADO ATUAL
    // Utilizamos o parseInt para garantir que o WKNumState seja tratado como um número exato para bater com as constantes
    var atividadeAtual = getValue("WKNumState") != null ? parseInt(getValue("WKNumState")) : INICIO;

    // 3. VARIÁVEL ACUMULADORA DE ERROS
    var msgErro = "";

    // ----------------------------------------------------------------------
    // ETAPA 1: PLANEJAMENTO FINANCEIRO
    // ----------------------------------------------------------------------
    if (atividadeAtual === INICIO || atividadeAtual === INICIALIZACAO || atividadeAtual === PLANEJADOR_FINANCEIRO) {

    // 1.1 Validação dos Campos Fixos
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

        // Novas Regras: Natureza Orçamentária e Data da Ata
        if (form.getValue("naturezaOrcamentaria") == "") {
            msgErro += "- A 'Natureza Orçamentária' é obrigatória.<br>";
        }
        if (form.getValue("origemLucro") == "ja_deliberado") {
            if (form.getValue("dataAtaAnterior") == "") {
                msgErro += "- Para lucros já deliberados, a 'Data da Ata Anterior' é obrigatória para verificação de tributação.<br>";
            }
        }

        // =========================================================
        // 1.1.1 VALIDAÇÕES DE TRIBUTAÇÃO (Lei 15.270/2025)
        // =========================================================
        
        // Determine a data da Ata
        var dataAta = form.getValue("dataAta") || form.getValue("dataAtaAnterior") || new Date().toISOString().split('T')[0];
        var anoAta = parseInt(dataAta.split('-')[0]);
        var mesAta = parseInt(dataAta.split('-')[1]);
        
        // Regra de Transição: determina se Lei 15.270/2025 se aplica
        var aplicaLei15270 = (anoAta > 2025) || (anoAta === 2025 && mesAta > 12);
        
        if (aplicaLei15270) {
            // Lei 15.270/2025 está em vigor para Atas de Jan/2026+
            
            // 1. Verificar se há cálculo de IRRF realizado
            var valorIRRF = getFloatValue(form.getValue("valorIRRF"));
            if (valorIRRF === undefined || valorIRRF === null || valorIRRF === 0) {
                msgErro += "- Para Atas emitidas a partir de Janeiro/2026, o cálculo de tributação (Lei 15.270/2025) não foi realizado. Verifique o valor proposto versus o limite de R$ 50.000/mês.<br>";
            }
            
            // 2. Validar que o limite de isenção foi considerado
            var limiteIsento = getFloatValue(form.getValue("limiteIsento"));
            if (limiteIsento === undefined || limiteIsento === null || limiteIsento < 0) {
                msgErro += "- Saldo de isenção (Lei 15.270/2025) não foi calculado. Verifique o acumulado do mês.<br>";
            }
            
            // 3. Validar que valor líquido foi calculado corretamente
            var valorProposto = getFloatValue(form.getValue("valorProposto"));
            var valorLiquidoPagar = getFloatValue(form.getValue("valorLiquidoPagar"));
            if (valorLiquidoPagar === undefined || valorLiquidoPagar === null || valorLiquidoPagar === 0) {
                msgErro += "- Valor Líquido a Pagar não foi calculado. Revise a tributação (Lei 15.270/2025).<br>";
            }
            if (valorLiquidoPagar > valorProposto) {
                msgErro += "- Erro de cálculo: Valor Líquido a Pagar não pode ser maior que o Valor Proposto.<br>";
            }
        } else {
            // Lei 15.270/2025 NÃO está em vigor para Atas até Dez/2025 (Isenção Integral)
            var valorIRRF_Isento = getFloatValue(form.getValue("valorIRRF"));
            if (valorIRRF_Isento > 0) {
                msgErro += "- Atas até Dezembro/2025 são isentas de tributação. O campo de IRRF deve estar zerado. Revise a data da Ata.<br>";
            }
        }

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
                /*if (form.getValue("centroCustoSocio___" + linha) == "") {
                    msgErro += "- O Centro de Custo (Rateio) da linha " + numeroLinhaReal + " é obrigatório.<br>";
                }*/
                if (form.getValue("naturezaOrcamentariaSocio___" + linha) == "") {
                    msgErro += "- A Natureza Orçamentária do sócio na linha " + numeroLinhaReal + " é obrigatória.<br>";
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
    else if (atividadeAtual === APROVACAO_CONSELHO) {
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
    else if (atividadeAtual === AVALIACAO_TECNICA) {
        var decisaoControladoria = form.getValue("decisaoControladoria");
        var origemLucro = form.getValue("origemLucro"); // Lê a origem para saber o que cobrar

        if (decisaoControladoria == null || decisaoControladoria == "") {
            msgErro += "- É obrigatório selecionar a Decisão da Controladoria.<br>";
        }

        if (decisaoControladoria == "Aprovar" || decisaoControladoria == "Aprovar com Ressalvas") {
            
            // 1. VALIDAÇÕES GLOBAIS (Fiscais e Legais obrigatórias para TODOS)
            if (form.getValue("checkRegime") != "sim" || 
                form.getValue("checkDctf") != "sim" || 
                form.getValue("checkLimite50k") != "sim" || 
                form.getValue("checkLei15270") != "sim" || 
                form.getValue("checkEstatuto") != "sim") {
                
                msgErro += "- Para aprovar, todos os 5 itens Fiscais e de Conformidade Legal devem estar marcados como 'sim'.<br>";
            }

            // 2. VALIDAÇÕES ESPECÍFICAS (Contábeis divididas por tipo)
            if (origemLucro == "corrente") {
                // Cenário: ANTECIPAÇÃO DE DIVIDENDOS
                if (form.getValue("checkDRE") != "sim") {
                    msgErro += "- Na Antecipação, a validação do Balancete Intermediário (Grupo Contábil) é obrigatória.<br>";
                }
            } else {
                // Cenário: DISTRIBUIÇÃO E CONSOLIDAÇÃO
                if (form.getValue("checkDRE") != "sim" || 
                    form.getValue("checkReserva") != "sim" || 
                    form.getValue("checkSaldo") != "sim") {
                    
                    msgErro += "- Na Distribuição, a validação do Balanço, Saldos e Reservas de Lucro (Grupo Contábil) são obrigatórias.<br>";
                }
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
    else if (atividadeAtual === SOLICITACAO_ATA) {
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

    // ----------------------------------------------------------------------
    // ETAPA 5: PROGRAMAÇÃO DE PAGAMENTOS (Trilhas de Antecipação e Regular)
    // ----------------------------------------------------------------------
    else if (atividadeAtual === PROGRAMACAO_PAGAMENTOS || atividadeAtual === PROGRAMACAO_PAGAMENTO_REGULAR) {

        var indicesPagamentos = form.getChildrenIndexes("tabela_pagamentos");

        if (indicesPagamentos.length == 0) {
            msgErro += "- É obrigatório adicionar pelo menos uma programação de pagamento na tabela.<br>";
        } else {
            for (var j = 0; j < indicesPagamentos.length; j++) {
                var linhaPag = indicesPagamentos[j];
                var numeroLinhaRealPag = j + 1;

                if (form.getValue("pagDataProgramada___" + linhaPag) == "") {
                    msgErro += "- A 'Data Programada' da linha " + numeroLinhaRealPag + " não foi informada.<br>";
                }
                if (form.getValue("pagStatus___" + linhaPag) == null || form.getValue("pagStatus___" + linhaPag) == "") {
                    msgErro += "- O 'Status' da programação na linha " + numeroLinhaRealPag + " é obrigatório.<br>";
                }
            }
        }
    }
    else if (atividadeAtual === ANEXACAO_COMPROVANTE || atividadeAtual === CONCILIACAO_FINANCEIRA_REGULAR || atividadeAtual === CONCILIACAO_CONTABIL) {

        var indicesPagamentos = form.getChildrenIndexes("tabela_pagamentos");

        for (var k = 0; k < indicesPagamentos.length; k++) {
            var linhaVal = indicesPagamentos[k];
            var numeroVal = k + 1;

            if (form.getValue("pagStatus___" + linhaVal) !== "Liquidado") {
                msgErro += "- Para avançar nas etapas de conciliação, todos os status na linha " + numeroVal + " devem estar como 'Liquidado'.<br>";
            }
            if (form.getValue("pagDataEfetiva___" + linhaVal) == "") {
                msgErro += "- A 'Data Efetiva (Qive)' da linha " + numeroVal + " é obrigatória para comprovação.<br>";
            }
            if (form.getValue("pagProtocolo___" + linhaVal) == "") {
                msgErro += "- O 'Protocolo Bancário' da linha " + numeroVal + " é obrigatório para auditoria.<br>";
            }
        }

        // Validação do Gateway Final
        if (atividadeAtual === CONCILIACAO_CONTABIL) {

            // Exige o Checklist
            if (form.getValue("auditAta") != "sim" || form.getValue("auditValores") != "sim" || form.getValue("auditImpostos") != "sim") {
                msgErro += "- Para encerrar o processo, todos os itens do Checklist de Auditoria devem ser validados.<br>";
            }

            if (form.getValue("decisaoSaldoFinal") == null || form.getValue("decisaoSaldoFinal") == "") {
                msgErro += "- A auditoria exige que seja informada se há Saldo Remanescente para encerrar o processo.<br>";
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