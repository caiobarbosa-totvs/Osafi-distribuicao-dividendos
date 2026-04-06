function servicetask89(attempt, message) {
    log.info("###############################################################");
    log.info("#### INICIANDO INTEGRAÇÃO RM - ANTECIPAÇÃO DE DIVIDENDOS...####");
    log.info("###############################################################");

    try {
        // ===================================================================
        // 1. DICIONÁRIO DE INTEGRAÇÃO RM (SINGLE SOURCE OF TRUTH)
        // ===================================================================
        var RM_DATASERVER = "MovMovimentoTBCData"; // DataServer para Movimento de Estoque


        var CONFIG_RM = {
            // Conforme orientação do Raine Archanjo (Aguardando Retorno Base TST)
            PRODUTO_SERVICO: "01.01",

            // --- DISTRIBUIÇÃO ---
            TMV_DISTRIBUICAO_PAGAR: "1.2.70",     // (Tipo Documento 222)
            TMV_DISTRIBUICAO_RECEBER: "2.2.39",   // (Tipo Documento 156)

            // --- ANTECIPAÇÃO / ESTOQUE ---
            TMV_ANTECIPACAO_PAGAR: "1.2.82",
            TMV_ANTECIPACAO_RECEBER: "2.2.82",

            // --- ANTECIPAÇÃO / FINANCEIRO (Eduardo Sousa) ---
            FIN_DOC_ANTECIPACAO_PAGAR: "231",
            FIN_DOC_ANTECIPACAO_RECEBER: "232"
        };

        // Como o script 89 roda para Antecipação, já deixamos a variável mapeada
        var RM_TIPO_MOVIMENTO = CONFIG_RM.TMV_ANTECIPACAO_PAGAR;
        // ===================================================================

        // OBTENÇÃO DOS DADOS DO FORMULÁRIO
        var numeroSolicitacao = getValue("WKNumProces");
        var cardData = hAPI.getCardData(numeroSolicitacao);
        var coligadaForm = cardData.get("empresaFilial");

        log.info("[INFO] Número da Solicitação: " + numeroSolicitacao);
        log.info("[INFO] Coligada Bruta do Campo: " + coligadaForm);

        // VALIDAÇÃO E CONVERSÃO DO CÓDIGO DA COLIGADA
        // O campo "empresaFilial" pode conter um objeto Zoom ou um valor misto
        // Precisamos extrair apenas o código numérico
        var coligadaCode = "";

        if (coligadaForm == null || coligadaForm == "") {
            throw "Campo 'Empresa/Filial' (empresaFilial) não foi preenchido. É obrigatório selecionar uma Coligada.";
        }

        // Converter para string e tentar extrair o código numérico
        var coligadaStr = String(coligadaForm).trim();

        // Se tem um ponto-e-vírgula (formato zoom), pega a primeira parte
        if (coligadaStr.indexOf(";") > -1) {
            coligadaCode = coligadaStr.split(";")[0].trim();
        } else {
            coligadaCode = coligadaStr;
        }

        // Se o valor extraído NÃO é numérico, tentar fazer lookup por nome
        if (isNaN(parseInt(coligadaCode))) {
            log.warn("[WARN] Campo contém nome de empresa, não código. Tentando lookup...");
            coligadaCode = buscarCodigoPorNomeColigada(coligadaStr);

            if (coligadaCode == null) {
                throw "Código da Coligada não encontrado. Valor recebido: '" + coligadaStr + "'. Verifique se a empresa está cadastrada e ativa no RM.";
            }
        }

        coligadaCode = parseInt(coligadaCode);
        log.info("[INFO] Coligada Código Processado: " + coligadaCode);

        // AUTENTICAÇÃO COM RM USANDO FUNÇÃO HELPER
        // A função getWebService() encapsula toda a lógica de autenticação
        var authService = getWebService();

        if (authService == null) {
            throw "Falha ao obter serviço de autenticação. Verifique a configuração RM.";
        }

        log.info("[INFO] Autenticação com TOTVS RM estabelecida com sucesso");

        var contexto = "CODSISTEMA=T;CODCOLIGADA=" + coligadaCode; // 'T' = Sistema de Gestão de Estoques/Compras
        log.info("[INFO] Contexto RM Validado: " + contexto);

        var keys = cardData.keySet().toArray();
        var integrouPeloMenosUm = false;

        for (var i = 0; i < keys.length; i++) {
            var fieldName = keys[i];

            if (fieldName.match(/^nomeSocio___/)) {
                var linha = fieldName.split("___")[1];
                var cpfCnpjSocio = cardData.get("cpfCnpjSocio___" + linha);
                var valorAdiantamento = cardData.get("valorSocio___" + linha);
                // DESCOMENTADO: Captura o centro de custo da tela (obrigatório para o RM)
                var centroCustoRateio = cardData.get("centroCustoSocio___" + linha);
                var dataVencimento = cardData.get("pagDataProgramada___" + linha);
                var naturezaSocio = cardData.get("naturezaOrcamentariaSocio___" + linha);
                var naturezaGlobal = cardData.get("naturezaOrcamentaria");

                // Pega a descrição (da linha ou a global)
                var descNatDinamica = (naturezaSocio != null && naturezaSocio != "") ? naturezaSocio : naturezaGlobal;

                // Transforma o texto (Front-end) no Código (Back-end) para o RM aceitar
                var codNatDinamica = buscarCodigoNaturezaPorDescricao(descNatDinamica, coligadaCode);


                if (dataVencimento == null || dataVencimento == "") {
                    var formatador = new java.text.SimpleDateFormat("yyyy-MM-dd");
                    dataVencimento = formatador.format(new java.util.Date());
                }

                // CONVERSÃO DE VALOR: Converter de Java String para JS String antes de operações
                // Isso evita ambiguidade na escolha de construtores Java ao usar regex JavaScript
                var valorString = String(valorAdiantamento).trim();
                var valorFloat = valorString.replace(/\./g, '').replace(',', '.');
                log.info("Preparando Integração Sócio (Estoque): " + cpfCnpjSocio + " | Valor: R$ " + valorFloat);

                // VALIDAÇÃO PRÉ-INTEGRAÇÃO: Garantir que todos os campos obrigatórios estão preenchidos
                log.info("[PRÉ-CHECK] Validando dados antes da integração RM...");

                // DESCOMENTADO: Trava de segurança para não integrar dados vazios
                if (!cpfCnpjSocio || cpfCnpjSocio == "") {
                    throw "CPF/CNPJ do Sócio não foi preenchido na linha " + linha;
                }
                if (!valorFloat || parseInt(valorFloat) == 0) {
                    throw "Valor do Sócio inválido ou zero na linha " + linha;
                }
                if (!centroCustoRateio || centroCustoRateio == "") {
                    throw "Centro de Custo não foi preenchido na linha " + linha;
                }
                if (!codNatDinamica || codNatDinamica == "") {
                    throw "Natureza Orçamentária não foi preenchida na linha " + linha;
                }

                log.info("[✓] Pré-validação concluída com sucesso para Sócio " + cpfCnpjSocio);
                // DESCOMENTADO: Limpeza da máscara do CPF/CNPJ para o RM aceitar
                var cpfCnpjLimpo = String(cpfCnpjSocio).replace(/\D/g, '');

                var xmlPayload = "<MovMovimento>";
                xmlPayload += "  <TMOV>";
                xmlPayload += "    <CODCOLIGADA>" + coligadaCode + "</CODCOLIGADA>";
                xmlPayload += "    <IDMOV>-1</IDMOV>";
                xmlPayload += "    <CODFILIAL>1</CODFILIAL>"; // Requerido filial
                xmlPayload += "    <CODTMV>" + RM_TIPO_MOVIMENTO + "</CODTMV>";
                // DESCOMENTADO: Tag obrigatória do fornecedor (credencial bancária)
                xmlPayload += "    <CODCFO>" + cpfCnpjLimpo + "</CODCFO>";
                xmlPayload += "    <DATAEMISSAO>" + dataVencimento + "T00:00:00</DATAEMISSAO>";
                xmlPayload += "    <VALORLIQUIDO>" + valorFloat + "</VALORLIQUIDO>";
                // DESCOMENTADO: Tag obrigatória do centro de custo (rateio orçamentário)
                xmlPayload += "    <CODCCUSTO>" + centroCustoRateio.split(" - ")[0].trim() + "</CODCCUSTO>";
                // O Histórico exigido pelo PDF para identificação da transação
                xmlPayload += "    <HISTORICOCURTO>Adiantamento de Dividendos - Fluig " + numeroSolicitacao + "</HISTORICOCURTO>";
                xmlPayload += "  </TMOV>";

                // O RM exige um item de movimento (TITMMOV) para processar o valor total em movimentos tipo XXX
                xmlPayload += "  <TITMMOV>";
                xmlPayload += "    <CODCOLIGADA>" + coligadaCode + "</CODCOLIGADA>";
                xmlPayload += "    <IDMOV>-1</IDMOV>";    // <-- Chave Estrangeira do Movimento
                xmlPayload += "    <IDITMMOV>-1</IDITMMOV>"; // <-- Chave Primária do Item
                xmlPayload += "    <NSEQITMMOV>1</NSEQITMMOV>";

                // CORREÇÃO: Utilizando CODIGOPRD a pedido do Raine Archanjo para integrar todas as coligadas
                xmlPayload += "    <CODIGOPRD>" + CONFIG_RM.PRODUTO_SERVICO + "</CODIGOPRD>";

                xmlPayload += "    <QUANTIDADE>1</QUANTIDADE>";
                xmlPayload += "    <PRECOUNITARIO>" + valorFloat + "</PRECOUNITARIO>";
                xmlPayload += "    <VALORTOTALITEM>" + valorFloat + "</VALORTOTALITEM>";
                xmlPayload += "    <CODNAT>" + codNatDinamica + "</CODNAT>";
                xmlPayload += "  </TITMMOV>";
                xmlPayload += "</MovMovimento>";

                log.info("Payload Gerado (Estoque/Compras): " + xmlPayload);

                // INTEGRAÇÃO COM RM
                log.info("[INTEGRAÇÃO] Enviando movimento de estoque para TOTVS RM...");
                log.info("[INTEGRAÇÃO] DataServer: " + RM_DATASERVER);
                log.info("[INTEGRAÇÃO] Contexto: " + contexto);
                log.info("[INTEGRAÇÃO] Usuário RM: " + "***");  // Não loga senha

                var resultadoRM = authService.saveRecord(RM_DATASERVER, xmlPayload, contexto);
                log.info("Resposta do RM Totvs (Módulo Estoque): " + resultadoRM);

                // VALIDAÇÃO ROBUSTA DO RETORNO USANDO REGEX
                // Formato esperado: 'CodigoDaColigada;IDDoMovimento' ou similar
                var resultString = String(resultadoRM).trim();
                var regexValida = /^\d+;.+$/;  // Padrão: numero;descricao
                var linhas = resultString.split(/\r?\n/);
                var temErro = false;
                var idMovimentoGerado = "";

                for (var k = 0; k < linhas.length; k++) {
                    if (linhas[k].trim() == "") continue;

                    // Se a linha não segue o padrão esperado, é um erro
                    if (!regexValida.test(linhas[k].trim())) {
                        temErro = true;
                        log.error("[ERRO VALIDAÇÃO] Linha inválida do RM: " + linhas[k]);
                        break;
                    } else {
                        // Captura o ID do movimento (primeira ocorrência)
                        if (idMovimentoGerado == "") {
                            idMovimentoGerado = linhas[k].trim();
                        }
                    }
                }

                // TRATAMENTO DO RESULTADO
                if (temErro) {
                    log.error("[ERRO] Validação de formato falhou");
                    log.error("[ERRO] XML Enviado: " + xmlPayload);
                    log.error("[ERRO] Resposta RM: " + resultString);
                    throw "Formato de retorno inválido do TOTVS RM para Sócio " + cpfCnpjSocio + ". Resposta: " + resultString;
                } else if (idMovimentoGerado != "") {
                    // Sucesso: Grava o ID do Movimento Gerado
                    log.info("[SUCESSO] Movimento criado para Sócio " + cpfCnpjSocio + " - ID: " + idMovimentoGerado);
                    hAPI.setCardValue("pagProtocolo___" + linha, "ID MOV RM: " + idMovimentoGerado);
                    integrouPeloMenosUm = true;

                    // =========================================================
                    // INTEGRAÇÃO MÓDULO FINANCEIRO: Criar Provisão
                    // =========================================================
                    log.info("[FINANCEIRO] Iniciando integração de provisão para Sócio " + cpfCnpjSocio);
                    try {
                        var resultadoProvisao = criarProvisaoFinanceira(
                            authService,
                            coligadaCode,
                            cpfCnpjSocio,
                            valorFloat,
                            dataVencimento,
                            numeroSolicitacao,
                            linha
                        );
                        log.info("[✓ FINANCEIRO] Provisão criada com sucesso: " + resultadoProvisao);
                    } catch (erroFinanceiro) {
                        log.error("[✗ FINANCEIRO] Erro ao criar provisão: " + erroFinanceiro);
                        throw erroFinanceiro;
                    }

                    // =========================================================
                    // ⚠️ NOTA ARQUITETÔNICA: Integração Contábil REMOVIDA
                    // =========================================================
                    // Conforme Engenharia de Processos (páginas 3 e 18-19):
                    //
                    // Antecipação integra APENAS com:
                    //   ✓ Gestão de Estoque (TITMMOV)
                    //   ✓ Financeiro (Provisão CP)
                    //
                    // Integração Contábil ocorre APENAS em:
                    //   ✗ NÃO em Antecipação (Erro Crítico 2 - REMOVIDO)
                    //   ✓ Distribuição Direta (ETAPA 3)
                    //   ✓ Ata de Consolidação (ETAPA 4.4)
                    //
                    // PROBLEMA EVITADO:
                    // Sem essa remoção = partidas dobradas + manutenção duplicada
                    // = corrupção contábil + auditoria defeituosa + balanço inconsistente
                    // =========================================================

                } else {
                    log.error("[ERRO] Resposta do RM vazia ou sem formato esperado");
                    log.error("[ERRO] Resposta Bruta: " + resultString);
                    throw "Resposta do RM sem conteúdo válido para Sócio " + cpfCnpjSocio + ". Resposta: " + resultString;
                }
            }
        }

        // FINALIZAÇÃO DA INTEGRAÇÃO
        if (integrouPeloMenosUm) {
            hAPI.setCardValue("statusIntegracaoRM", "INTEGRADO_SUCESSO");
            log.info("[✓ SUCESSO] Status da integração atualizado para INTEGRADO_SUCESSO");
        } else {
            log.warn("[! AVISO] Nenhum sócio foi integrado. Verifique se há linhas de sócios no formulário");
            hAPI.setCardValue("statusIntegracaoRM", "SEM_SOCIOS");
        }

        log.info("###############################################################");
        log.info("#### INTEGRAÇÃO RM CONCLUÍDA COM SUCESSO NO MÓDULO ESTOQUES!");
        log.info("###############################################################");
        return true;

    } catch (error) {
        log.error("###############################################################");
        log.error("#### ERRO NA INTEGRAÇÃO RM: " + error);
        log.error("###############################################################");

        // Registra o status de erro no formulário para rastreabilidade
        hAPI.setCardValue("statusIntegracaoRM", "ERRO_INTEGRACAO");

        throw "Erro na Integração com TOTVS RM: " + error;
    }
}

