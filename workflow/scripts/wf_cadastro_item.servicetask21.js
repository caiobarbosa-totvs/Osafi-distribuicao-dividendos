function servicetask21(attempt, message) {
    log.info("###############################################################");
    log.info("##### INICIO INTEGRACAO RM NATUREZA ORÇAMENTARIA AGRUPADA #####");
    log.info("###############################################################");

    var NOME_DATASERVER_NATUREZA = "MovTbOrcamentoData";
    var CODTBORCAMENTO = hAPI.getCardValue("TXT_CODIGO_NATUREZA");
    var DESCRICAO = hAPI.getCardValue("TXT_DESCRICAO_NATUREZA");
    
    var xmlItensNatureza = "";

    try {
        var authService = getWebService();

        // 1. OBTÉM OS ÍNDICES DA TABELA PAI X FILHO (MESMA DO PRODUTO)
        var indexes = hAPI.getChildrenIndexes("tabela_coligadas_selecionadas");

        if (indexes != null && indexes.length > 0) {
            
            for (var i = 0; i < indexes.length; i++) {
                var index = indexes[i];
                
                // Recupera os valores persistidos
                var codCol = hAPI.getCardValue("coligada_id___" + index);
                var statusPersistido = hAPI.getCardValue("coligada_status___" + index); // 0 (Ativo) ou 1 (Inativo)

                // 2. MONTAGEM DO XML AGRUPADO
                // Note que aqui cada TTBORCAMENTO terá sua própria CODCOLIGADA
                xmlItensNatureza += 
                    "<TTBORCAMENTO>" +
                    "  <CODCOLIGADA>" + codCol + "</CODCOLIGADA>" +
                    "  <CODTBORCAMENTO>" + CODTBORCAMENTO + "</CODTBORCAMENTO>" +
                    "  <DESCRICAO>" + DESCRICAO + "</DESCRICAO>" +
                    "  <CAMPOLIVRE>TODAS</CAMPOLIVRE>" +
                    "  <INATIVO>" + statusPersistido + "</INATIVO>" +
                    "  <NATUREZA>3</NATUREZA>" +
                    "  <SINTETICOANALITICO>1</SINTETICOANALITICO>" +
                    "  <NAOPERMITETRANSF>0</NAOPERMITETRANSF>" +
                    "</TTBORCAMENTO>";
            }

            var TEXT_NATUREZA = "<MovTbOrcamento>" + xmlItensNatureza + "</MovTbOrcamento>";
            
            log.info("#### XML NATUREZA AGRUPADO: " + TEXT_NATUREZA);

            // 3. EXECUÇÃO DA INTEGRAÇÃO
            // Contexto com CODCOLIGADA=0 pois o XML interno define as coligadas específicas
            var CONTEXTO = "CODSISTEMA=X;CODCOLIGADA=0;CODUSUARIO=fluig";
            var result = authService.saveRecord(NOME_DATASERVER_NATUREZA, TEXT_NATUREZA, CONTEXTO);
            
            log.info("#### RESULTS_NATUREZA: " + result);

            // 4. VALIDAÇÃO DO RETORNO (Utilizando a lógica de Regex para garantir sucesso)
            var resultString = String(result).trim();
            var regexValida = /^\d+;.+$/; // Aceita 'Coligada;Codigo' ou 'Coligada;ID'
            var linhas = resultString.split(/\r?\n/);
            var temErro = false;

            for (var k = 0; k < linhas.length; k++) {
                if (linhas[k].trim() == "") continue;
                if (!regexValida.test(linhas[k].trim())) {
                    temErro = true;
                    break;
                }
            }

            if (temErro) {
                throw "ERRO NA INTEGRAÇÃO DA NATUREZA: " + resultString;
            }

            hAPI.setTaskComments(getValue("WKUser"), getValue("WKNumProces"), 0, "Sucesso na integração da Natureza Orçamentária em todas as coligadas selecionadas.");

        } else {
            throw "Nenhuma coligada foi selecionada para a integração da Natureza.";
        }

    } catch (e) {
        log.error("### ERRO SERVICETASK 21: " + e);
        throw e;
    }
}



function logError(mensagemErro) {
	var dataset = DatasetBuilder.newDataset();
	dataset.addColumn("erro");
	dataset.addRow(new Array(mensagemErro));
	log.error(mensagemErro);
	return dataset;
}

// carrega o web service
function getWebService() {
	var NOME_SERVICO = "RMWsDataServer";
	var CAMINHO_SERVICO = "com.totvs.WsDataServer";
	log.info("carregar o servico " + NOME_SERVICO);
	var dataServerService = ServiceManager.getServiceInstance(NOME_SERVICO);
	if (dataServerService == null) {
		throw "Servico nao encontrado: " + NOME_SERVICO;
	}

	var serviceLocator = dataServerService.instantiate(CAMINHO_SERVICO);
	if (serviceLocator == null) {
		throw "Instancia do servico nao encontrada: " + NOME_SERVICO + " - " + CAMINHO_SERVICO;
	}
	var service = serviceLocator.getRMIwsDataServer();
	if (service == null) {
		throw "Instancia do dataserver do invalida: " + NOME_SERVICO + " - " + CAMINHO_SERVICO;
	}
	var serviceHelper = dataServerService.getBean();
	if (serviceHelper == null) {
		throw "Instancia do service helper invalida: " + NOME_SERVICO + " - " + CAMINHO_SERVICO;
	}

	// Altere a senha de acordo com o usuário e senha do aplicativo RM. Na base exemplo o usuário é "mestre" e a senha é "totvs".
	var authService = serviceHelper.getBasicAuthenticatedClient(service, "com.totvs.IwsDataServer", 'fluig', 'Uniqo@2024');
	if (serviceHelper == null) {
		throw "Instancia do auth service invalida: " + NOME_SERVICO + " - " + CAMINHO_SERVICO;
	}

	return authService;
}
