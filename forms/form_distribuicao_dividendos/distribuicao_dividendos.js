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

var DistDividendos = {

    // 1. Inicialização (Roda assim que o formulário carrega)
    init: function () {
        this.aplicarMascaras();
        this.bindEventos();
        this.controlarPaineis();
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

            if (origemSelecionada === 'anterior' || origemSelecionada === 'consolidacao') {
            $('#panelAta').slideDown();
        } else {
            $('#panelAta').slideUp();
        }

			// Gap C: Revela colunas financeiras de compensação apenas se for Consolidação
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
        $('#receitaBruta, #basePresumida, #valorProposto').on('blur', function () {
            DistDividendos.calcularValores();
        });

        // Escuta a digitação dinâmica NAS NOVAS COLUNAS de Percentual na tabela de Sócios
        $('#tabela_socios').on('blur', "input[id^='percCapitalSocio___'], input[id^='percDistSocio___']", function () {
            DistDividendos.calcularValores();
        });

         // --- EVENTO 4: Cálculo da Compensação de Antecipações  ---
        $('#tabela_pagamentos').on('blur', "input[id^='pagValorAntecipado___']", function () {
            var linha = $(this).attr('id').split('___')[12];
            
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
            
        } else if (atividade == ATIVIDADES.APROVACAO_CONSELHO) {
            stepAtual = 3; 
            // Esconde a aba da Controladoria, pois o Diretor não interage com ela
            $('a[href="#tab_controladoria"]').parent().hide();
            
        } else if (atividade == ATIVIDADES.AVALIACAO_TECNICA) {
            stepAtual = 4; 
            //  Abre o formulário já focando automaticamente na aba da Controladoria
            $('a[href="#tab_controladoria"]').tab('show');
            
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

    // 5. Cálculos Matemáticos (Limite Isento, Rateio)
    calcularValores: function () {
        var self = this;
        var receitaBruta = self.getFloatValue($('#receitaBruta').val());
        var percBase = self.getFloatValue($('#basePresumida').val());

        if (receitaBruta > 0 && percBase > 0) {
            // Calcula o valor da Base Presumida
            var valorBase = receitaBruta * (percBase / 100);

            // Calcula a estimativa dos impostos federais (Ajuste as alíquotas conforme regra fiscal da empresa)
            var irpj = valorBase * 0.15;
            var csll = valorBase * 0.09;
            var pis = receitaBruta * 0.0065;
            var cofins = receitaBruta * 0.03;

            // O limite isento é a Base Presumida menos os impostos pagos
            var limiteIsento = valorBase - (irpj + csll + pis + cofins);

            // Preenche o campo em tela (somente leitura)
            $('#limiteIsento').val(self.getMoneyString(limiteIsento));
        } else {
            $('#limiteIsento').val('');
        }

        var valorProposto = self.getFloatValue($('#valorProposto').val());
        var limiteCalculado = self.getFloatValue($('#limiteIsento').val());

        if (valorProposto > 0 && limiteCalculado > 0 && valorProposto > limiteCalculado) {
            // Excede Limite Isento (Revela o alerta HTML)
            $('#alertaLimite').show();
        } else {
            $('#alertaLimite').hide();
        }

        var somaParticipacao = 0;

        // O cálculo financeiro agora usa estritamente o Percentual de DISTRIBUIÇÃO
        $("input[id^='percDistSocio___']").each(function () {
            // Extração segura do índice da linha
            var linha = $(this).attr('id').split('___')[1]; 
            var percentualDist = self.getFloatValue($(this).val());

            if (percentualDist > 0 && valorProposto > 0) {
                // Calcula o valor a receber deste sócio e injeta na tela (readonly)
                var valorReceber = valorProposto * (percentualDist / 100);
                $("#valorSocio___" + linha).val(self.getMoneyString(valorReceber));
                
                somaParticipacao += percentualDist;
            } else {
                $("#valorSocio___" + linha).val('');
            }
        });

        // Validação visual de fechamento dos 100%
        if (somaParticipacao !== 100 && somaParticipacao > 0) {
            $('#alertaParticipacao').show(); // Certifique-se de ter essa div de alerta no seu HTML, ou omita.
        } else {
            $('#alertaParticipacao').hide();
        }
    }
};

// Dispara a inicialização quando o documento HTML estiver 100% carregado
$(document).ready(function () {
    DistDividendos.init();
});

// Função disparada automaticamente pelo Fluig sempre que uma nova linha é adicionada no Pai x Filho (wdkAddChild)
function fnWdkAddChild(tableName) {
    if (tableName === "tabela_socios") {
        // Reaplica as máscaras na nova linha criada
        DistDividendos.aplicarMascaras();
    }
}

// Função nativa acionada automaticamente quando o usuário escolhe um item no Zoom
function setSelectedZoomItem(selectedItem) {
    var inputId = selectedItem.inputId;

    // 1. Filtro em Cascata (Empresa/Filial -> Centro de Custos)
    if (inputId == "empresaFilial") {
        // Ao selecionar a Empresa/Filial, recarrega o zoom de Centro de Custos.
        // ATENÇÃO: Substitua "CODCOLIGADA" pela coluna real que faz o filtro no seu dataset 'ds_rm_centro_custo'
        reloadZoomFilterValues("centroCusto", "CODCOLIGADA," + selectedItem.CODCOLIGADA);
    }

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
            $("#cpfCnpjSocio___" + linha).val(selectedItem.CPF_CNPJ || '');
            $("#bancoSocio___" + linha).val(selectedItem.BANCO || '');
            $("#agenciaSocio___" + linha).val(selectedItem.AGENCIA || '');
            $("#contaSocio___" + linha).val(selectedItem.CONTA || '');

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
        // Se a Empresa/Filial for apagada, limpa o filtro do Centro de Custos
        reloadZoomFilterValues("centroCusto", "");
        // Esvazia visualmente qualquer Centro de Custo que já estivesse preenchido
        setZoomData("centroCusto", "");
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
    var linha = $(elementoClicado).closest('tr').find('input[id^="nomeSocio___"]').attr('id').split('___')[3];
    
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
