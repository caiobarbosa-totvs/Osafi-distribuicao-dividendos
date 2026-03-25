function createDataset(fields, constraints, sortFields) {
	
	var dataset = DatasetBuilder.newDataset();
	
	dataset.addColumn("CODCOLIGADA");
    dataset.addColumn("NOME");
    dataset.addColumn("ATIVO");
    dataset.addColumn("CNPJ");
    dataset.addColumn("BAIRRO");
	
	// ALTERAR SOMENTE OS PARAMETROS
	var codSentenca  = 'FLUIG.016',
		codAplicacao = 'T',
		codColigada  = '0'
		
	var codFilial    = ''; // parametros da sentença SQL
	

	for (var i = 0; i < constraints.length; i++) 
		if ( (constraints[i].fieldName).toLowerCase() == 'filial'    || 
			 (constraints[i].fieldName).toLowerCase() == 'codfilial' ) 
			codFilial = constraints[i].initialValue;
	
		else if ( (constraints[i].fieldName).toLowerCase() == 'codsentenca') 
				codSentenca = constraints[i].initialValue;
	
		else if ( (constraints[i].fieldName).toLowerCase() == 'codaplicacao') 
				codAplicacao = constraints[i].initialValue;
	
		else if ( (constraints[i].fieldName).toLowerCase() == 'codcoligada') 
				codColigada = constraints[i].initialValue;

	var campos = new Array("CODCOLIGADA","NOME","ATIVO","CNPJ","BAIRRO");
	
	var params = new Array();
		params.push( DatasetFactory.createConstraint("CODSENTENCA" ,codSentenca ,codSentenca ,ConstraintType.MUST) );
		params.push( DatasetFactory.createConstraint("CODAPLICACAO",codAplicacao,codAplicacao,ConstraintType.MUST) );
		
	if(codColigada!=='')
		params.push( DatasetFactory.createConstraint("CODCOLIGADA" ,codColigada ,codColigada ,ConstraintType.MUST) );
	
	if(codFilial!=='')
		params.push( DatasetFactory.createConstraint("CODIGO"    ,codFilial   ,codFilial   ,ConstraintType.MUST) );
	
	var datasetRM = DatasetFactory.getDataset("ds_generic_rm_sql", campos,params, null);
	
	if (datasetRM == null || datasetRM == undefined) 
		throw "Ocorreu um erro ao executar a consulta ao RM. Favor entrar em contato com a equipe de TI.";

	else if (datasetRM.rowsCount < 1) 
		throw "Não foram encontrados resultados para sua pesquisa.";
	
	else {
		for (var i = 0; i < datasetRM.rowsCount; i++){
			
			var COLIGADA = datasetRM.getValue(i, "CODCOLIGADA");
			var NOME   = datasetRM.getValue(i, "NOME");
			var ATIVO     = datasetRM.getValue(i, "ATIVO");
			var CNPJ     = datasetRM.getValue(i, "CNPJ");
			var BAIRRO     = datasetRM.getValue(i, "BAIRRO");
			
			dataset.addRow(new Array(COLIGADA,NOME,ATIVO,CNPJ,BAIRRO));
		}

		return dataset;
	}

	return null;

}