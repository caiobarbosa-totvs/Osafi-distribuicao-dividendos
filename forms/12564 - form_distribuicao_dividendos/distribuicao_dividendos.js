// =========================================================
// VARIÁVEIS GLOBAIS DE MEMÓRIA
// =========================================================
window.coligadaGlobal = "";

var ATIVIDADES = {
    INICIO: 0,
    INICIALIZACAO: 1,
    PLANEJAMENTO_FINANCEIRO: 2,
    APROVACAO_CONSELHO: 4,
    AVALIACAO_TECNICA: 6,
    SOLICITACAO_ATA: 12,
    ASSINATURA_ATA: 14,
    REJEICAO_FIM: 19,
    INTEGRACAO_RM_TOTVS: 89,
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

var DistDividendos = {

    // 1. Inicialização (Roda assim que o formulário carrega)
    init: function () {
        this.aplicarMascaras();
        this.bindEventos();
        this.controlarPaineis();
        this.carregarDashboards();
    },

    // 2. Aplicação de Máscaras (Dinheiro, CPF/CNPJ, Percentual)
    aplicarMascaras: function () {
        // Máscara Monetária (R$) - Aplica em todos os inputs com a classe .money
        $('.money').mask('#.##0,00', { reverse: true });

        // Máscara Percentual (%) - Aplica nos inputs com a classe .percent
        $('.percent').mask('##0,00', { reverse: true });

        // Máscara Dinâmica de CPF ou CNPJ
        var cpfCnpjBehavior = function (val) {
            return val.replace(/\D/g, '').length === 11 ? '000.000.000-009' : '00.000.000/0000-00';
        };

        var cpfCnpjOptions = {
            onKeyPress: function (val, e, field, options) {
                field.mask(cpfCnpjBehavior.apply({}, arguments), options);
            }
        };

        // Aplica a máscara dinâmica em todos os campos que começam com o name "cpfCnpjSocio" 
        $('input[name^="cpfCnpjSocio"]').mask(cpfCnpjBehavior, cpfCnpjOptions);
    },

    // 3. Monitoramento de Eventos (Cliques, Mudanças de Valor)
    bindEventos: function () {
        // --- EVENTO 1: Lógica de Exibição do Painel de Ata e Limpeza de Zoom ---
        // Escuta as mudanças no radio button de "Origem do Lucro"
        $('input[name="origemLucro"]').on('change', function () {
            var origemSelecionada = $(this).val();

            if (origemSelecionada === 'sem_deliberacao' || origemSelecionada === 'ja_deliberado' || origemSelecionada === 'consolidacao') {
                $('#panelAta').slideDown();
            } else {
                $('#panelAta').slideUp();
            }

            // Revela o campo de Data da Ata apenas se for "Já Deliberado"
            if (origemSelecionada === 'ja_deliberado') {
                $('.col-ja-deliberado').slideDown();
            } else {
                $('.col-ja-deliberado').slideUp();
                $('#dataAtaAnterior').val(''); // Limpa a data se o usuário desistir
                $('#alertaRegraTransicao').removeClass('alert-success alert-warning').addClass('alert-info');
                $('#alertaRegraTransicao').html('Selecione a data da Ata para verificar a regra de tributação.');
            }

            //  Revela colunas financeiras de compensação apenas se for Consolidação
            if (origemSelecionada === 'consolidacao') {
                $('.col-consolidacao').show();
            } else {
                $('.col-consolidacao').hide();
            }


            // Limpa o campo Zoom de Centro de Custos automaticamente
            if (window["centroCusto"]) {
                // Comando nativo do Fluig que "esvazia" o campo Zoom
                window["centroCusto"].clear();
            }

            // Emite um pequeno aviso na tela informando que o campo foi limpo
            FLUIGC.toast({
                title: 'Aviso: ',
                message: 'O Centro de Custos foi limpo devido à mudança na Origem do Lucro. Por favor, selecione-o novamente.',
                type: 'warning',
                timeout: 'fast'
            });

            if (origemSelecionada === 'corrente') {
                // Se Antecipação: Oculta as verificações exclusivas de Balanço final
                $('#checkReserva').closest('.checkbox').hide();
                $('#checkSaldo').closest('.checkbox').hide();

                // Muda o texto mantendo o checkbox seguro na tela
                $('#checkDRE').parent().html('<input type="checkbox" name="checkDRE" id="checkDRE" value="sim"> Validação de Balancete Intermediário anexado');
            } else {
                // Se Distribuição: Mostra todas as verificações
                $('#checkReserva').closest('.checkbox').show();
                $('#checkSaldo').closest('.checkbox').show();

                // Muda o texto mantendo o checkbox seguro na tela
                $('#checkDRE').parent().html('<input type="checkbox" name="checkDRE" id="checkDRE" value="sim"> Validação de DRE e Balanço Patrimonial anexados');
            }
        });

        // --- EVENTO EXTRA: Regra de Transição da Lei 15.270/2025 e Recálculo Tributário ---
        $('#dataAtaAnterior, #dataAta').on('change', function () {
            var dataEscolhida = $(this).val();
            if (dataEscolhida) {
                var ano = parseInt(dataEscolhida.split('-')[0]); // Extrai o Ano (Ex: 2025)
                var mes = parseInt(dataEscolhida.split('-')[1]); // Extrai o Mês

                if (ano <= 2025 || (ano === 2025 && mes <= 12)) {
                    $('#alertaRegraTransicao').removeClass('alert-info alert-warning').addClass('alert-success');
                    $('#alertaRegraTransicao').html('<strong>✓ Isento:</strong> Atas emitidas até Dezembro/2025 são isentas de tributação conforme Lei 15.270/2025.');
                } else {
                    $('#alertaRegraTransicao').removeClass('alert-info alert-success').addClass('alert-warning');
                    $('#alertaRegraTransicao').html('<strong>⚠ Tributado:</strong> Atas emitidas a partir de Janeiro/2026 sofrem tributação de 10% sobre excedente do limite de R$ 50.000/mês conforme Lei 15.270/2025.');
                }

                // 🔥 IMPORTANTÍSSIMO: Trigga o recálculo de toda a tributação
                DistDividendos.calcularValores();
            }
        });

        // --- EVENTO 2: Lógica de Exibição do Motivo de Rejeição ---
        // Escuta as mudanças no radio button de "Decisão da Diretoria"
        $('input[name="decisaoDiretoria"]').on('change', function () {
            var decisaoSelecionada = $(this).val();

            if (decisaoSelecionada === 'Rejeitar') {
                // Se a decisão for "Rejeitar", revela o combo com os motivos de recusa
                $('#divMotivoRejeicao').slideDown();
            } else {
                // Se for "Aprovar", oculta o campo de motivo
                $('#divMotivoRejeicao').slideUp();

                // IMPORTANTE: Limpa o campo caso o diretor tenha preenchido um motivo 
                // e depois mudado de ideia para "Aprovar", evitando lixo na base de dados.
                $('#motivoRejeicaoDir').val('');
            }
        });

        // --- EVENTO 3: Gatilhos de Cálculos Matemáticos ---

        // Quando sair do campo (blur) de Receita Bruta, Base Presumida ou Valor Proposto: recalcula tudo
        $('#receitaBruta, #basePresumida, #valorProposto').on('keyup change blur', function () {
            DistDividendos.calcularValores();
        });

        $('#anoReferencia').on('keyup change blur', function () {
            // Quando o ano mudar, chama a função que vai no banco de dados ler os saldos daquele ano específico
            DistDividendos.carregarDashboards();

            // Opcional: Como o ano mudou, é bom recalcular a tributação também
            DistDividendos.calcularValores();
        });

        // Escuta a digitação dinâmica NAS NOVAS COLUNAS de Percentual na tabela de Sócios em tempo real
        $('#tabela_socios').on('keyup change blur', "input[id^='percCapitalSocio___'], input[id^='percDistSocio___']", function () {
            DistDividendos.calcularValores();
        });

        // --- EVENTO 4: Cálculo da Compensação de Antecipações  ---
        $('#tabela_pagamentos').on('keyup change blur', "input[id^='pagValorAntecipado___']", function () {
            var linha = $(this).attr('id').split('___')[1];

            // Pega o Bruto (vamos supor que você copiou o valor do rateio para cá via integração ou manual)
            var bruto = DistDividendos.getFloatValue($("#pagValorBruto___" + linha).val());
            var antecipado = DistDividendos.getFloatValue($(this).val());

            // A mágica matemática
            var saldoPagar = bruto - antecipado;

            // Preenche o readonly com formatação monetária
            $("#pagSaldoPagar___" + linha).val(DistDividendos.getMoneyString(saldoPagar));
        });


    },

    // 4. Lógica da Timeline e Exibição de Painéis
    controlarPaineis: function () {
        // Pega o valor da atividade atual do campo hidden e converte para número
        var atividadeStr = $("#atividadeAtual").val();
        var atividade = atividadeStr ? parseInt(atividadeStr) : 0;

        var stepAtual = 0; // Começa no Início (0)

        // Mapeamento das atividades do Workflow (BPMN) para os steps do HTML
        if (atividade == ATIVIDADES.INICIO || atividade == ATIVIDADES.INICIALIZACAO || atividade == ATIVIDADES.PLANEJAMENTO_FINANCEIRO) {
            stepAtual = 1;

        } else if (atividade == ATIVIDADES.AVALIACAO_TECNICA) {
            stepAtual = 3; // Controladoria agora é o passo 3

            // Abre o formulário já focando automaticamente na aba da Controladoria
            $('a[href="#tab_controladoria"]').tab('show');

        } else if (atividade == ATIVIDADES.APROVACAO_CONSELHO) {
            stepAtual = 4; // Diretoria agora é o passo 4
            $('a[href="#tab_diretoria"]').tab('show');

        } else if (atividade == ATIVIDADES.SOLICITACAO_ATA || atividade == ATIVIDADES.ASSINATURA_ATA) {
            stepAtual = 5;
            $('a[href="#tab_controladoria"]').parent().show();

            // Força a exibição do Painel da Ata
            $('#panelAta').show();

            // Esconde completamente a aba Financeira de quem faz a Ata
            $('a[href="#tab_financeiro"]').parent().hide();

        } else if (
            // Todas as atividades pertinentes à Execução Financeira
            atividade == ATIVIDADES.PROGRAMACAO_PAGAMENTOS ||
            atividade == ATIVIDADES.VALIDACAO_PAGAMENTO ||
            atividade == ATIVIDADES.CONCILIACAO_FINANCEIRA ||
            atividade == ATIVIDADES.ANEXACAO_COMPROVANTE ||
            atividade == ATIVIDADES.PROVISOES_FINANCEIRAS ||
            atividade == ATIVIDADES.PROGRAMACAO_PAGAMENTO_REGULAR ||
            atividade == ATIVIDADES.CONCILIACAO_FINANCEIRA_REGULAR ||
            atividade == ATIVIDADES.CONCILIACAO_CONTABIL
        ) {
            stepAtual = 6;
            $('a[href="#tab_controladoria"]').parent().show();
            $('#panelAta').show(); // Mantém a Ata visível para o financeiro consultar

            // Revela e Foca na aba Financeira
            $('a[href="#tab_financeiro"]').parent().show();
            $('a[href="#tab_financeiro"]').tab('show');

        } else if (atividade == ATIVIDADES.FIM || atividade == ATIVIDADES.REJEICAO_FIM) {
            stepAtual = 7;
            $('#panelAta').show();
        }

        if (atividade == ATIVIDADES.CONCILIACAO_CONTABIL) {
            $('#divEncerramentoContabil').show();
        }

        // Oculta botão e lixeira de SÓCIOS se não for o Planejamento Inicial
        if (atividade != ATIVIDADES.INICIO && atividade != ATIVIDADES.INICIALIZACAO && atividade != ATIVIDADES.PLANEJAMENTO_FINANCEIRO) {
            $('button[onclick="wdkAddChild(\'tabela_socios\')"]').hide();
            $("<style type='text/css'> #tabela_socios .fluigicon-trash { display: none !important; cursor: default; } </style>").appendTo("head");
        }



        // Oculta botão e lixeira de PAGAMENTOS se a etapa NÃO PERTENCER ao Financeiro
        var etapasFinanceiro = [
            ATIVIDADES.PROGRAMACAO_PAGAMENTOS, ATIVIDADES.VALIDACAO_PAGAMENTO, ATIVIDADES.CONCILIACAO_FINANCEIRA,
            ATIVIDADES.ANEXACAO_COMPROVANTE, ATIVIDADES.PROVISOES_FINANCEIRAS, ATIVIDADES.PROGRAMACAO_PAGAMENTO_REGULAR,
            ATIVIDADES.CONCILIACAO_FINANCEIRA_REGULAR, ATIVIDADES.CONCILIACAO_CONTABIL
        ];

        // Se a etapa atual não estiver dentro do array do Financeiro, oculta as ações da tabela deles
        if (etapasFinanceiro.indexOf(atividade) === -1) {
            $('button[onclick="wdkAddChild(\'tabela_pagamentos\')"]').hide();
            $("<style type='text/css'> #tabela_pagamentos .fluigicon-trash { display: none !important; cursor: default; } </style>").appendTo("head");
        }

        // Acende a barra de progresso com base no step identificado
        this.atualizarTimeline(stepAtual);


    },

    // Função auxiliar para manipular o CSS da barra de progresso
    atualizarTimeline: function (stepAtual) {
        // Primeiro, removemos a classe 'active' de todos os steps para "zerar" a barra
        $('.barraProgresso-step').removeClass('active');

        // Depois, percorremos todos os steps do HTML
        $('.barraProgresso-step').each(function () {
            // Lemos o atributo 'data-step' que colocamos no HTML (ex: data-step="3")
            var stepThis = parseInt($(this).attr('data-step'));

            // Se o step for menor ou igual ao step atual da solicitação, nós acendemos ele
            if (stepThis <= stepAtual) {
                $(this).addClass('active');
            }
        });
    },

    // Converte de '1.500,00' (String) para 1500.00 (Float)
    getFloatValue: function (valorString) {
        if (!valorString) return 0;
        // Remove os pontos de milhar e troca a vírgula decimal por ponto
        var valorLimpo = valorString.toString().replace(/\./g, '').replace(',', '.');
        return parseFloat(valorLimpo) || 0;
    },

    // Converte de 1500.00 (Float) para '1.500,00' (String)
    getMoneyString: function (valorFloat) {
        if (!valorFloat) return '0,00';
        return valorFloat.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    // 5. Cálculos Matemáticos (Lei 15.270/2025 - Limite Isento, Tributação, Rateio)
    calcularValores: function () {
        var self = this;

        // =========================================================
        // 0. DETERMINAÇÃO DA FILIAÇÃO À LEI 15.270/2025
        // Data da Ata = Critério para aplicação de tributação
        // =========================================================
        var dataAta = $('#dataAta').val() || $('#dataAtaAnterior').val() || new Date().toISOString().split('T')[0];
        var anoAta = parseInt(dataAta.split('-')[0]);
        var mesAta = parseInt(dataAta.split('-')[1]);

        // REGRA DE TRANSIÇÃO:
        // Atas emitidas até Dezembro/2025 = ISENTAS
        // Atas emitidas a partir de Janeiro/2026 = TRIBUTADAS
        var aplicaLei15270 = (anoAta > 2025) || (anoAta === 2025 && mesAta > 12) ? true : false;

        console.log("[LEI 15.270/2025] Data Ata: " + dataAta + " | Aplica Lei: " + aplicaLei15270);

        // =========================================================
        // 1. CÁLCULO DO LIMITE DE DISTRIBUIÇÃO (Regra Contábil)
        // Fórmula: Receita Bruta × Base Presumida - (IRPJ + CSLL + PIS + COFINS)
        // =========================================================
        var receitaBruta = self.getFloatValue($('#receitaBruta').val());
        var percBase = self.getFloatValue($('#basePresumida').val());
        var valorProposto = self.getFloatValue($('#valorProposto').val());
        var regime = $('#regimeTributario').val();

        var limiteDistribuicao = 0;

        // Se for Lucro Presumido, o motor matemático entra em ação
        if (regime === "Lucro Presumido" && receitaBruta > 0 && percBase > 0) {
            var baseCalculo = receitaBruta * (percBase / 100);

            // Dedução de Impostos (Fórmula Completa da Lei 15.270/2025)
            var irpj = baseCalculo * 0.15; // 15% sobre a base (Lucro Presumido padrão)
            var csll = baseCalculo * 0.09; // 9% sobre a base (Lucro Presumido padrão)
            var pis = receitaBruta * 0.0065; // 0,65% sobre receita bruta
            var cofins = receitaBruta * 0.03; // 3% sobre receita bruta

            var totalImpostos = irpj + csll + pis + cofins;
            limiteDistribuicao = baseCalculo - totalImpostos;

            console.log("[LIMITE DISTRIBUIÇÃO] Base: " + baseCalculo.toFixed(2) + " | Impostos: " + totalImpostos.toFixed(2) + " | Limite: " + limiteDistribuicao.toFixed(2));
        } else if (regime === "RET" && receitaBruta > 0) {
            var ret = receitaBruta * 0.03; // 3% sobre a receita
            limiteDistribuicao = receitaBruta - ret;
        }

        // ALERTA 1: Valor Proposto excede o Limite Contábil?
        if (limiteDistribuicao > 0 && valorProposto > limiteDistribuicao) {
            $('#alertaLimite').html('<strong>⚠ Valor excede o Limite Permitido (R$ ' + self.getMoneyString(limiteDistribuicao) + ')</strong>');
            $('#alertaLimite').show();
        } else if (limiteDistribuicao > 0) {
            $('#alertaLimite').hide();
        }

        // =========================================================
        // 2. CÁLCULO DE ISENÇÃO E TRIBUTAÇÃO (Lei 15.270/2025)
        // Limite: R$ 50.000,00/mês
        // Tributação: 10% sobre excedente
        // =========================================================

        // Limite de Isenção Mensal (Fixo)
        var limiteIsentoMensal = 50000.00;

        // Captura valor proposto (já validado acima)
        var acumuladoAno = self.getFloatValue($('#dashSaldoAntecipacao').val());

        // Calcula saldo de isenção disponível no ano
        var saldoIsencaoRestante = limiteIsentoMensal - acumuladoAno;
        if (saldoIsencaoRestante < 0) saldoIsencaoRestante = 0; // Teto já esgotado

        if ($('#limiteIsento').length) {
            $('#limiteIsento').val(self.getMoneyString(saldoIsencaoRestante));
        }

        // =========================================================
        // 3. APLICAÇÃO DA REGRA TRIBUTÁRIA
        // =========================================================
        var valorExcedente = 0;
        var valorIRRF = 0;
        var valorLiquidoPagar = valorProposto;
        var statusTributacao = "ISENTO";

        // SÓ TRIBUTA se a Lei 15.270/2025 está em vigor (atas de Jan/2026+)
        if (aplicaLei15270 && valorProposto > 0) {

            // Primeira Camada: Valor Proposto vs. Saldo de Isenção Mensal
            if (valorProposto <= saldoIsencaoRestante) {
                // Tudo isento
                valorExcedente = 0;
                valorIRRF = 0;
                valorLiquidoPagar = valorProposto;
                statusTributacao = "ISENTO (dentro do limite mensal)";
            } else {
                // Parte entra no limite isento, parte é tributada
                var parteIsenta = saldoIsencaoRestante;
                valorExcedente = valorProposto - saldoIsencaoRestante;
                valorIRRF = valorExcedente * 0.10; // Alíquota de 10% conforme Lei
                valorLiquidoPagar = parteIsenta + (valorExcedente - valorIRRF);
                statusTributacao = "TRIBUTADO (excedente de R$ " + valorExcedente.toFixed(2) + ")";
            }

            console.log("[TRIBUTAÇÃO] Status: " + statusTributacao + " | IRRF: R$ " + valorIRRF.toFixed(2));
        } else if (!aplicaLei15270 && valorProposto > 0) {
            // Lei não está em vigor (atas até Dez/2025)
            valorExcedente = 0;
            valorIRRF = 0;
            valorLiquidoPagar = valorProposto;
            statusTributacao = "ISENTO (Lei 15.270/2025 não aplicável para Atas até Dez/2025)";
            console.log("[TRIBUTAÇÃO] Ata anterior a Lei 15.270/2025 - " + statusTributacao);
        }

        // Injeta os valores calculados na tela
        $('#valorExcedente').val(self.getMoneyString(valorExcedente));
        $('#valorIRRF').val(self.getMoneyString(valorIRRF));
        $('#valorLiquidoPagar').val(self.getMoneyString(valorLiquidoPagar));

        // Mostra/Oculta alerta de tributação
        if (valorIRRF > 0) {
            $('#alertaTributacao').show().html('<strong>⚠ Tributação Aplicada:</strong> ' + statusTributacao);
        } else {
            $('#alertaTributacao').html('<strong>✓ Isento:</strong> ' + statusTributacao).show();
        }

        // =========================================================
        // 4. RATEIO ENTRE SÓCIOS (Distribuição Proporcional ou Desproporcional)
        // =========================================================
        var somaParticipacao = 0;
        var valorTotalRateado = 0;

        $("input[id^='percDistSocio___']").each(function () {
            var linha = $(this).attr('id').split('___')[1];

            var percDist = self.getFloatValue($("#percDistSocio___" + linha).val());
            var percCap = self.getFloatValue($("#percCapitalSocio___" + linha).val());

            // Lógica de Fallback: Se preencheu % de Distribuição, usa ele. Se não, usa o % de Capital.
            var percentualBase = (percDist > 0) ? percDist : percCap;

            if (percentualBase > 0 && valorProposto > 0) {
                // Calcula o valor a receber deste sócio (sobre o líquido, após tributação)
                var valorReceber = valorLiquidoPagar * (percentualBase / 100);
                $("#valorSocio___" + linha).val(self.getMoneyString(valorReceber));

                // Se há tributação, injeta também os campos de IRRF e Líquido por sócio (se existirem)
                if (valorIRRF > 0) {
                    var irrfSocio = valorIRRF * (percentualBase / 100);
                    if ($("#valorIRRF_Socio___" + linha).length) {
                        $("#valorIRRF_Socio___" + linha).val(self.getMoneyString(irrfSocio));
                    }
                }

                somaParticipacao += percentualBase;
                valorTotalRateado += valorReceber;
            } else {
                $("#valorSocio___" + linha).val('0,00');
            }
        });

        console.log("[RATEIO] Soma de Participação: " + somaParticipacao.toFixed(2) + "% | Total Rateado: R$ " + valorTotalRateado.toFixed(2));

        // Validação visual de fechamento dos 100%
        if (somaParticipacao !== 100 && somaParticipacao > 0) {
            $('#alertaParticipacao').show().html('<strong>⚠ Soma de Participação: ' + somaParticipacao.toFixed(2) + '% (Deve ser 100%)</strong>');
        } else {
            $('#alertaParticipacao').hide();
        }

        // =========================================================
        // 5. INJEÇÃO DE METADADOS PARA AUDITORIA E WORKFLOW
        // =========================================================
        $('#statusTributacao').val(statusTributacao);
        $('#dataAtaCalculo').val(dataAta);
        $('#aplicaLei15270').val(aplicaLei15270 ? 'SIM' : 'NAO');
    },

    // 6. Dashboards Globais (Consultas Analíticas via DatasetFactory)
    carregarDashboards: function () {
        var self = this; // Para manter o contexto dentro dos callbacks
        console.log("[DEBUG DASHBOARD] Iniciando carga de dashboards analíticos...");

        try {
            // =========================================================
            // Solicitações "Em Andamento"
            // Lemos o dataset interno do Fluig (workflowProcess)
            // =========================================================
            var c1 = DatasetFactory.createConstraint("processId", "Distribuicao_Dividendos", "Distribuicao_Dividendos", ConstraintType.MUST);
            var c2 = DatasetFactory.createConstraint("active", "true", "true", ConstraintType.MUST);
            var dsWorkflow = DatasetFactory.getDataset("workflowProcess", null, new Array(c1, c2), null);

            var qtdAndamento = (dsWorkflow != null && dsWorkflow.values != null) ? dsWorkflow.values.length : 0;
            $("#dashSolicitacoesAndamento").val(qtdAndamento);

            // =========================================================
            // Posições Financeiras (Saldos)
            // Lemos o histórico do dataset do próprio formulário
            // =========================================================
            // Nota: O nome do dataset geralmente é o mesmo ID do Processo/Formulário
            var dsForm = DatasetFactory.getDataset("Distribuicao_Dividendos", null, null, null);

            var anoAtualFormulario = $("#anoReferencia").val();

            var saldoAntecipacao = 0;
            var dividendosPagos = 0;
            var dividendosAPagar = 0;

            if (dsForm != null && dsForm.values != null && dsForm.values.length > 0) {
                for (var i = 0; i < dsForm.values.length; i++) {
                    var registro = dsForm.values[i];
                    var anoRegistro = registro["anoReferencia"] || "";
                    // Captura o valor financeiro daquela solicitação no banco
                    var valorTotal = self.getFloatValue(registro["valorProposto"]);

                    // Captura o status e a origem para aplicar a regra de negócio da Engenharia
                    var status = registro["statusIntegracaoRM"] || "";
                    var origem = registro["origemLucro"] || "";

                    if (anoRegistro === anoAtualFormulario) {
                        var valorTotal = self.getFloatValue(registro["valorProposto"]);
                        var status = registro["statusIntegracaoRM"] || "";
                        var origem = registro["origemLucro"] || "";

                        // REGRA 1: Antecipação (Lucro Corrente já integrado, mas que ainda não virou Ata final de Dezembro)
                        if (origem === "corrente" && status === "INTEGRADO_SUCESSO") {
                            saldoAntecipacao += valorTotal;
                        }
                        // REGRA 2: Dividendos Pagos (O Fluxo Financeiro já liquidou tudo)
                        else if (status === "PAGAMENTO_CONCLUIDO") {
                            dividendosPagos += valorTotal;
                        }
                        // REGRA 3: Dividendos a Pagar (Ata assinada e provisionada, mas o banco ainda não pagou)
                        else if (status === "INTEGRADO_SUCESSO" && origem !== "corrente") {
                            dividendosAPagar += valorTotal;
                        }
                    }
                }
            }

            // Injeta os totais formatados na nossa "Vitrine" (HTML)
            $("#dashSaldoAntecipacao").val(self.getMoneyString(saldoAntecipacao));
            $("#dashDividendosPagos").val(self.getMoneyString(dividendosPagos));
            $("#dashDividendosPagar").val(self.getMoneyString(dividendosAPagar));

            console.log("[DASHBOARD] Totais carregados e calculados com sucesso!");

        } catch (e) {
            console.error("[DASHBOARD] Falha ao consultar Datasets do Servidor: ", e);
        }
    }
};

// Dispara a inicialização quando o documento HTML estiver 100% carregado
$(document).ready(function () {
    DistDividendos.init();
});

// Função disparada automaticamente pelo Fluig sempre que uma nova linha é adicionada
function fnWdkAddChild(tableName) {
    if (tableName === "tabela_socios") {
        DistDividendos.aplicarMascaras();
        console.log("Bateu aqui Tabela Sócio");

        if (window["empresaFilial"]) {
            console.log("Bateu aqui objEmpresa");
            var objEmpresa = window["empresaFilial"].getSelectedItems();

            if (objEmpresa !== null && objEmpresa.length > 0) {
                console.log("Bateu aqui Objeto inteiro");
                // Adicionado o índice  para acessar o objeto dentro do Array
                var codColigada = objEmpresa.CODCOLIGADA;

                var inputsCentroCusto = $("input[id^='centroCustoSocio___']");
                var idNovaLinha = inputsCentroCusto.last().attr('id');

                // Injeta a 'senha' (Coligada)
                reloadZoomFilterValues(idNovaLinha, "CODCOLIGADA," + codColigada);
            }
        }
    }
}

// Função nativa acionada automaticamente quando o usuário escolhe um item no Zoom
function setSelectedZoomItem(selectedItem) {
    var inputId = selectedItem.inputId;

    console.log("[DEBUG ZOOM] O campo " + inputId + " foi selecionado!");
    console.log("[DEBUG ZOOM] Pacote de dados recebido: ", selectedItem);

    // 1. Filtro em Cascata (Empresa/Filial -> Centros de Custo)
    if (inputId == "empresaFilial") {
        // SALVA NA MEMÓRIA GLOBAL O CÓDIGO DA COLIGADA
        window.coligadaGlobal = selectedItem.CODCOLIGADA;

        // 1.1 Atualiza o Centro de Custo Global
        reloadZoomFilterValues("centroCusto", "CODCOLIGADA," + selectedItem.CODCOLIGADA);

        // 1.2 Atualiza TODOS os Centros de Custo que já existem na Tabela de Rateio
        $("input[id^='centroCustoSocio___']").each(function () {
            var idLinha = $(this).attr('id');
            reloadZoomFilterValues(idLinha, "CODCOLIGADA," + selectedItem.CODCOLIGADA);
        });
    }

    /*if (inputId == "nomeSocio") {
        // Ao selecionar a Empresa/Filial, recarrega o zoom de Centro de Custos.
        reloadZoomFilterValues("centroCusto", "CODCOLIGADA," + selectedItem.CODCOLIGADA);
    }*/

    // 2. LÓGICA ORIGINAL MANTIDA (Tabela de Rateio Pai x Filho)
    if (inputId.match(/^nomeSocio___/)) {
        var linha = inputId.split("___")[1];

        // 2.1 Validação de Compliance (Lê diretamente da memória do Dataset unificado)
        if (selectedItem.STATUS_BLOQUEIO == "SIM") {
            FLUIGC.toast({
                title: 'Atenção: ',
                message: 'O Sócio selecionado possui pendências judiciais/fiscais e não pode ser incluído.',
                type: 'danger',
                timeout: 'slow'
            });

            // Limpa o zoom imediatamente
            window[inputId].clear();

        } else {
            // 2.2 Autopreenchimento Seguro (Injeta os dados separados)
            $("#cpfCnpjSocio___" + linha).val(selectedItem.CNPJ || '');
            $("#bancoSocio___" + linha).val(selectedItem.BANCO || '');
            $("#agenciaSocio___" + linha).val(selectedItem.AGENCIA || '');
            $("#contaSocio___" + linha).val(selectedItem.CONTA_CORRENTE || '');

            // 2.3 Motor de Detecção de Coligadas (Integração Sincronizada)
            var cnpjLimpo = selectedItem.CNPJ.replace(/\D/g, ''); // Remove máscara

            // Cria um filtro para perguntar ao RM se esse CNPJ é de uma coligada
            var c1 = DatasetFactory.createConstraint('CNPJ', cnpjLimpo, cnpjLimpo, ConstraintType.MUST);
            var dsColigada = DatasetFactory.getDataset('ds_dividendos_rm_filial', null, new Array(c1), null);

            // Se o dataset retornar alguma linha, é uma coligada!
            if (dsColigada != null && dsColigada.values != null && dsColigada.values.length > 0) {
                $("#flagColigada___" + linha).val("SIM");
                $("#alertaColigada___" + linha).show();
            } else {
                $("#flagColigada___" + linha).val("NAO");
                $("#alertaColigada___" + linha).hide();
            }

            // Dispara a máscara dinâmica (formata CPF/CNPJ e dados instantaneamente)
            if (typeof DistDividendos !== "undefined" && typeof DistDividendos.aplicarMascaras === "function") {
                DistDividendos.aplicarMascaras();
            }
        }
    }
}

// Função nativa acionada se o usuário apagar (remover) o item escolhido no Zoom
function removedZoomItem(removedItem) {
    var inputId = removedItem.inputId;

    // 1. Limpeza em Cascata
    if (inputId == "empresaFilial") {
        // Apaga a memória
        window.coligadaGlobal = "";

        // Limpa o Global
        reloadZoomFilterValues("centroCusto", "CODCOLIGADA,");

        // Limpa os Centros de Custo de todas as linhas da tabela
        $("input[id^='centroCustoSocio___']").each(function () {
            var idLinha = $(this).attr('id');
            reloadZoomFilterValues(idLinha, "CODCOLIGADA,");
        });
    }

    // 2. LÓGICA ORIGINAL MANTIDA
    if (inputId.match(/^nomeSocio___/)) {
        var linha = inputId.split("___")[1];

        // Limpa os campos de texto convencionais
        $("#cpfCnpjSocio___" + linha).val('');
        $("#bancoSocio___" + linha).val('');
        $("#agenciaSocio___" + linha).val('');
        $("#contaSocio___" + linha).val('');
        $("#percCapitalSocio___" + linha).val('');
        $("#percDistSocio___" + linha).val('');
        $("#valorSocio___" + linha).val('');

        // Limpa o Zoom de Centro de Custo daquela linha, se existir
        if (window["centroCustoSocio___" + linha]) {
            window["centroCustoSocio___" + linha].clear();
        }

        // Força o recálculo matemático, pois o sócio foi apagado
        if (typeof DistDividendos !== "undefined" && typeof DistDividendos.calcularValores === "function") {
            DistDividendos.calcularValores();
        }
    }
}

// Função auxiliar importada do script modelo para limpar ou setar valor em zooms via código
function setZoomData(instance, value) {
    if (window[instance]) {
        window[instance].setValue(value);
    }
}

/* function limparLinhaSocio(elementoClicado) {
    // Descobre o número da linha a partir do botão clicado
    var linha = $(elementoClicado).closest('tr').find('input[id^="nomeSocio___"]').attr('id').split('___')[1];
    
    // 1. Limpa o campo ZOOM do sócio programaticamente
    if (window["nomeSocio___" + linha]) {
        window["nomeSocio___" + linha].clear(); 
    }
    
    // 2. Limpa os campos de texto convencionais atrelados a ele
    $("#cpfCnpjSocio___" + linha).val('');
    $("#dadosBancariosSocio___" + linha).val('');
    $("#percSocio___" + linha).val('');
    $("#valorSocio___" + linha).val('');
    
    // 3. Dispara o recálculo financeiro (já que a porcentagem foi apagada)
    DistDividendos.calcularValores();
} */

// ==========================================================================
// MOTOR DE GERAÇÃO DE PDF (Missão 3 e 4)
// ==========================================================================

function gerarAtaPDF() {
    console.log("[FÁBRICA PDF] Iniciando coleta de dados do formulário...");

    // 1. Extração Segura de Dados (Lendo o HTML via jQuery)
    // Criamos o objeto 'dadosAta' para organizar as informações (Clean Code)
    var dadosAta = {
        empresa: $('#empresaFilial').val() || "Empresa Não Informada", // Pega do zoom
        data: $('#dataAta').val(),
        local: $('#localAta').val(),
        horario: $('#horarioAta').val(),
        periodo: $('#periodoReferenciaAta').val(),
        resultado: $('#resultadoLiquido').val(),
        disponivel: $('#totalDisponivel').val(),
        justificativa: $('#justificativaAta').val()
    };

    // 2. Trava de Segurança Sênior (Validação)
    // Se algum campo vital estiver vazio, nós barramos a geração do PDF
    if (!dadosAta.data || !dadosAta.local || !dadosAta.resultado || !dadosAta.justificativa) {
        FLUIGC.toast({
            title: 'Atenção: ',
            message: 'Preencha todos os campos obrigatórios da aba da Ata antes de gerar o PDF.',
            type: 'warning',
            timeout: 'fast'
        });
        return; // O comando 'return' aborta a função aqui e não tenta desenhar o PDF
    }

    console.log("[FÁBRICA PDF] Dados coletados com sucesso: ", dadosAta);

    // 3. Aviso temporário (Removeremos na Missão 4)
    FLUIGC.toast({
        title: 'Leitura Concluída: ',
        message: 'Os dados foram coletados com sucesso! Preparando para desenhar a folha...',
        type: 'success',
        timeout: 'fast'
    });

    // 4. Aqui chamaremos o esqueleto do documento
    desenharEsqueletoPDF(dadosAta);


    // ==========================================================================
    // ESQUELETO DO DOCUMENTO (Fábrica pdfmake)
    // ==========================================================================

    function desenharEsqueletoPDF(dadosAta) {
        console.log("[FÁBRICA PDF] Iniciando o desenho do esqueleto do documento...");

        // 1. Tratamento de Dados (Formatação de Data para o padrão Brasileiro)
        var dataFormatada = dadosAta.data ? dadosAta.data.split('-').reverse().join('/') : "Data não informada";

        // 2. A Estrutura Mestra (Document-definition-object)
        var docDefinition = {
            pageSize: 'A4',

            // CORREÇÃO 1: Margens profissionais [Esquerda, Topo, Direita, Baixo]
            pageMargins: [40, 60, 40, 60],

            // 3. O Conteúdo (A injeção das variáveis no texto legal)
            content: [
                // CABEÇALHO (Ajustado margin-bottom para desgrudar do texto e não invadir o topo)
                { text: 'ATA DE DISTRIBUIÇÃO DE DIVIDENDOS', style: 'header', alignment: 'center', margin: [0, 0, 0, 5] },
                { text: dadosAta.empresa.toUpperCase(), style: 'subheader', alignment: 'center', margin: [0, 0, 0, 25] },

                // TÓPICO 1: PREÂMBULO LEGAL
                { text: '1. DADOS DA REUNIÃO', style: 'topic' },
                { text: 'Aos ' + dataFormatada + ', às ' + dadosAta.horario + ' horas, reuniram-se os representantes e sócios em ' + dadosAta.local + ' para deliberação financeira das contas da empresa.', margin: [0, 0, 0, 15] },

                // TÓPICO 2: DELIBERAÇÕES
                { text: '2. DELIBERAÇÕES E RESULTADOS', style: 'topic' },
                { text: 'A Diretoria apresentou o balanço e a demonstração de resultados do período compreendido entre ' + dadosAta.periodo + '.', margin: [0, 0, 0, 8] },

                // Listas com pequeno recuo à esquerda [10]
                { text: '• Resultado Líquido Apurado: R$ ' + dadosAta.resultado, margin: [10, 0, 0, 3] },
                { text: '• Total Disponível para Distribuição: R$ ' + dadosAta.disponivel, margin: [10, 0, 0, 10] },

                { text: 'Justificativa e Impacto Financeiro: ' + dadosAta.justificativa, margin: [0, 0, 0, 15] },

                // TÓPICO 3: A TABELA DE DISTRIBUIÇÃO
                { text: '3. QUADRO DE DISTRIBUIÇÃO AOS SÓCIOS', style: 'topic' },
                { text: 'Fica aprovada a distribuição do valor supramencionado, em moeda corrente, respeitando as proporções do quadro de rateio.', margin: [0, 0, 0, 15] },

                // ⚠️ AQUI ENTRARÁ A INTELIGÊNCIA DA PRÓXIMA ETAPA
                // Aplicada grande margem superior e inferior para isolar o quadro
                { text: '[A tabela dinâmica de sócios será desenhada aqui na próxima missão...]', color: 'red', italics: true, alignment: 'center', margin: [0, 30, 0, 40] },

                // TÓPICO 4: ENCERRAMENTO E ASSINATURAS
                { text: 'Nada mais havendo a tratar, a reunião foi encerrada, lavrando-se a presente Ata que vai assinada pelos representantes e conformada pela Controladoria.', margin: [0, 0, 0, 50] },
                { text: '__________________________________________________\nRepresentante Legal / Diretoria', alignment: 'center' }
            ],

            // 4. O "CSS" do PDF (Dicionário de Estilos)
            // CORREÇÃO 3: Ajuste fino para os tópicos espaçarem os blocos de forma fluida
            styles: {
                header: { fontSize: 16, bold: true, color: '#333333' },
                subheader: { fontSize: 13, bold: true, color: '#004578' },
                topic: { fontSize: 12, bold: true, color: '#000000', margin: [0, 15, 0, 5] } // Tópicos sempre dão um salto maior no topo
            }
        };

        console.log("[FÁBRICA PDF] Esqueleto montado! Renderizando no navegador...");

        // 5. O Gatilho Final: Gera o PDF e abre em uma nova aba do navegador
        pdfMake.createPdf(docDefinition).open();
    }
}