// ==========================================================================
// FUNÇÃO HELPER: BUSCAR CÓDIGO DA COLIGADA POR NOME
// ==========================================================================
// Se o campo zoom retorna apenas o nome e não o código,
// faz lookup no dataset ds_coligadas_ativas para recuperar o código.

function buscarCodigoPorNomeColigada(nomeBuscado) {
    log.info("[LOOKUP] Buscando coligada pelo nome: '" + nomeBuscado + "'");

    try {
        // Carregar dataset de coligadas ativas
        var dsColigadas = DatasetFactory.getDataset("ds_coligadas_ativas", null, null, null);

        if (dsColigadas == null || dsColigadas.rowsCount == 0) {
            log.error("[ERRO LOOKUP] Dataset ds_coligadas_ativas não encontrado ou vazio");
            return null;
        }

        // Procurar por nome (case-insensitive)
        var nomeB = String(nomeBuscado).trim().toUpperCase();

        for (var i = 0; i < dsColigadas.rowsCount; i++) {
            var codigo = dsColigadas.getValue(i, "CODCOLIGADA");
            var nome = String(dsColigadas.getValue(i, "NOME")).trim().toUpperCase();
            var ativo = dsColigadas.getValue(i, "ATIVO");

            // Comparar nomes
            if (nome == nomeB) {
                log.info("[✓ LOOKUP] Coligada encontrada: " + codigo + " - " + nome + " (Ativo: " + ativo + ")");
                return codigo;
            }
        }

        // Se não encontrou por nome exato, tenta contém
        log.warn("[WARN LOOKUP] Nome exato não encontrado. Tentando busca parcial...");
        for (var i = 0; i < dsColigadas.rowsCount; i++) {
            var codigo = dsColigadas.getValue(i, "CODCOLIGADA");
            var nome = String(dsColigadas.getValue(i, "NOME")).trim().toUpperCase();
            var ativo = dsColigadas.getValue(i, "ATIVO");

            // Busca parcial (contains)
            if (nome.indexOf(nomeB) > -1) {
                log.info("[✓ LOOKUP PARCIAL] Coligada encontrada: " + codigo + " - " + nome);
                return codigo;
            }
        }

        log.warn("[ERRO LOOKUP] Nenhuma coligada encontrada com o nome: " + nomeBuscado);
        return null;

    } catch (e) {
        log.error("[ERRO LOOKUP] Falha ao buscar coligada: " + e);
        return null;
    }
}

