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

            if (origemSelecionada === 'anterior') {
                // Lucro de Exercícios Anteriores: Exige Ata
                $('#panelAta').slideDown();
            } else if (origemSelecionada === 'corrente') {
                // Lucro Corrente: Oculta o Painel de Ata
                $('#panelAta').slideUp();
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

        // Escuta digitação dinâmica na coluna de "% de Participação" na tabela de Sócios
        $('#tabela_socios').on('blur', "input[id^='percSocio___']", function () {
            DistDividendos.calcularValores();
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
            stepAtual = 1; // Step 1: Planejamento Financeiro / Step 2: Sócios
        } else if (atividade == ATIVIDADES.APROVACAO_CONSELHO) {
            stepAtual = 3; // Step 3: Aprovação da Diretoria
        } else if (atividade == ATIVIDADES.AVALIACAO_TECNICA) {
            stepAtual = 4; // Step 4: Avaliação Técnica - Controladoria
        } else if (atividade == ATIVIDADES.SOLICITACAO_ATA || atividade == ATIVIDADES.ASSINATURA_ATA) {
            stepAtual = 5; // Step 5: Solicitação e Geração de Ata
        } else if (
            // Todas as atividades pertinentes à Execução Financeira (Adicionadas as conciliações faltantes)
            atividade == ATIVIDADES.PROGRAMACAO_PAGAMENTOS ||
            atividade == ATIVIDADES.VALIDACAO_PAGAMENTO ||
            atividade == ATIVIDADES.CONCILIACAO_FINANCEIRA ||
            atividade == ATIVIDADES.ANEXACAO_COMPROVANTE ||
            atividade == ATIVIDADES.PROVISOES_FINANCEIRAS ||
            atividade == ATIVIDADES.PROGRAMACAO_PAGAMENTO_REGULAR ||
            atividade == ATIVIDADES.CONCILIACAO_FINANCEIRA_REGULAR ||
            atividade == ATIVIDADES.CONCILIACAO_CONTABIL
        ) {
            stepAtual = 6; // Step 6: Execução Financeira e Pagamento
        } else if (atividade == ATIVIDADES.FIM || atividade == ATIVIDADES.REJEICAO_FIM) {
            stepAtual = 7; // Step 7: Fim
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

        // Percorre cada input de porcentagem que existe na tabela Pai x Filho
        $("input[id^='percSocio___']").each(function () {
            // Extrai a linha atual (ex: pega o "1" de "percSocio___1")
            var linha = $(this).attr('id').split('___')[4];
            var percentualSocio = self.getFloatValue($(this).val());

            if (percentualSocio > 0 && valorProposto > 0) {
                // Calcula o valor a receber deste sócio e injeta na tela
                var valorReceber = valorProposto * (percentualSocio / 100);
                $("#valorSocio___" + linha).val(self.getMoneyString(valorReceber));

                somaParticipacao += percentualSocio;
            } else {
                $("#valorSocio___" + linha).val('');
            }
        });

        if (somaParticipacao !== 100 && somaParticipacao > 0) {
            $('#alertaParticipacao').show();
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

    // 1. NOVA FUNÇÃO: Filtro em Cascata (Empresa/Filial -> Centro de Custos)
    if (inputId == "empresaFilial") {
        // Ao selecionar a Empresa/Filial, recarrega o zoom de Centro de Custos.
        // ATENÇÃO: Substitua "CODCOLIGADA" pela coluna real que faz o filtro no seu dataset 'ds_rm_centro_custo'
        reloadZoomFilterValues("centroCusto", "CODCOLIGADA," + selectedItem["CODIGO_FILIAL"]);
    }

    // 2. LÓGICA ORIGINAL MANTIDA (Tabela de Rateio Pai x Filho)
    if (inputId.match(/^nomeSocio___/)) {
        // Extrai o número da linha mantendo o seu padrão exato
        var linha = inputId.split("___")[5];

        // 2.1 - CRIAÇÃO DO FILTRO PARA CONSULTA
        // Monta um filtro (Constraint) usando o CPF_CNPJ do sócio que acabou de ser selecionado
        var c1 = DatasetFactory.createConstraint("CPF_CNPJ", selectedItem.CPF_CNPJ, selectedItem.CPF_CNPJ, ConstraintType.MUST);

        // 2.2 - CONSULTA AO BANCO DE DADOS (Dataset)
        var dsBloqueios = DatasetFactory.getDataset("ds_rm_bloqueios_socio", null, [c1], null);

        // 2.3 - VALIDAÇÃO E AÇÃO
        // Verifica se o dataset retornou algo e se a coluna 'STATUS_BLOQUEIO' indica que ele está bloqueado
        if (dsBloqueios != null && dsBloqueios.values != null && dsBloqueios.values.length > 0 && dsBloqueios.values.STATUS_BLOQUEIO == "SIM") {

            // Exibe um alerta nativo e elegante do Fluig na tela
            FLUIGC.toast({
                title: 'Atenção: ',
                message: 'O Sócio selecionado possui pendências ou bloqueios judiciais/fiscais e não pode ser incluído no rateio.',
                type: 'danger',
                timeout: 'slow'
            });

            // Limpa automaticamente o campo Zoom e os dados para impedir a inclusão
            window[inputId].clear();
            $("#cpfCnpjSocio___" + linha).val('');
            $("#dadosBancariosSocio___" + linha).val('');

        } else {
            // Se NÃO houver bloqueio, a lógica original segue preenchendo os campos
            $("#cpfCnpjSocio___" + linha).val(selectedItem.CPF_CNPJ);

            // No seu HTML anterior usava BANCO, AGENCIA e CONTA. Ajuste os nomes caso seu dataset venha diferente.
            var dadosBancarios = "Banco: " + (selectedItem.BANCO || '') + " / Ag: " + (selectedItem.AGENCIA || '') + " / CC: " + (selectedItem.CONTA || '');
            $("#dadosBancariosSocio___" + linha).val(dadosBancarios);

            // Dispara a máscara para formatar os campos
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
        var linha = inputId.split("___")[4];

        // Limpa os campos atrelados caso o usuário remova o sócio
        $("#cpfCnpjSocio___" + linha).val('');
        $("#dadosBancariosSocio___" + linha).val('');
        $("#percSocio___" + linha).val('');
        $("#valorSocio___" + linha).val('');
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
