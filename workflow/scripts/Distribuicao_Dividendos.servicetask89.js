function servicetask89(attempt, message) {
    log.info("###############################################################");
    log.info("#### INICIANDO INTEGRAÇÃO RM - ANTECIPAÇÃO DE DIVIDENDOS...####");
    log.info("###############################################################");

    try {
        var RM_SERVICO = "wsDataServer"; 
        // ATUALIZAÇÃO 1: Mudança do DataServer de Financeiro para Estoque/Movimentos conforme PDF
        var RM_DATASERVER = "MovMovimentoTBCData"; 
        var RM_TIPO_MOVIMENTO = "XXX"; // Tipo de Movimento (Estoque) - Conforme PDF
        
        var numeroSolicitacao = getValue("WKNumProces");
        var cardData = hAPI.getCardData(numeroSolicitacao);
        var coligadaForm = cardData.get("empresaFilial");

        // Autenticação Segura
        var dsAuth = DatasetFactory.getDataset("ds_connector", null, null, null);
        if (dsAuth == null || dsAuth.rowsCount == 0) throw "Falha ao acessar ds_connector. Credenciais não encontradas.";

        var usuarioRM = dsAuth.getValue(0, "INTEGRADOR");
        var senhaRM = dsAuth.getValue(0, "SENHA");

        var serviceProvider = ServiceManager.getServiceInstance(RM_SERVICO);
        if (serviceProvider == null) throw "Serviço '" + RM_SERVICO + "' não está cadastrado no Fluig.";

        var serviceLocator = serviceProvider.instantiate("com.totvs.IwsDataServer");
        var client = serviceProvider.getCustomClient(serviceLocator, "com.totvs.IwsDataServer", usuarioRM, senhaRM);

        var contexto = "CODSISTEMA=T;CODCOLIGADA=" + coligadaForm; // 'T' para Gestão de Estoques/Compras

        var keys = cardData.keySet().toArray();
        var integrouPeloMenosUm = false;

        for (var i = 0; i < keys.length; i++) {
            var fieldName = keys[i];

            if (fieldName.match(/^nomeSocio___/)) {
                var linha = fieldName.split("___")[1];
                var cpfCnpjSocio = cardData.get("cpfCnpjSocio___" + linha);
                var valorAdiantamento = cardData.get("valorSocio___" + linha);
                var centroCustoRateio = cardData.get("centroCustoSocio___" + linha);
                var dataVencimento = cardData.get("pagDataProgramada___" + linha);
                var naturezaSocio = cardData.get("naturezaOrcamentariaSocio___" + linha);
                var naturezaGlobal = cardData.get("naturezaOrcamentaria");

                // Validação de Fallback de Natureza (Lei 15.270)
                var codNatDinamica = (naturezaSocio != null && naturezaSocio != "") ? naturezaSocio : naturezaGlobal;

                if(dataVencimento == null || dataVencimento == "") {
                    var formatador = new java.text.SimpleDateFormat("yyyy-MM-dd");
                    dataVencimento = formatador.format(new java.util.Date());
                }

                var valorFloat = valorAdiantamento.replace(/\./g, '').replace(',', '.');
                log.info("Preparando Integração Sócio (Estoque): " + cpfCnpjSocio + " | Valor: R$ " + valorFloat);

                // ATUALIZAÇÃO 2: Construção do Payload XML para Movimento de Estoque (TMOV)
                var xmlPayload = "<MovMovimento>";
                xmlPayload += "  <TMOV>";
                xmlPayload += "    <CODCOLIGADA>" + coligadaForm + "</CODCOLIGADA>";
                xmlPayload += "    <CODFILIAL>1</CODFILIAL>"; // Requerido filial
                xmlPayload += "    <CODTMV>" + RM_TIPO_MOVIMENTO + "</CODTMV>";
                xmlPayload += "    <CODCFO>" + cpfCnpjSocio.replace(/\D/g, '') + "</CODCFO>";
                xmlPayload += "    <DATAEMISSAO>" + dataVencimento + "T00:00:00</DATAEMISSAO>";
                xmlPayload += "    <VALORLIQUIDO>" + valorFloat + "</VALORLIQUIDO>";
                xmlPayload += "    <CODCCUSTO>" + centroCustoRateio + "</CODCCUSTO>";
                // O Histórico exigido pelo PDF para identificação da transação
                xmlPayload += "    <HISTORICOCURTO>Adiantamento de Dividendos - Fluig " + numeroSolicitacao + "</HISTORICOCURTO>";
                xmlPayload += "  </TMOV>";
                
                // O RM exige um item de movimento (TITMMOV) para processar o valor total em movimentos tipo XXX
                xmlPayload += "  <TITMMOV>";
                xmlPayload += "    <CODCOLIGADA>" + coligadaForm + "</CODCOLIGADA>";
                xmlPayload += "    <NUMEROSEQUENCIAL>1</NUMEROSEQUENCIAL>";
                xmlPayload += "    <IDPRD>PRODUTO_SERVICO_PADRAO_DIVIDENDO</IDPRD>"; // Substituir pelo ID de produto financeiro padrão cadastrado no RM
                xmlPayload += "    <QUANTIDADE>1</QUANTIDADE>";
                xmlPayload += "    <PRECOUNITARIO>" + valorFloat + "</PRECOUNITARIO>";
                xmlPayload += "    <VALORTOTALITEM>" + valorFloat + "</VALORTOTALITEM>";
                xmlPayload += "    <CODNAT>" + codNatDinamica + "</CODNAT>";
                xmlPayload += "  </TITMMOV>";
                xmlPayload += "</MovMovimento>";

                log.info("Payload Gerado (Estoque/Compras): " + xmlPayload);

                var resultadoRM = client.saveRecord(RM_DATASERVER, xmlPayload, contexto);
                log.info("Resposta do RM Totvs (Módulo Estoque): " + resultadoRM);

                if (resultadoRM.indexOf("Erro") > -1 || resultadoRM.indexOf("Exception") > -1) {
                    throw "O TOTVS RM recusou o Movimento do Sócio " + cpfCnpjSocio + ". Retorno: " + resultadoRM;
                } else {
                    // Grava o ID do Movimento Gerado
                    hAPI.setCardValue("pagProtocolo___" + linha, "ID MOV RM: " + resultadoRM);
                    integrouPeloMenosUm = true;
                }
            }
        }

        if(integrouPeloMenosUm) {
            hAPI.setCardValue("statusIntegracaoRM", "INTEGRADO_SUCESSO");
        }
        
        log.info("[ROBO FLUIG] INTEGRAÇÃO RM CONCLUÍDA COM SUCESSO NO MÓDULO DE ESTOQUES!");
        return true; 

    } catch (error) {
        log.error("[ROBO FLUIG] ERRO NA INTEGRAÇÃO RM: " + error);
        throw "Erro na Integração com TOTVS RM: " + error;
    }
}