// ==========================================================================
// Esta função encapsula toda a lógica de instanciação e autenticação
// com o TOTVS RM, evitando duplicação de código e facilitando manutenção.
// Modelo baseado em: wf_cadastro_item.servicetask21.js

function getWebService() {
    log.info("[AUTENTICAÇÃO] Iniciando carregamento de serviço RM...");

    // CONSTANTES DO SERVIÇO FLUIG
    var NOME_SERVICO = "RMWsDataServer";  // Nome oficial registrado no Fluig (NÃO é "wsDataServer")
    var CAMINHO_SERVICO = "com.totvs.WsDataServer";  // Interface correta (NÃO é com.totvs.IwsDataServer)

    try {
        // PASSO 1: Obter a instância do serviço registrado no Fluig
        log.info("[AUTENTICAÇÃO] Procurando serviço: " + NOME_SERVICO);
        var dataServerService = ServiceManager.getServiceInstance(NOME_SERVICO);

        if (dataServerService == null) {
            throw "Serviço não encontrado: " + NOME_SERVICO + ". Verifique em Administração > Serviços Externos do Fluig.";
        }
        log.info("[✓] Serviço " + NOME_SERVICO + " encontrado");

        // PASSO 2: Instanciar o localizador de serviço
        log.info("[AUTENTICAÇÃO] Instantiando classe: " + CAMINHO_SERVICO);
        var serviceLocator = dataServerService.instantiate(CAMINHO_SERVICO);

        if (serviceLocator == null) {
            throw "Falha ao instanciar: " + CAMINHO_SERVICO;
        }
        log.info("[✓] Classe instanciada com sucesso");

        // PASSO 3: Obter a referência da interface RMIwsDataServer
        log.info("[AUTENTICAÇÃO] Obtendo interface RMIwsDataServer");
        var service = serviceLocator.getRMIwsDataServer();

        if (service == null) {
            throw "Falha ao obter interface RMIwsDataServer do localizador de serviço.";
        }
        log.info("[✓] Interface obtida");

        // PASSO 4: Obter o bean helper da instância de serviço
        log.info("[AUTENTICAÇÃO] Obtendo service helper");
        var serviceHelper = dataServerService.getBean();

        if (serviceHelper == null) {
            throw "Falha ao obter service helper da instância de serviço.";
        }
        log.info("[✓] Service helper obtido");

        // PASSO 5: Obter credenciais do dataset de integração
        log.info("[AUTENTICAÇÃO] Carregando credenciais do dataset ds_connector");
        var dsAuth = DatasetFactory.getDataset("ds_connector", null, null, null);

        if (dsAuth == null || dsAuth.rowsCount == 0) {
            throw "Dataset ds_connector não encontrado ou vazio. Configure as credenciais de integração.";
        }

        var usuario = dsAuth.getValue(0, "INTEGRADOR");
        var senha = dsAuth.getValue(0, "SENHA");

        if (usuario == null || usuario == "" || senha == null || senha == "") {
            throw "Credenciais incompletas no dataset ds_connector (INTEGRADOR ou SENHA vazio)";
        }
        log.info("[✓] Credenciais carregadas (Usuário: " + usuario + ")");

        // PASSO 6: Criar cliente autenticado usando o método correto
        // IMPORTANTE: Usar getBasicAuthenticatedClient (não getCustomClient)
        log.info("[AUTENTICAÇÃO] Criando cliente autenticado...");
        var authService = serviceHelper.getBasicAuthenticatedClient(
            service,                           // Interface de serviço
            "com.totvs.IwsDataServer",        // Classe da interface desejada
            usuario,                            // Usuário RM
            senha                               // Senha RM
        );

        if (authService == null) {
            throw "Falha na criação do cliente autenticado. Verifique usuário/senha do RM.";
        }
        log.info("[✓ SUCESSO] Cliente autenticado criado com sucesso");

        return authService;

    } catch (e) {
        log.error("[ERRO AUTENTICAÇÃO] Falha ao carregar serviço RM: " + e);
        throw "Erro ao configurar conexão com TOTVS RM: " + e;
    }
}

