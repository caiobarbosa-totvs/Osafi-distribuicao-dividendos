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
        // --- EVENTO 1: Lógica de Exibição do Painel de Ata ---
        // Escuta as mudanças no radio button de "Origem do Lucro"
        $('input[name="origemLucro"]').on('change', function () {
            var origemSelecionada = $(this).val();

            if (origemSelecionada === 'anterior') {
                // Lucro de Exercícios Anteriores: Tratamento de Distribuição Direta (Exige Ata)
                // Revela o Painel de Ata com uma animação suave
                $('#panelAta').slideDown();
            } else if (origemSelecionada === 'corrente') {
                // Lucro Corrente: Tratamento de Antecipação (Ata gerada apenas no fechamento do balanço)
                // Oculta o Painel de Ata
                $('#panelAta').slideUp();
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
        // Pega o valor da atividade atual do campo hidden que o Fluig vai preencher
        var atividade = $("#atividadeAtual").val();
        var stepAtual = 0; // Começa no Início (0)

        // Mapeamento das atividades do Workflow (BPMN) para os steps do HTML
        if (atividade == "0" || atividade == "4" || atividade == "StartEvent_1" || atividade == "Task_PlanFin") {
            stepAtual = 1; // Step 1: Planejamento Financeiro / Step 2: Sócios

        } else if (atividade == "Task_AprovConselho") {
            stepAtual = 3; // Step 3: Aprovação da Diretoria

        } else if (atividade == "Task_AvalTecnica") {
            stepAtual = 4; // Step 4: Avaliação Técnica - Controladoria

        } else if (atividade == "Task_SolAta" || atividade == "Task_AssinAta") {
            stepAtual = 5; // Step 5: Solicitação e Geração de Ata

        } else if (atividade == "Task_ProgPagamento" || atividade == "Task_ValPagamento" ||
            atividade == "Task_ConcFinan" || atividade == "Task_AnexaComp" ||
            atividade == "Task_ProvFinan" || atividade == "Task_ProgPagRegular") {
            stepAtual = 6; // Step 6: Execução Financeira e Pagamento

        } else if (atividade == "EndEvent_1" || atividade == "EndEvent_Error") {
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

    // Se o zoom disparado for o da tabela de Sócios (Pai x Filho)s
    if (inputId.match(/^nomeSocio___/)) {

        // Extrai o número da linha atual (ex: pega o "1" de "nomeSocio___1")
        var linha = inputId.split("___")[4];

        // Preenche automaticamente os outros campos da MESMA linha
        $("#cpfCnpjSocio___" + linha).val(selectedItem.CPF_CNPJ);
        $("#dadosBancariosSocio___" + linha).val("Banco: " + selectedItem.BANCO + " / Ag: " + selectedItem.AGENCIA + " / CC: " + selectedItem.CONTA);

        // Dispara a máscara para formatar o CPF/CNPJ recém-injetado
        DistDividendos.aplicarMascaras();
    }
}

// Função nativa acionada se o usuário apagar (remover) o item escolhido no Zoom
function removedZoomItem(removedItem) {
    var inputId = removedItem.inputId;

    if (inputId.match(/^nomeSocio___/)) {
        var linha = inputId.split("___")[4];

        // Limpa os campos atrelados caso o usuário remova o sócio
        $("#cpfCnpjSocio___" + linha).val('');
        $("#dadosBancariosSocio___" + linha).val('');
        $("#percSocio___" + linha).val('');
        $("#valorSocio___" + linha).val('');
    }
}
