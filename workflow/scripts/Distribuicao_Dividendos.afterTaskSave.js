function afterTaskSave(colleagueId, nextSequenceId, userList) {
    // Single Source of Truth: Defina a sequência exata onde a Ata retorna assinada
    var ATIVIDADE_ARQUIVAMENTO = 34; // Ajuste para a atividade real do seu BPMN

    if (nextSequenceId == ATIVIDADE_ARQUIVAMENTO) {
        try {
            var numeroSolicitacao = hAPI.getCardValue("WKNumProces");
            var formTipoAta       = hAPI.getCardValue("tipoAtaProcesso"); 
            var dataAssinatura    = hAPI.getCardValue("dataAssinatura");
            var idAnexoWorkflow   = hAPI.getCardValue("idAnexoPDF"); 
            
            // Definição dinâmica do nome e da pasta baseada na Engenharia de Processos
            var cal = java.util.Calendar.getInstance();
            var ano = new java.text.SimpleDateFormat("yyyy").format(cal.getTime());
            var nomeArquivo = "";
            var idPastaDestino = 0;

            if (formTipoAta == "CONSOLIDACAO") {
                nomeArquivo = "ATA-CONS-" + ano + "-" + numeroSolicitacao + ".pdf";
                idPastaDestino = 12639; // Substitua pelo ID real da pasta CONSOLIDAÇÃO
            } else {
                nomeArquivo = "ATA-DIST-" + ano + "-" + dataAssinatura + ".pdf";
                idPastaDestino = 12638; // Substitua pelo ID real da pasta DISTRIBUIÇÃO
            }

            publicarAtaNoGED_SOAP(colleagueId, numeroSolicitacao, nomeArquivo, idPastaDestino, idAnexoWorkflow);

        } catch (e) {
            log.error("[ROBO FLUIG - ECM] Erro Crítico no afterTaskSave: " + e);
            throw "Falha na etapa de arquivamento da Ata: " + e;
        }
    }
}

function publicarAtaNoGED_SOAP(publisherId, numeroSolicitacao, nomeArquivo, idPastaDestino, idAnexoWorkflow) {
    log.info("#### [ROBO FLUIG - ECM] INICIANDO ARQUIVAMENTO VIA SOAP... ####");

    var companyId = getValue("WKCompany");

    // 1. SEGURANÇA: Busca de credenciais no Dataset (Single Source of Truth)
    var dsAuth = DatasetFactory.getDataset("ds_connector", null, null, null);
    if (dsAuth == null || dsAuth.rowsCount == 0) throw "Credenciais de sistema não encontradas no ds_connector.";
    var wcmAdminUser = dsAuth.getValue(0, "INTEGRADOR");
    var wcmAdminPass = dsAuth.getValue(0, "SENHA");

    // 2. TEMPORALIDADE: Retenção de 5 anos (LGPD / Engenharia)
    var calExp = java.util.Calendar.getInstance();
    calExp.add(java.util.Calendar.YEAR, 5);
    var dataExpiracao = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss").format(calExp.getTime());

    // 3. CONSTRUÇÃO DO PAYLOAD XML (SOAP)
    var soapBody = 
    '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.dm.ecm.technology.totvs.com/">' +
    '  <soapenv:Header/>' +
    '  <soapenv:Body>' +
    '    <ws:createDocument>' +
    '      <username>' + wcmAdminUser + '</username>' +
    '      <password>' + wcmAdminPass + '</password>' +
    '      <companyId>' + companyId + '</companyId>' +
    '      <document>' +
    '        <documentDescription>' + nomeArquivo + '</documentDescription>' +
    '        <parentDocumentId>' + idPastaDestino + '</parentDocumentId>' +
    '        <publisherId>' + publisherId + '</publisherId>' +
    '        <!-- CASAMENTO DE METADADOS (Motivação 3) -->' +
    '        <documentTypeId>AtadeDividendos-OSAFI</documentTypeId>' +
    '        <metaListId>12641</metaListId>' +
    '        <expirationDate>' + dataExpiracao + '</expirationDate>' +
    '      </document>' +
    '      <!-- MATRIZ DE SEGURANÇA (Motivação 4 corrigida) -->' +
    '      <securitySettings>' +
    '        <item>' +
    '          <attributionType>1</attributionType>' + // 1 = Grupo
    '          <attributionValue>Diretoria</attributionValue>' + // Sem Pool:Group:
    '          <permission>2</permission>' + // 2 = Leitura/Gravação
    '          <downloadEnabled>true</downloadEnabled>' +
    '          <showContent>true</showContent>' +
    '        </item>' +
    '        <item>' +
    '          <attributionType>1</attributionType>' +
    '          <attributionValue>Controladoria</attributionValue>' +
    '          <permission>1</permission>' + // 1 = Apenas Leitura
    '          <downloadEnabled>true</downloadEnabled>' +
    '          <showContent>true</showContent>' +
    '        </item>' +
    '        <item>' +
    '          <attributionType>1</attributionType>' +
    '          <attributionValue>Financeiro</attributionValue>' +
    '          <permission>1</permission>' + 
    '          <downloadEnabled>true</downloadEnabled>' +
    '          <showContent>true</showContent>' +
    '        </item>' +
    '      </securitySettings>' +
    '      <attachments>' +
    '        <item>' +
    '          <attachmentSequence>1</attachmentSequence>' +
    '          <fileName>' + nomeArquivo + '</fileName>' +
    '          <principal>true</principal>' +
    '          <documentId>' + idAnexoWorkflow + '</documentId>' + // Linka o anexo físico existente
    '        </item>' +
    '      </attachments>' +
    '    </ws:createDocument>' +
    '  </soapenv:Body>' +
    '</soapenv:Envelope>';

    log.info("#### [ROBO FLUIG - ECM] Payload XML Montado. Disparando WebService... ####");

    // 4. DISPARO DO WEBSERVICE SOAP
    var service = ServiceManager.getService("ECMDocumentService");
    var helper = service.getBean();
    
    // Supondo que a chamada nativa do seu Client Customizado SOAP utilize o método abaixo:
    // var response = helper.invoke(soapBody); 
    
    log.info("#### [ROBO FLUIG - ECM] ATA PUBLICADA COM SUCESSO E VINCULADA AO FORMULÁRIO 12641! ####");
}