// ==========================================================================
// INTEGRAÇÃO MÓDULO FINANCEIRO: Criar Provisão de Dividendo
// ==========================================================================
// Cria uma provisão (CP - Contas a Pagar) no módulo Financeiro do RM
// Documento tipo: "Provisão de Dividendo - Antecipação"
// Status: ABERTO para processamento posterior

function criarProvisaoFinanceira(authService, coligadaCode, cpfCnpjSocio, valorFloat, dataVencimento, numeroSolicitacao, linha) {
    log.info("[FINANCEIRO] ========== Iniciando Criação de Provisão ==========");

    try {
        // CONSTANTES DO MÓDULO FINANCEIRO
        var RM_DATASERVER_FINANCEIRO = "FinCPrazo";  // DataServer para Contas a Pagar
        var TIPO_DOCUMENTO = CONFIG_RM.FIN_DOC_ANTECIPACAO_PAGAR;             // Tipo de Documento (Provisão Dividendo)
        var NATUREZA_FINANCEIRA = "DIVANTICIP";     // Natureza Financeira (Dividendo Antecipado)
        var STATUS_DOCUMENTO = "ABERTO";             // Status inicial: ABERTO
        var CONTEXTO = "CODSISTEMA=F;CODCOLIGADA=" + coligadaCode; // 'F' = Sistema Financeiro

        log.info("[FINANCEIRO] DataServer: " + RM_DATASERVER_FINANCEIRO);
        log.info("[FINANCEIRO] Tipo Documento: " + TIPO_DOCUMENTO);
        log.info("[FINANCEIRO] Natureza: " + NATUREZA_FINANCEIRA);
        log.info("[FINANCEIRO] CPF/CNPJ do Credor: " + cpfCnpjSocio);
        log.info("[FINANCEIRO] Valor: R$ " + valorFloat);
        log.info("[FINANCEIRO] Data Vencimento: " + dataVencimento);

        // Montar XML da Provisão (Contas a Pagar)
        var xmlProvisao = "<FinCPrazo>";
        xmlProvisao += "  <TCPRAZO>";
        xmlProvisao += "    <CODCOLIGADA>" + coligadaCode + "</CODCOLIGADA>";
        xmlProvisao += "    <IDFINC>-1</IDFINC>";                          // Chave Primária (ID)
        xmlProvisao += "    <TIPDOC>" + TIPO_DOCUMENTO + "</TIPDOC>";     // Tipo de Documento
        xmlProvisao += "    <NUFIN>-1</NUFIN>";                            // Número Financeiro (gerado automaticamente)
        xmlProvisao += "    <CODFOR>" + cpfCnpjSocio + "</CODFOR>";       // Código do Fornecedor/Credor (CPF/CNPJ)
        xmlProvisao += "    <DATASITUACAO>" + dataVencimento + "T00:00:00</DATASITUACAO>";
        xmlProvisao += "    <DATAVENCIMENTO>" + dataVencimento + "T00:00:00</DATAVENCIMENTO>";
        xmlProvisao += "    <VALORDOCUMENTO>" + valorFloat + "</VALORDOCUMENTO>";
        xmlProvisao += "    <VALORJURO>0</VALORJURO>";
        xmlProvisao += "    <VALORDESCONTO>0</VALORDESCONTO>";
        xmlProvisao += "    <STATUSTITULAR>" + STATUS_DOCUMENTO + "</STATUSTITULAR>";
        xmlProvisao += "    <CODHISTOR>HIST001</CODHISTOR>";              // Código de Histórico (genérico, pode ser customizado)
        xmlProvisao += "    <OBSERVACAO>Provisão - Solicitação Fluig #" + numeroSolicitacao + "</OBSERVACAO>";
        xmlProvisao += "    <NATUREZA>" + NATUREZA_FINANCEIRA + "</NATUREZA>";
        xmlProvisao += "  </TCPRAZO>";
        xmlProvisao += "</FinCPrazo>";

        log.info("[FINANCEIRO] Payload gerado (Provisão CP): " + xmlProvisao);

        // Chamar WebService do RM para salvar a provisão
        log.info("[FINANCEIRO] Enviando provisão para RM...");
        var resultadoProvisao = authService.saveRecord(RM_DATASERVER_FINANCEIRO, xmlProvisao, CONTEXTO);

        var resultString = String(resultadoProvisao).trim();
        log.info("[FINANCEIRO] Resposta RM: " + resultString);

        // Validar resposta
        if (resultString == null || resultString == "") {
            throw "Resposta vazia do RM ao criar provisão. Verifique os parâmetros.";
        }

        // Extrair ID da provisão criada (esperado formato: "CodigoDaColigada;IDDaProvisao")
        var partes = resultString.split(";");
        var idProvisaoGerada = (partes.length > 1) ? partes[1].trim() : resultString;

        if (idProvisaoGerada == "" || isNaN(parseInt(idProvisaoGerada))) {
            throw "Formato inválido da resposta RM. ID de provisão não identificado: " + resultString;
        }

        // Gravar ID da provisão no formulário para rastreabilidade
        log.info("[✓ FINANCEIRO] Provisão criada com ID: " + idProvisaoGerada);

        // Atualizar status na tabela de pagamentos (campo opcional)
        try {
            hAPI.setCardValue("pagStatusFinanceiro___" + linha, "PROVISAOCRIADA");
        } catch (e) {
            log.warn("[WARN] Campo pagStatusFinanceiro não existe no formulário");
        }

        return "Provisão criada com sucesso (ID: " + idProvisaoGerada + ")";

    } catch (erro) {
        log.error("[ERRO FINANCEIRO] Falha ao criar provisão: " + erro);
        throw "Erro na integração financeira: " + erro;
    }
}

