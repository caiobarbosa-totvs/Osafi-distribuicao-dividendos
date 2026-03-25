function servicetask13(attempt, message) {
    log.info("### INICIO INTEGRACAO AGRUPADA RM ###");

    var NOME_DATASERVER_PRODUTO = "EstPrdDataBR";
    var CODIGOPRD = hAPI.getCardValue("TXT_CODIGO_ITEM");
    // ... (demais capturas de variáveis permanecem iguais)

    try {
    	
    	var indexes = hAPI.getChildrenIndexes("tabela_coligadas_selecionadas");
    	
    	if (indexes.length > 0) {
            
            var xmlItensProduto = "";
            var authService = getWebService();
            
            log.info("### indexes.length: " + indexes.length);

            for (var i = 0; i < indexes.length; i++) {
            	
            	var index = indexes[i];
            	var codCol = hAPI.getCardValue("coligada_id___" + index);
            	var INATIVO = hAPI.getCardValue("coligada_status___" + index); // "0" ou "1"

                
                // Garante código se for autoincremento por coligada
                if(!CODIGOPRD) { 
                	ultimoNum(codCol); 
                    CODIGOPRD = hAPI.getCardValue("TXT_CODIGO_ITEM"); 
                }
                log.info("### CODIGOPRD: " + CODIGOPRD);

                if(codCol != '14') //THIAGO RETIRAR ESSA OPÇÃO APÓS SULIVAN NORMALIZAR CADASTROS DA COLIGADA 14
                	{
	                xmlItensProduto += 
	                    "<TPRODUTO> " +
	                    "<CODCOLIGADA>" + codCol + "</CODCOLIGADA> " +
	                    "<CODCOLPRD>" + codCol + "</CODCOLPRD> " +
	                    "<IDPRD>-1</IDPRD> " +
	                    "<CODIGOPRD>" + CODIGOPRD + "</CODIGOPRD> " +
	                    "<NUMNOFABRIC>" + CODIGOPRD + "</NUMNOFABRIC> " +
	                    "<TIPO>" + hAPI.getCardValue("H_TIPO") + "</TIPO> " +
	                    "<NOMEFANTASIA>" + hAPI.getCardValue("TXT_NOME_FANTASIA") + "</NOMEFANTASIA> " +
	                    "<ESTOCAVEL>" + hAPI.getCardValue("RADIO_ESTOCAVEL") + "</ESTOCAVEL> " +
	                    "<DESCRICAO>" + hAPI.getCardValue("TXTA_DESCRICAO_PRODUTO") + "</DESCRICAO> " +
	                    "<DESCRICAOAUX>" + hAPI.getCardValue("TXTA_DESCRICAO_AUXILIAR") + "</DESCRICAOAUX> " +
	                    "<CODMOEPRECO1>" + hAPI.getCardValue("H_MOEDA") + "</CODMOEPRECO1> " +
	                    "<DATABASEPRECO1>" + hAPI.getCardValue("DT_BASE") + "</DATABASEPRECO1> " +
	                    "<PRECO1>" + hAPI.getCardValue("TXT_PRECO") + "</PRECO1> " +
	                    "<CODUNDCONTROLE>" + hAPI.getCardValue("H_COD_CONTROLE") + "</CODUNDCONTROLE> " +
	                    "<CODUNDCOMPRA>" + hAPI.getCardValue("H_COD_COMPRA") + "</CODUNDCOMPRA> " +
	                    "<CODUNDVENDA>" + hAPI.getCardValue("H_COD_VENDA") + "</CODUNDVENDA> " +
	                    "<CODCOLTBORCAMENTO>0</CODCOLTBORCAMENTO> " +
	                    "<CODTBORCAMENTO>" + (hAPI.getCardValue("H_CONTROL_NAT") != '1' ? hAPI.getCardValue("H_NATUREZA") : hAPI.getCardValue("TXT_CODIGO_NATUREZA")) + "</CODTBORCAMENTO> " +
	                    "<IDCLASSIFBENSSERVICO>" + hAPI.getCardValue("H_NCMNBS") + "</IDCLASSIFBENSSERVICO> " +
	                    "<INATIVO>" + INATIVO + "</INATIVO> " +
	                    "</TPRODUTO> ";
                	}
            }

            var TEXT_PRODUTO = "<EstPrdBR> " + xmlItensProduto + "</EstPrdBR>";
            var CONTEXTO_PRODUTO = "CODSISTEMA=T;CODCOLIGADA=1;CODUSUARIO=fluig";
            
            log.info("### TEXT_PRODUTO: " + TEXT_PRODUTO);

            //  ENVIO ÚNICO AO RM
        
            // ... (Execução do saveRecord)
            var result = authService.saveRecord(NOME_DATASERVER_PRODUTO, TEXT_PRODUTO, CONTEXTO_PRODUTO);
            var resultString = String(result).trim();

            log.info("### RM RESULT RAW: " + resultString);
            var regexValida = /^\d+;\d+$/;

            // QUEBRA O RETORNO EM LINHAS
            var linhas = resultString.split(/\r?\n/);
            var mapaIds = {};
            var temErro = false;

            for (var k = 0; k < linhas.length; k++) {
                var linhaAtual = linhas[k].trim();
                
                // Ignora linhas vazias que podem vir no final do XML
                if (linhaAtual == "") continue;

                // Valida se a linha segue o padrão 'Coligada;ID'
                if (regexValida.test(linhaAtual)) {
                    var dados = linhaAtual.split(";");
                    mapaIds[dados[0]] = dados[1];
                } else {
                    // Se uma única linha falhar no padrão, interrompemos e logamos o erro completo
                    temErro = true;
                    break;
                }
            }
            if (temErro || Object.keys(mapaIds).length === 0) {
                var msgErro = "### ERRO DE INTEGRAÇÃO RM: O retorno não segue o padrão de sucesso.\nDetalhes: " + resultString;
                log.error(msgErro);
                hAPI.setTaskComments(getValue("WKUser"), getValue("WKNumProces"), 0, "Falha: Verificar Log de Erros.");
                throw msgErro; // Interrompe o processo no Fluig
            }

            log.info("### SUCESSO: IDs extraídos com segurança: " + JSON.stringify(mapaIds));

            // 3. PARSE DO RETORNO MULTI-COLIGADA
            var linhas = String(result).split(/\r?\n/);
            var mapaIds = {};

            for (var k = 0; k < linhas.length; k++) {
                var dados = linhas[k].split(";");
                if (dados.length === 2) {
                    var coligadaResult = dados[0].trim();
                    var idPrdResult = dados[1].trim();
                    mapaIds[coligadaResult] = idPrdResult;
                }
            }

            // 4. INTEGRAÇÃO DAS TABELAS FILHAS POR COLIGADA/ID ESPECÍFICO
            for (var col in mapaIds) {
                var idGerado = mapaIds[col];
                log.info("### Processando Filhas - Coligada: " + col + " | IDPRD: " + idGerado);

                if (validarTabelaTributos()) {
                    integraTributos(idGerado, CONTEXTO_PRODUTO, col);
                }
                if (validarTabelaTributos2()) {
                    integraTributosMunicipio(idGerado, CONTEXTO_PRODUTO, col);
                }
                integraPrdFiscal(idGerado, CONTEXTO_PRODUTO, col);
            }

            hAPI.setTaskComments(getValue("WKUser"), getValue("WKNumProces"), 0, "Integração multicoligada finalizada com sucesso.");

        }
    } catch (e) {
        log.error("### ERRO INTEGRACAO: " + e);
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

function ultimoNum(CODCOLPRD){
	
	var C1 = DatasetFactory.createConstraint("COLIGADA", CODCOLPRD, CODCOLPRD, ConstraintType.MUST);
    var DS = DatasetFactory.getDataset("DS_CODIGO_PRODUTO_ATUAL_022", null, [C1], null);
    
    if (DS.values.length > 0) {
        var codigoAtual = DS.values[0].ULT_NUM; // Exemplo: "01.13.0315" ou "01.13.315"
        console.log("codigoAtual: " + codigoAtual);

        var partes = codigoAtual.split(".");
        var ultimaParte = partes[2];
        var numDigitos = ultimaParte.length; // conta quantos dígitos tinha originalmente

        var ultimoNumero = parseInt(ultimaParte, 10) + 1;
        var novaUltimaParte = String(ultimoNumero).padStart(numDigitos, '0'); // mantêm o mesmo número de dígitos

        var novoCodigo = partes[0] + "." + partes[1] + "." + novaUltimaParte;

        $("#TXT_CODIGO_ITEM").val(novoCodigo);
    }

}

function integraTributos(result, CONTEXTO_PRODUTO,CODCOLPRD) {
    
	var authService = getWebService();
    log.info("integraTributos: " + result + ' - ' + CONTEXTO_PRODUTO);
    
    var NOME_DATASERVER_PRODUTO = "EstTrbPrdData";
    //var CODCOLPRD = hAPI.getCardValue("H_COLIGADA");
    var IDPRD = result;

    var xmlTributos = "";
    
    // CORREÇÃO: Obtém os índices da tabela Pai x Filho 'tabela_Tributo'
    var indexes = hAPI.getChildrenIndexes("tabela_Tributo");
    
    log.info("Quantidade de linhas encontradas na tabela: " + indexes.length);

    for (var i = 0; i < indexes.length; i++) {
        var index = indexes[i];

        // Captura os valores de cada linha usando o índice
        var CODTRIB = hAPI.getCardValue("hcodTrib___" + index);
        var ALIQ = hAPI.getCardValue("aliquota___" + index) || 0;
        var SITTRIBUTARIAENT = hAPI.getCardValue("sitTribEnt___" + index);
        var SITTRIBUTARIASAI = hAPI.getCardValue("sitTribSaida___" + index);
        var CODCONTRIBSOCIAL = hAPI.getCardValue("codContribSind___" + index);

        // Só adiciona ao XML se o código do tributo estiver preenchido
        if (CODTRIB != null && CODTRIB != "") {
            xmlTributos += 
                "<TTrbPrd> " +
                "  <CODCOLIGADA>" + CODCOLPRD + "</CODCOLIGADA> " +
                "  <IDPRD>" + IDPRD + "</IDPRD> " +
                "  <CODTRB>" + CODTRIB + "</CODTRB>" +
                "  <ALIQUOTA>" + ALIQ + "</ALIQUOTA> " +
                "  <SITTRIBUTARIAENT>" + SITTRIBUTARIAENT + "</SITTRIBUTARIAENT> " +
                "  <SITTRIBUTARIASAI>" + SITTRIBUTARIASAI + "</SITTRIBUTARIASAI> " +
                "  <CODCONTRIBSOCIAL>" + CODCONTRIBSOCIAL + "</CODCONTRIBSOCIAL> " +
                "</TTrbPrd> ";
        }
    }

    log.info("xmlTributos montado: " + xmlTributos);
    
    if (xmlTributos != "") {
        var TEXT_PRODUTO = "<EstTrbPrd>" + xmlTributos + "</EstTrbPrd>";
        
        try {
            var result2 = authService.saveRecord(NOME_DATASERVER_PRODUTO, TEXT_PRODUTO, CONTEXTO_PRODUTO);
            log.info("####XML_RESULTS_TRIBUTOS DO PRODUTO: " + result2);
        } catch (e) {
            log.error("Erro na integração de tributos: " + e);
            throw "Erro ao integrar tributos do produto no RM: " + e;
        }
    }
}

function integraTributosMunicipio(result, CONTEXTO_PRODUTO,CODCOLPRD) {
    
	var authService = getWebService();
    log.info("### integraTributosMunicipio INICIO: " + result + ' - ' + CONTEXTO_PRODUTO);
    
    var NOME_DATASERVER_PRODUTO = "FisTrbMunicipioPrdData";
    //var CODCOLPRD = hAPI.getCardValue("H_COLIGADA");
    var IDPRD = result;
    var xmlTributos = "";

    // CORREÇÃO: Busca os índices da tabela dinâmica para evitar o erro getCardData
    var indexes = hAPI.getChildrenIndexes("tabela_Tributo2");
    
    log.info("### Quantidade de linhas para Município: " + indexes.length);

    for (var i = 0; i < indexes.length; i++) {
        var index = indexes[i];

        // Captura os valores específicos da localidade e serviço usando o índice da linha
        var UF = hAPI.getCardValue("hUF___" + index);
        var MUNICIPIO = hAPI.getCardValue("hCidade___" + index);
        
        // Verifica se os campos obrigatórios de Município/UF estão preenchidos para esta linha
        if (MUNICIPIO != null && MUNICIPIO != "" && UF != null && UF != "") {
            
            var CODTRIB = hAPI.getCardValue("hcodTrib2___" + index);
            var ALIQ = hAPI.getCardValue("aliquota2___" + index) || 0;
            var FATORISS = hAPI.getCardValue("fatorISS___" + index) || 0;
            var COD_SERV_MUN = hAPI.getCardValue("codServico___" + index);
            var COD_SERV_FED = hAPI.getCardValue("codServicoFederal___" + index);

            log.info("### Processando tributo municipal linha " + index + ": " + CODTRIB + " para " + MUNICIPIO);

            // Montagem do XML baseada no Schema FisTrbMunicipioPrd enviado anteriormente
            xmlTributos +=  
                "<DTrbMunicipioPrd> " +
                "  <CODCOLIGADA>" + CODCOLPRD + "</CODCOLIGADA> " +
                "  <CODMUNICIPIO>" + MUNICIPIO + "</CODMUNICIPIO> " +
                "  <CODETDMUNICIPIO>" + UF + "</CODETDMUNICIPIO> " +
                "  <CODTRB>" + CODTRIB + "</CODTRB>" +
                "  <IDPRD>" + IDPRD + "</IDPRD> " +
                "  <ALIQUOTA>" + ALIQ + "</ALIQUOTA> " +
                "  <FATORISS>" + FATORISS + "</FATORISS> " +
                "  <CODIGOSERVICO>" + COD_SERV_MUN + "</CODIGOSERVICO> " +
                "  <CODIGOSERVICOFEDERAL>" + COD_SERV_FED + "</CODIGOSERVICOFEDERAL> " +
                "  <INCENTIVOFISCAL>0</INCENTIVOFISCAL> " +
                "  <GERACAMPOXML>0</GERACAMPOXML> " +
                "</DTrbMunicipioPrd> ";
        } else {
            log.info("### Linha " + index + " ignorada na integração municipal: UF ou Município vazios.");
        }
    }

    log.info("### xmlTributos Municipio finalizado.");
    
    if (xmlTributos != "") {
        var TEXT_PRODUTO = "<FisTrbMunicipioPrd>" + xmlTributos + "</FisTrbMunicipioPrd>";
        
        try {
            var result2 = authService.saveRecord(NOME_DATASERVER_PRODUTO, TEXT_PRODUTO, CONTEXTO_PRODUTO);
            log.info("#### XML_RESULTS_TRIBUTOS_MUNICIPIO: " + result2);
            return result2;
        } catch (e) {
            log.error("Erro na integração de tributos municipais: " + e);
            throw "Erro ao integrar tributos municipais do produto no RM: " + e;
        }
    } else {
        log.info("### Nenhum tributo municipal válido para integração.");
    }
}

function validarTabelaTributos() {
	log.info("validarTabelaTributos()");
    var tabelaId = "tabela_Tributo";

    var indexes = hAPI.getChildrenIndexes(tabelaId);
    
    log.info("validarTabelaTributos indexes.length: " + indexes.length);
    
    if (indexes.length == 0) {
    	return false;
    }

    for (var i = 0; i < indexes.length; i++) {
        var index = indexes[i];
        
        // 1. Campos Obrigatórios para AMBAS as integrações (Geral e Município)
        var codTrib = hAPI.getCardValue("hcodTrib___" + index);
        var aliquota = hAPI.getCardValue("aliquota___" + index);
        
        log.info("validarTabelaTributos codTrib: " + codTrib);
        log.info("validarTabelaTributos aliquota: " + aliquota);
        if (codTrib == null || codTrib == "") {
        	return false;
        }
        if (aliquota == null || aliquota == "") {
        	return false;
        }

        var sitEnt = hAPI.getCardValue("sitTribEnt___" + index);
        var sitSai = hAPI.getCardValue("sitTribSaida___" + index);
        
        log.info("validarTabelaTributos sitEnt: " + sitEnt);
        log.info("validarTabelaTributos sitSai: " + sitSai);
        if (sitEnt == "" || sitSai == "") {
        	return false;
        }
    }
    
    log.info("validarTabelaTributos return true: ");
    return true;
}
function validarTabelaTributos2() {
	log.info("validarTabelaTributos()");
    var tabelaId = "tabela_Tributo2";

    var indexes = hAPI.getChildrenIndexes(tabelaId);
    
    log.info("validarTabelaTributos indexes.length: " + indexes.length);
    
    if (indexes.length == 0) {
    	return false;
    }

    for (var i = 0; i < indexes.length; i++) {
        var index = indexes[i];
        
        // 1. Campos Obrigatórios para AMBAS as integrações (Geral e Município)
        var codTrib = hAPI.getCardValue("hcodTrib2___" + index);
        var aliquota = hAPI.getCardValue("aliquota2___" + index);
        
        log.info("validarTabelaTributos codTrib: " + codTrib);
        log.info("validarTabelaTributos aliquota: " + aliquota);
        if (codTrib == null || codTrib == "") {
        	return false;
        }
        if (aliquota == null || aliquota == "") {
        	return false;
        }

        var uf = hAPI.getCardValue("hUF___" + index);
        var cidade = hAPI.getCardValue("hCidade___" + index);
        var codServico = hAPI.getCardValue("codServico___" + index);

        log.info("validarTabelaTributos uf: " + uf);
        log.info("validarTabelaTributos cidade: " + cidade);
        log.info("validarTabelaTributos codServico: " + codServico);
        
        if (uf != "" || cidade != "" || codServico != "") {
            if (uf == "") return false;
            if (cidade == "") return false;
            if (codServico == "") return false;
        }


    }
    
    log.info("validarTabelaTributos return true: ");
    return true;
}

function integraPrdFiscal(result, CONTEXTO_PRODUTO,CODCOLIGADA) {
    
    var authService = getWebService();
    log.info("### integraPrdFiscal iniciada para IDPRD: " + result);
    
    // Nome do DataServer para a tabela TPRDFISCAL
    var NOME_DATASERVER_FISCAL = "FisPrdDadosFiscaisData";
    
    //var CODCOLIGADA = hAPI.getCardValue("H_COLIGADA"); // Coligada do Produto
    var IDPRD = result; // ID do Produto vindo da integração principal

    // Captura dos novos campos criados no formulário
    var tipoTributacao = hAPI.getCardValue("tipoTributacao");
    var situacaoMercadoria = hAPI.getCardValue("situacaoMercadoria");
    var hContaSped = hAPI.getCardValue("hContaSped");
    var localOperacao = hAPI.getCardValue("localOperacao");
    var codigoReceita = hAPI.getCardValue("codigoReceita");
    var hNaturezaRendimento = hAPI.getCardValue("hNaturezaRendimento");
    var localPrestacao = hAPI.getCardValue("localPrestacao");
    var codigoCest = hAPI.getCardValue("codigoCest");

    var baseIRRF = tipoTributacao == "0" ? '' : '100'


    // Montagem do XML para TPRDFISCAL
    	var xmlFiscal = 
    	    "<FisPrdDadosFiscais xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'> " +
    	    "  <TPrdFiscal> " +
    	    "    <CODCOLIGADA>" + CODCOLIGADA + "</CODCOLIGADA> " +
    	    "    <IDPRD>" + IDPRD + "</IDPRD> " +
    	    "    <TIPOTRIBUTACAO>" + tipoTributacao + "</TIPOTRIBUTACAO> " +
    	    "    <SITUACAOMERCADORIA>" + situacaoMercadoria + "</SITUACAOMERCADORIA> " +
    	    "    <CODCONTA>" + hContaSped + "</CODCONTA> " +
    	    "    <CODCOLCONTA>" + CODCOLIGADA + "</CODCOLCONTA> " + 
    	    "    <LOCALOPERACAO>" + localOperacao + "</LOCALOPERACAO> " +
    	    "    <CODIGOIRRF>" + codigoReceita + "</CODIGOIRRF> " +
    	    "    <IDNATRENDIMENTO>" + (hNaturezaRendimento || 0) + "</IDNATRENDIMENTO> " +
    	    "    <LOCALPRESTACAO>" + localPrestacao + "</LOCALPRESTACAO> " +
    	    "    <DEDUCAOIRRF>" + (baseIRRF || 0) + "</DEDUCAOIRRF> " +
    	    "    <CODIGOCEST>" + codigoCest + "</CODIGOCEST> " +
    	    "  </TPrdFiscal> " +
    	    "</FisPrdDadosFiscais>";

    log.info("### xmlFiscal montado: " + xmlFiscal);
    
    try {
        // Realiza a gravação no RM
        var resultFiscal = authService.saveRecord(NOME_DATASERVER_FISCAL, xmlFiscal, CONTEXTO_PRODUTO);
        log.info("### XML_RESULTS_TPRDFISCAL: " + resultFiscal);
        
        // Verifica se houve erro no retorno do XML do RM
        if (resultFiscal.indexOf("DescricaoErro") != -1) {
            throw "Erro RM: " + resultFiscal;
        }
        
    } catch (e) {
        log.error("### Erro na integração TPRDFISCAL: " + e);
        throw "Erro ao integrar dados fiscais do produto (TPRDFISCAL) no RM: " + e;
    }
}