function servicetask89(attempt, message) {
	log.info("###############################################################");
	log.info("#### INICIANDO INTEGRAÇÃO RM - ANTECIPAÇÃO DE DIVIDENDOS...####");
	log.info("###############################################################");

    try {
        var RM_SERVICO = "wsDataServer"; // Nome do serviço no Fluig
        var RM_DATASERVER = "FinLANDataBR"; // DataServer alvo (Ex: Financeiro/Contas a Pagar)
        var RM_CODTDO = "DIV"; // Tipo de Documento no RM
        var RM_CODNAT = "1.01.01"; // Natureza Financeira/Orçamentária
        var RM_TIPO_MOVIMENTO = "XXX"; // Tipo de Movimento (Estoque) - Conforme PDF

        var numeroSolicitacao = getValue("WKNumProces");
        var cardData = hAPI.getCardData(numeroSolicitacao);
        
        var coligadaForm = cardData.get("empresaFilial");
        
        // Autenticação Segura (Single Source of Truth)
        var dsAuth = DatasetFactory.getDataset("ds_connector", null, null, null);
        if (dsAuth == null || dsAuth.rowsCount == 0) throw "Falha ao acessar ds_connector. Credenciais não encontradas.";
        var usuarioRM = dsAuth.getValue(0, "INTEGRADOR");
        var senhaRM = dsAuth.getValue(0, "SENHA");

        // Instancia o WebService Nativo
        var serviceProvider = ServiceManager.getServiceInstance(RM_SERVICO);
        if (serviceProvider == null) throw "Serviço '" + RM_SERVICO + "' não está cadastrado no Fluig.";
        var serviceLocator = serviceProvider.instantiate("com.totvs.IwsDataServer");
        var client = serviceProvider.getCustomClient(serviceLocator, "com.totvs.IwsDataServer", usuarioRM, senhaRM);

        var contexto = "CODSISTEMA=F;CODCOLIGADA=" + coligadaForm;

        // =========================================================
        // O Loop da Tabela Pai x Filho
        // =========================================================
        var keys = cardData.keySet().toArray();
        var integrouPeloMenosUm = false;

        for (var i = 0; i < keys.length; i++) {
            var fieldName = keys[i];
            
            // Se encontrou uma linha da tabela de sócios
            if (fieldName.match(/^nomeSocio___/)) {
                var linha = fieldName.split("___")[16];
                
                // Captura os dados exatos DESSA linha
                var cpfCnpjSocio = cardData.get("cpfCnpjSocio___" + linha);
                var valorAdiantamento = cardData.get("valorSocio___" + linha);
                var centroCustoRateio = cardData.get("centroCustoSocio___" + linha);
                // Para a data, extraímos do painel de execução financeira que já foi estruturado
                var dataVencimento = cardData.get("pagDataProgramada___" + linha); 
                
                // Se a dataVencimento estiver vazia, usa a data atual como fallback para não quebrar o XML
                if(dataVencimento == null || dataVencimento == "") {
                    var formatador = new java.text.SimpleDateFormat("yyyy-MM-dd");
                    dataVencimento = formatador.format(new java.util.Date());
                }

                // Removemos máscara do valor para o XML (Ex: 1.500,00 -> 1500.00)
                var valorFloat = valorAdiantamento.replace(/\./g, '').replace(',', '.');
                
                log.info("💰 Preparando Integração Sócio: " + cpfCnpjSocio + " | Valor: R$ " + valorFloat);

 
                var xmlPayload = "<FinLAN>";
                xmlPayload += "  <FLAN>";
                xmlPayload += "    <CODCOLIGADA>" + coligadaForm + "</CODCOLIGADA>";
                // Assumimos que o RM usa o CPF/CNPJ como Código do Fornecedor/Sócio (CODCFO)
                xmlPayload += "    <CODCFO>" + cpfCnpjSocio.replace(/\D/g, '') + "</CODCFO>"; 
                xmlPayload += "    <VALORORIGINAL>" + valorFloat + "</VALORORIGINAL>";
                xmlPayload += "    <DATAVENCIMENTO>" + dataVencimento + "T00:00:00</DATAVENCIMENTO>";
                xmlPayload += "    <DATAPREVISAO>" + dataVencimento + "T00:00:00</DATAPREVISAO>";
                xmlPayload += "    <CODCCUSTO>" + centroCustoRateio + "</CODCCUSTO>";
                xmlPayload += "    <CODTDO>" + RM_CODTDO + "</CODTDO>";
                xmlPayload += "    <CODNAT>" + RM_CODNAT + "</CODNAT>";
                xmlPayload += "    <NUMERODOCUMENTO>FLUIG-" + numeroSolicitacao + "</NUMERODOCUMENTO>";
                
                // O Histórico exigido pela página 37 do PDF de Engenharia de Processos
                xmlPayload += "    <HISTORICO>Adiantamento de Dividendos - Fluig " + numeroSolicitacao + "</HISTORICO>";
                xmlPayload += "  </FLAN>";
                xmlPayload += "</FinLAN>";

                log.info("📦 Payload gerado: " + xmlPayload);

                // Disparo contra o RM
                var resultadoRM = client.saveRecord(RM_DATASERVER, xmlPayload, contexto);
                log.info("🎯 Resposta do RM Totvs: " + resultadoRM);

                // Tratamento de Sucesso ou Erro do ERP
                if (resultadoRM.indexOf("Erro") > -1 || resultadoRM.indexOf("Exception") > -1) {
                    throw "O TOTVS RM recusou o Sócio " + cpfCnpjSocio + ". Retorno: " + resultadoRM;
                } else {
                    // Grava o ID do título gerado no RM no formulário (Para auditoria do painel Financeiro)
                    hAPI.setCardValue("pagProtocolo___" + linha, "RM ID: " + resultadoRM);
                    integrouPeloMenosUm = true;
                }
            }
        }
        
        if(integrouPeloMenosUm) {
            hAPI.setCardValue("statusIntegracaoRM", "INTEGRADO_SUCESSO");
        }
        
        log.info("✅ [ROBO FLUIG] INTEGRAÇÃO RM CONCLUÍDA COM SUCESSO!");
        return true; // Libera a catraca do BPMN para avançar

    } catch (error) {
        log.error("❌ [ROBO FLUIG] ERRO NA INTEGRAÇÃO RM: " + error);
        // O throw devolve o erro formatado na tela do usuário
        throw "Erro na Integração com TOTVS RM: " + error; 
    }
}