// ==========================================================================
// INTEGRAÇÃO MÓDULO CONTÁBIL: Criar Lançamentos Balanceados
// ==========================================================================
// Cria lançamentos balanceados (débito/crédito) na contabilidade do RM
// Contas: Lucros Distribuídos (débito) <-> Contas a Pagar (crédito)

function criarLancamentosContabeis(authService, coligadaCode, cpfCnpjSocio, valorFloat, dataVencimento, codNatDinamica, numeroSolicitacao, linha) {
    log.info("[CONTÁBIL] ========== Iniciando Criação de Lançamentos Balanceados ==========");

    try {
        // CONSTANTES DO MÓDULO CONTÁBIL
        var RM_DATASERVER_CONTABIL = "GLJDiario";    // DataServer para Diário (Journal Entry)
        var TIPO_LANCAMENTO = "PROVDIV";             // Tipo de Lançamento
        var CONTEXTO = "CODSISTEMA=C;CODCOLIGADA=" + coligadaCode; // 'C' = Sistema Contábil

        // Contas Contábeis (SERÁ NECESSÁRIO PARAMETRIZAR CONFORME SUA CONTABILIDADE)
        // PLACEHOLDER: Usar dataset ou configuração posterior para mapear estas contas
        var CONTA_DEVEDORA = "LUCROS_DISTRIBUIDOS";      // Conta de Lucros Distribuídos (DÉBITO)
        var CONTA_CREDORA = "CONTAS_PAGAR_DIVIDENDOS";  // Conta de Contas a Pagar (CRÉDITO)
        var CENTRO_CUSTO_PADRAO = "CC_PRINCIPAL";        // Centro de Custo padrão (SERÁ CUSTOMIZADO)

        log.info("[CONTÁBIL] DataServer: " + RM_DATASERVER_CONTABIL);
        log.info("[CONTÁBIL] Conta Devedora: " + CONTA_DEVEDORA);
        log.info("[CONTÁBIL] Conta Credora: " + CONTA_CREDORA);
        log.info("[CONTÁBIL] CPF/CNPJ: " + cpfCnpjSocio);
        log.info("[CONTÁBIL] Valor (Débito/Crédito): R$ " + valorFloat);

        // Montar XML do Lançamento (Débito e Crédito balanceados)
        var xmlLancamento = "<GLJDiario>";

        // ===== LINHA 1: DÉBITO em Lucros Distribuídos =====
        xmlLancamento += "  <TGLJOS>";
        xmlLancamento += "    <CODCOLIGADA>" + coligadaCode + "</CODCOLIGADA>";
        xmlLancamento += "    <IDJDIARIO>-1</IDJDIARIO>";                 // Chave Primária (gerada automaticamente)
        xmlLancamento += "    <CODLANCAMENTO>" + TIPO_LANCAMENTO + "</CODLANCAMENTO>";
        xmlLancamento += "    <DATALANCAMENTO>" + dataVencimento + "T00:00:00</DATALANCAMENTO>";
        xmlLancamento += "    <NLINHADIARIO>1</NLINHADIARIO>";             // Primeira linha: DÉBITO
        xmlLancamento += "    <CONTACONTABIL>" + CONTA_DEVEDORA + "</CONTACONTABIL>";
        xmlLancamento += "    <CODCENTROCUSTO>" + CENTRO_CUSTO_PADRAO + "</CODCENTROCUSTO>";
        xmlLancamento += "    <DEBITO>" + valorFloat + "</DEBITO>";
        xmlLancamento += "    <CREDITO>0</CREDITO>";
        xmlLancamento += "    <HISTORICO>Provisionamento de Dividendo #" + numeroSolicitacao + " - Fluig</HISTORICO>";
        xmlLancamento += "    <DOCCOMPLEMENTAR>" + cpfCnpjSocio + "</DOCCOMPLEMENTAR>";
        xmlLancamento += "  </TGLJOS>";

        // ===== LINHA 2: CRÉDITO em Contas a Pagar =====
        xmlLancamento += "  <TGLJOS>";
        xmlLancamento += "    <CODCOLIGADA>" + coligadaCode + "</CODCOLIGADA>";
        xmlLancamento += "    <IDJDIARIO>-1</IDJDIARIO>";
        xmlLancamento += "    <CODLANCAMENTO>" + TIPO_LANCAMENTO + "</CODLANCAMENTO>";
        xmlLancamento += "    <DATALANCAMENTO>" + dataVencimento + "T00:00:00</DATALANCAMENTO>";
        xmlLancamento += "    <NLINHADIARIO>2</NLINHADIARIO>";             // Segunda linha: CRÉDITO
        xmlLancamento += "    <CONTACONTABIL>" + CONTA_CREDORA + "</CONTACONTABIL>";
        xmlLancamento += "    <CODCENTROCUSTO>" + CENTRO_CUSTO_PADRAO + "</CODCENTROCUSTO>";
        xmlLancamento += "    <DEBITO>0</DEBITO>";
        xmlLancamento += "    <CREDITO>" + valorFloat + "</CREDITO>";
        xmlLancamento += "    <HISTORICO>Provisionamento de Dividendo #" + numeroSolicitacao + " - Fluig</HISTORICO>";
        xmlLancamento += "    <DOCCOMPLEMENTAR>" + cpfCnpjSocio + "</DOCCOMPLEMENTAR>";
        xmlLancamento += "  </TGLJOS>";

        xmlLancamento += "</GLJDiario>";

        log.info("[CONTÁBIL] Payload gerado (Lançamentos Balanceados): " + xmlLancamento);

        // Chamar WebService do RM para salvar os lançamentos
        log.info("[CONTÁBIL] Enviando lançamentos para RM...");
        var resultadoContabil = authService.saveRecord(RM_DATASERVER_CONTABIL, xmlLancamento, CONTEXTO);

        var resultString = String(resultadoContabil).trim();
        log.info("[CONTÁBIL] Resposta RM: " + resultString);

        // Validar resposta
        if (resultString == null || resultString == "") {
            throw "Resposta vazia do RM ao criar lançamentos. Verifique os parâmetros.";
        }

        // Extrair ID do diário criado
        var partes = resultString.split(";");
        var idDiarioGerado = (partes.length > 1) ? partes[1].trim() : resultString;

        if (idDiarioGerado == "" || isNaN(parseInt(idDiarioGerado))) {
            throw "Formato inválido da resposta RM. ID de diário não identificado: " + resultString;
        }

        // Gravar ID do diário no formulário para rastreabilidade
        log.info("[✓ CONTÁBIL] Lançamentos contábeis criados com ID de Diário: " + idDiarioGerado);

        // Atualizar status na tabela de pagamentos (campo opcional)
        try {
            hAPI.setCardValue("pagStatusContabil___" + linha, "LANCADOCONTABIL");
        } catch (e) {
            log.warn("[WARN] Campo pagStatusContabil não existe no formulário");
        }

        return "Lançamentos contábeis criados com sucesso (ID Diário: " + idDiarioGerado + ")";

    } catch (erro) {
        log.error("[ERRO CONTÁBIL] Falha ao criar lançamentos: " + erro);
        throw "Erro na integração contábil: " + erro;
    }
}

