function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();

    // 1. Criação das colunas idênticas ao modelo de produção
    dataset.addColumn("CPF_CNPJ");
    dataset.addColumn("NOME_SOCIO");
    dataset.addColumn("BANCO");
    dataset.addColumn("AGENCIA");
    dataset.addColumn("CONTA");
    dataset.addColumn("STATUS_BLOQUEIO"); // Coluna crucial para a trava de Compliance no JS

    // 2. Injeção de Dados Genéricos (Mocks)
    
    // Sócio 1: Caminho Feliz (Sem bloqueios)
    dataset.addRow(new Array(
        "111.222.333-44", 
        "CARLOS ALBERTO SILVA", 
        "BANCO DO BRASIL", 
        "1234", 
        "55667-8", 
        "NAO"
    ));

    // Sócio 2: Pessoa Jurídica (Holding)
    dataset.addRow(new Array(
        "99.888.777/0001-66", 
        "HOLDING INVESTIMENTOS S/A", 
        "ITAU", 
        "4321", 
        "11223-4", 
        "NAO"
    ));

    // Sócio 3: Sócio com bloqueio (Para testarmos a validação de Front-end)
    dataset.addRow(new Array(
        "555.666.777-88", 
        "MARCOS ANTONIO (BLOQUEADO)", 
        "BRADESCO", 
        "0001", 
        "99999-9", 
        "SIM" // O JS do formulário vai ler isso e impedir a inclusão na tabela!
    ));

    return dataset;
}