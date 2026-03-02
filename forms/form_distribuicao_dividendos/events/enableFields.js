function enableFields(form) {

    // 1. Captura a atividade atual do processo
    var atividadeAtual = getValue("WKNumState") != null ? getValue("WKNumState") : 0;

    // Converte para string para facilitar comparações (caso venha do Eclipse como texto)
    atividadeAtual = atividadeAtual.toString();

    if (atividadeAtual == "Task_AprovConselho" || atividadeAtual == 4) {

        // 1. Bloqueia os campos fixos da aba Planejamento Financeiro
        form.setEnabled("anoReferencia", false);
        form.setEnabled("regimeTributario", false);
        form.setEnabled("receitaBruta", false);
        form.setEnabled("basePresumida", false);
        form.setEnabled("origemLucro", false);
        form.setEnabled("valorProposto", false);
        form.setEnabled("centroCusto", false);

        // 2. Bloqueia os campos da tabela Pai x Filho (Distribuição por Sócio)
        var indicesSocios = form.getChildrenIndexes("tabela_socios");

        for (var i = 0; i < indicesSocios.length; i++) {
            var linha = indicesSocios[i];
            form.setEnabled("nomeSocio___" + linha, false);
            form.setEnabled("cpfCnpjSocio___" + linha, false);
            form.setEnabled("percSocio___" + linha, false);
            form.setEnabled("valorSocio___" + linha, false);
            form.setEnabled("dadosBancariosSocio___" + linha, false);
        }
    } else if (atividadeAtual == "Task_AvalTecnica" || atividadeAtual == 6) {

        // 1. Bloqueia os campos fixos da aba Planejamento Financeiro
        form.setEnabled("anoReferencia", false);
        form.setEnabled("regimeTributario", false);
        form.setEnabled("receitaBruta", false);
        form.setEnabled("basePresumida", false);
        form.setEnabled("origemLucro", false);
        form.setEnabled("valorProposto", false);
        form.setEnabled("centroCusto", false);

        // 2. Bloqueia os campos da tabela Pai x Filho (Distribuição por Sócio)
        var indicesSocios = form.getChildrenIndexes("tabela_socios");
        for (var i = 0; i < indicesSocios.length; i++) {
            var linha = indicesSocios[i];
            form.setEnabled("nomeSocio___" + linha, false);
            form.setEnabled("cpfCnpjSocio___" + linha, false);
            form.setEnabled("percSocio___" + linha, false);
            form.setEnabled("valorSocio___" + linha, false);
            form.setEnabled("dadosBancariosSocio___" + linha, false);
        }

        // 3. Bloqueia os campos da Diretoria (Para a Controladoria não alterar o parecer dos Diretores)
        form.setEnabled("decisaoDiretoria", false);
        form.setEnabled("motivoRejeicaoDir", false);
        form.setEnabled("obsDiretoria", false);
    } else {
        var etapasAta = ["Task_SolAta", "Task_AssinAta"];
        var etapasFinanceiro = [
            "Task_ProvFinan", "Task_ProgPagamento", "Task_ValPagamento",
            "Task_ConcFinan", "Task_AnexaComp", "Task_ConcContabil",
            "Task_ProgPagRegular", "Task_ConcFinRegular"
        ];

        if (etapasAta.indexOf(atividadeAtual) > -1 || etapasFinanceiro.indexOf(atividadeAtual) > -1) {
            form.setEnabled("anoReferencia", false);
            form.setEnabled("regimeTributario", false);
            form.setEnabled("receitaBruta", false);
            form.setEnabled("basePresumida", false);
            form.setEnabled("origemLucro", false);
            form.setEnabled("valorProposto", false);
            form.setEnabled("centroCusto", false);

            var indicesSocios = form.getChildrenIndexes("tabela_socios");
            for (var i = 0; i < indicesSocios.length; i++) {
                var linha = indicesSocios[i];
                form.setEnabled("nomeSocio___" + linha, false);
                form.setEnabled("cpfCnpjSocio___" + linha, false);
                form.setEnabled("percSocio___" + linha, false);
                form.setEnabled("valorSocio___" + linha, false);
                form.setEnabled("dadosBancariosSocio___" + linha, false);
            }

            form.setEnabled("decisaoDiretoria", false);
            form.setEnabled("motivoRejeicaoDir", false);
            form.setEnabled("obsDiretoria", false);

            form.setEnabled("checkRegime", false);
            form.setEnabled("checkDctf", false);
            form.setEnabled("checkLei9249", false);
            form.setEnabled("decisaoControladoria", false);
            form.setEnabled("parecerControladoria", false);

            if (etapasFinanceiro.indexOf(atividadeAtual) > -1) {
                form.setEnabled("dataAta", false);
                form.setEnabled("localAta", false);
                form.setEnabled("horarioAta", false);
                form.setEnabled("periodoReferenciaAta", false);
                form.setEnabled("resultadoLiquido", false);
                form.setEnabled("totalDisponivel", false);
                form.setEnabled("assinaturaRepresentante", false);
                form.setEnabled("assinaturaFinanceiro", false);
                form.setEnabled("justificativaAta", false);
            }
        }
    }
}