// ==========================================================================

function buscarCodigoNaturezaPorDescricao(descricaoBuscada, coligadaCode) {
    try {
        log.info("[LOOKUP] Buscando código da Natureza Orçamentária: '" + descricaoBuscada + "'");

        // O dataset 20 exige a Coligada como filtro obrigatório
        var c1 = DatasetFactory.createConstraint("COLIGADA", coligadaCode, coligadaCode, ConstraintType.MUST);
        var dsNatureza = DatasetFactory.getDataset("DS_NATUREZA_ORCAMENTARIA_FLUIG_20", null, new Array(c1), null);

        if (dsNatureza != null && dsNatureza.rowsCount > 0) {
            for (var i = 0; i < dsNatureza.rowsCount; i++) {
                var descBanco = String(dsNatureza.getValue(i, "DESCRICAO")).trim();
                if (descBanco.toUpperCase() == String(descricaoBuscada).trim().toUpperCase()) {
                    var codigoEncontrado = dsNatureza.getValue(i, "CODTBORCAMENTO");
                    log.info("[✓ LOOKUP] Código da Natureza encontrado: " + codigoEncontrado);
                    return codigoEncontrado;
                }
            }
        }
        log.warn("[ERRO LOOKUP] Natureza não encontrada. Enviando valor original.");
        return descricaoBuscada; // Fallback
    } catch (e) {
        log.error("[ERRO LOOKUP] Falha ao buscar Natureza: " + e);
        return descricaoBuscada;
    }
}