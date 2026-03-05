function validateForm(form) {
    
    // 1. DEFINIÇÃO DAS CONSTANTES DE ATIVIDADES (Mapeamento do BPMN)
    var INICIO = 0;
    var INICIALIZACAO = 1;
    var PLANEJADOR_FINANCEIRO = 2;
    var APROVACAO_CONSELHO = 4;
    var AVALICAO_TECNICA = 6; // Mantido o seu nome original da constante
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

    var INTEGRACAO_RM_TOTVS = 23;
    var PROGRAMACAO_PAGAMENTOS = 25;
    var VALIDACAO_PAGAMENTO = 27;
    var CONCILIACAO_FINANCEIRA = 32;
    var ANEXACAO_COMPROVANTE = 33;
    var INTEGRACAO_CONTABIL = 43;
    var CONCILICACAO_CONTABIL = 44; // Mantido o seu nome original da constante

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
    else if (atividadeAtual === AVALICAO_TECNICA) {
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

    // ----------------------------------------------------------------------
    // DISPARO DO ALERTA E BLOQUEIO DO FORMULÁRIO
    // ----------------------------------------------------------------------
    if (msgErro !== "") {
        throw "<br><br><strong>Atenção! Verifique os seguintes campos obrigatórios antes de enviar:</strong><br><br>" + msgErro;
    }
}