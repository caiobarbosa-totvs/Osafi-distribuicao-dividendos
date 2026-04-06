
/**
 * Arquivo contendo funções para geração de documentos PDF utilizando a biblioteca pdfmake.
 *
 * Apoio para montagem da estrutura
 * @see https://aymkdn.github.io/html-to-pdfmake/index.html
 *
 * Html to Pdf para os campo TextRich
 * @see https://github.com/Aymkdn/html-to-pdfmake
 */

const DIVIDER_TEXT = '____________________________________________________________________________________________________________________________________________________________________________________________________________________________________\n\n';

var PROCESS_TITLE = 'Solicitação de Lanche';
var PROCESS_ID = '019';

// === Impressão do formulário (PDF) ===
async function impressaoFormularioCompleto() {
  const base64Img = await imgToBase64Async('img-logo_sebrae.png');

  const solicitacao = getPrintField('PROTOCOLO');
  const dataSolic = getPrintField('DATA_SOLIC');

  const tabelaHistorico = getHistoricoProcesso(solicitacao);
  const tabelaClassificacaoOrcamentaria = getTabelaClassificacaoOrcamentaria();

  const dadosSolicitante = getDadosSolicitante();

  const dadosIniciais = getDadosIniciais();
  const dadosDetalhamento = getDadosDetalhamento();
  const dadosValores = getDadosValores();
  const dadosObservacoes = getDadosObservacoes();
  const dadosObservacoesUAL = getDadosObservacoesUAL();
  const dadosIntegracao = getDadosIntegracao(); // Renomeada (sem acento) e função reescrita abaixo
  const dadosNPS = getDadosNPS();

  // Obter atividade atual de forma segura (evita ReferenceError)
  let atividadeAtual = null;
  const atividadeCampo = getPrintField('atividade_atual');
  if (atividadeCampo && atividadeCampo.trim() !== '') {
    atividadeAtual = parseInt(atividadeCampo, 10);
  } else if (typeof infoWorkflow !== 'undefined' && infoWorkflow && typeof infoWorkflow.WKNumState !== 'undefined') {
    atividadeAtual = infoWorkflow.WKNumState;
  }

  const docContent = [];

  // Empurrar objetos individualmente (pdfmake não aceita arrays soltos como nós de content)

  // Dados do Solicitante
  docContent.push({
    fontSize: 12,
    text: 'Dados do Solicitante',
    margin: [0, 10, 0, 0],
  });
  docContent.push({
    fontSize: 5,
    text: DIVIDER_TEXT,
  });
  docContent.push(dadosSolicitante);

  // Dados iniciais
  docContent.push({
    fontSize: 12,
    text: 'Dados Iniciais',
    margin: [0, 10, 0, 0],
  });
  docContent.push({
    fontSize: 5,
    text: DIVIDER_TEXT,
  });
  docContent.push(...dadosIniciais);

  // Dados do Detalhamento
  docContent.push({
    fontSize: 12,
    text: 'Dados do Detalhamento',
    margin: [0, 10, 0, 0],
  });
  docContent.push({
    fontSize: 5,
    text: DIVIDER_TEXT,
  });
  docContent.push(...dadosDetalhamento);

  // Valores
  docContent.push({
    fontSize: 12,
    text: 'Valores',
    margin: [0, 10, 0, 0],
  });
  docContent.push({
    fontSize: 5,
    text: DIVIDER_TEXT,
  });
  docContent.push(...dadosValores);

  // Classificação Orçamentária
  docContent.push({
    text: 'Classificação Orçamentária',
    fontSize: 12,
    margin: [0, 10, 0, 0],
  });
  docContent.push({
    fontSize: 5,
    text: DIVIDER_TEXT,
  });
  docContent.push(tabelaClassificacaoOrcamentaria);

  // Observações
  docContent.push({
    fontSize: 12,
    text: 'Observações',
    margin: [0, 10, 0, 0],
  });
  docContent.push({
    fontSize: 5,
    text: DIVIDER_TEXT,
  });
  docContent.push(...dadosObservacoes);

  if (atividadeAtual !== null && [5, 25, 19].includes(atividadeAtual)) {
    // Observações UAL
    docContent.push({
      fontSize: 12,
      text: 'Observações UAL',
      margin: [0, 10, 0, 0],
    });
    docContent.push({
      fontSize: 5,
      text: DIVIDER_TEXT,
    });
    docContent.push(...dadosObservacoesUAL);

    // Dados da Integração
    docContent.push({
      fontSize: 12,
      text: 'Dados da Integração',
      margin: [0, 10, 0, 0],
    });
    docContent.push({
      fontSize: 5,
      text: DIVIDER_TEXT,
    });
    docContent.push(...dadosIntegracao);
  }

  if (atividadeAtual !== null && [25, 19].includes(atividadeAtual)) {
    // NPS
    docContent.push({
      fontSize: 12,
      text: 'NPS',
      margin: [0, 10, 0, 0],
    });
    docContent.push({
      fontSize: 5,
      text: DIVIDER_TEXT,
    });
    docContent.push(...dadosNPS);
  }

  // Histórico
  docContent.push({
    text: 'Histórico',
    fontSize: 12,
    margin: [0, 10, 0, 0],
  });
  docContent.push({
    fontSize: 5,
    text: DIVIDER_TEXT,
  });
  docContent.push(tabelaHistorico);

  // -----------

  var docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 135, 40, 90],
    header: function (currentPage, pageCount) {
      return {
        margin: [40, 10, 40, 0],
        table: {
          widths: ['*'],
          body: [
            [
              {
                columns: [
                  {
                    width: 120,
                    image: base64Img,
                    fit: [240, 38],
                    alignment: 'left',
                  },
                ],
              },
            ],
            [
              {
                columns: [
                  {
                    text: PROCESS_TITLE,
                    fontSize: 14,
                    bold: true,
                    alignment: 'center',
                    margin: [0, 0, 0, 10],
                  },
                ],
              },
            ],
            [
              {
                columns: [
                  {
                    fontSize: 8,
                    text: [
                      { fontSize: 8, text: 'SEBRAE-MG\n', bold: true },
                      { text: 'Av. Barao Homem de Melo, 329 - Nova Granada\n' },
                      { text: 'Belo Horizonte - MG\n' },
                      { text: 'CEP: 30431-285\n' },
                      { text: 'www.sebrae.com.br' },
                    ],
                  },
                  { text: ' ', width: 170 },
                  {
                    alignment: 'right',
                    fontSize: 10,
                    table: {
                      widths: [90, 80],
                      body: [
                        [{ text: 'Nº Fluig:' }, { text: solicitacao, bold: true }],
                        [{ text: 'Data Abertura:' }, { text: dataSolic, bold: true }],
                        [{ text: 'Folha:' }, { text: currentPage.toString() + ' / ' + pageCount, bold: true }],
                      ],
                    },
                    layout: {
                      hLineWidth: function () { return 0; },
                      vLineWidth: function () { return 0; },
                      paddingLeft: function () { return 0; },
                      paddingRight: function () { return 0; },
                      paddingTop: function () { return 0; },
                      paddingBottom: function () { return 0; },
                    },
                  },
                ],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: function () { return 0; },
          vLineWidth: function () { return 0; },
          paddingLeft: function () { return 0; },
          paddingRight: function () { return 0; },
          paddingTop: function () { return 0; },
          paddingBottom: function () { return 0; },
        },
      };
    },

    // Footer com estrutura válida (tabela/noBorders) em vez de arrays dentro de columns
    footer: function (currentPage, pageCount) {
      const userName = (typeof getCurrentUserName === 'function') ? getCurrentUserName() : (getPrintField('SOLIC') || 'Usuário');
      const dateStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();

      return {
        table: {
          widths: ['*', '*'],
          body: [
            [
              { text: PROCESS_ID + ' - ' + PROCESS_TITLE, alignment: 'left', fontSize: 8 },
              { text: 'Impresso Por: ' + userName + ' | Data e Hora: ' + dateStr, alignment: 'right', fontSize: 8 },
            ],
            [
              { text: 'Solicitação: ' + solicitacao, alignment: 'left', fontSize: 8 },
              { text: 'SEBRAE-MG', alignment: 'right', fontSize: 8 },
            ],
          ],
        },
        layout: 'noBorders',
        margin: [40, 10, 40, 0],
      };
    },

    content: docContent,

    info: {
      title: 'Impressão da Solicitação: ' + solicitacao,
      author: (typeof getCurrentUserName === 'function') ? getCurrentUserName() : (getPrintField('SOLIC') || 'Usuário'),
      subject: PROCESS_TITLE,
      keywords: 'PDF, Fluig, Solicitação de Lanche, UAL, RM, Datasul', // Keywords mais adequadas
      creationDate: new Date(),
      modificationDate: new Date(),
    },
  };

  // Definindo os anchors
  docDefinition.pageBreakBefore = function (currentNode) {
    return currentNode.anchor === 'newPage';
  };

  //Responsável por inserir estilização nos componentes do pdfMake
  docDefinition.styles = {
    tableFormatacao: {
      fontSize: 8,
      margin: [0, 5, 0, 5],
    },
    tableCabecalho: {
      bold: true,
      fontSize: 8,
      color: 'black',
    },
    data: {
      fontSize: 8,
      margin: [0, 0, 10, 0],
      alignment: 'left',
    },
    label: {
      fontSize: 8,
      margin: [0, 0, 0, 0],
      alignment: 'left',
      bold: true,
    },
    'html-p': {
      //Essa é uma classe que vem do textRich, que é o texto padrão
      //A fonte do padrão é muito grande, por isso diminuiu para 8.
      fontSize: 8,
      margin: [0, 0, 0, 0],
    },
  };

  //Marca d'agua
  docDefinition.background = function (currentPage, pageSize) {
    return {
      text: 'Cópia Controlada',
      color: '#ADD8E6',
      opacity: 0.2,
      bold: true,
      italics: false,
      fontSize: 60,
      alignment: 'center',
      margin: [0, pageSize.height / 2 - 30],
      rotate: -45,
    };
  };

  // Criando o PDF
  var pdfDoc = pdfMake.createPdf(docDefinition);

  // Exibindo o PDF em uma nova janela
  pdfDoc.getBlob(function (blob) {
    var url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Opcional: liberar depois de abrir
    // setTimeout(() => URL.revokeObjectURL(url), 30000);
  });
}

// === Funções de secções de layout - Específicos

function getDadosIniciais() {
  const content = [];

  content.push(
    {
      fontSize: 8,
      columns: [
        {
          width: '100%',
          table: {
            headerRows: 1,
            widths: ['*', '*'],
            body: [
              [
                { text: 'Nome da Reunião/Evento:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
                { text: 'Telefone para Contato:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
              ],
              [
                { text: getPrintField('txtNomeEvento'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
                { text: getPrintField('txtTelContato'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
              ],
            ],
          },
          layout: getDefaultTableLayout(),
        },
      ],
    },
    {
      fontSize: 8,
      columns: [
        {
          width: '100%',
          table: {
            headerRows: 1,
            widths: ['*'],
            body: [
              [{ text: 'Participante Externo?', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] }],
              [{ text: getPrintField('cmbParticipanteExterno'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] }],
              [{ text: 'Cardápio', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] }],
              [{ text: getPrintField('cmbCardapio'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] }],
            ],
          },
          layout: getDefaultTableLayout(),
        },
      ],
    }
  );

  return content;
}

function getDadosDetalhamento() {
  const content = [];

  const tblDetalhamentoIndexes = getTableIndexes('tblDetalhaEntrega');

  for (let i = 0; i < tblDetalhamentoIndexes.length; i++) {
    const index = tblDetalhamentoIndexes[i];

    content.push(
      {
        fontSize: 8,
        columns: [
          {
            width: '100%',
            table: {
              headerRows: 1,
              widths: ['*', '*', '*'],
              body: [
                [
                  { text: 'Local:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
                  { text: 'Data:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
                  { text: 'Horário:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
                ],
                [
                  { text: getPrintField('txtLocal___' + index), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
                  { text: getPrintField('txtDataEntrega___' + index), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
                  { text: getPrintField('txtHoraLanche___' + index), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
                ],
                [
                  { text: 'Quantidade de Participantes Externos:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
                  { text: 'Quantidade de Participantes Internos:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
                  { text: 'Total de Participantes:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
                ],
                [
                  { text: getPrintField('txtQuantidadePessoasExternas___' + index), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
                  { text: getPrintField('txtQuantidadePessoasInternas___' + index), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
                  { text: getPrintField('totalParticipantes___' + index), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
                ],
              ],
            },
            layout: getDefaultTableLayout(),
          },
        ],
      },
      {
        fontSize: 8,
        columns: [
          {
            width: '100%',
            table: {
              headerRows: 1,
              widths: ['*'],
              body: [
                [{ text: 'Detalhamento do Local:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] }],
                [{ text: getPrintField('detalhamentoLocal___' + index), bold: true, alignment: 'left', margin: [0, 3, 0, 3] }],
              ],
            },
            layout: getDefaultTableLayout(),
          },
        ],
      }
    );
  }

  return content;
}

function getDadosValores() {
  const content = [];

  content.push({
    fontSize: 8,
    columns: [
      {
        width: '100%',
        table: {
          headerRows: 1,
          widths: ['*', '*'],
          body: [
            [
              { text: 'Duração do Evento em Dias:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
              { text: 'Valor:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
            ],
            [
              { text: getPrintField('txtDiasDuracao'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
              { text: getPrintField('txtValor'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
            ],
          ],
        },
        layout: getDefaultTableLayout(),
      },
    ],
  });

  return content;
}

function getDadosObservacoes() {
  const content = [];

  content.push({
    fontSize: 8,
    columns: [
      {
        width: '100%',
        table: {
          headerRows: 1,
          widths: ['*'],
          body: [
            [{ text: 'Observações:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] }],
            [{ text: getPrintField('txtObservacoes'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] }],
          ],
        },
        layout: getDefaultTableLayout(),
      },
    ],
  });

  return content;
}

function getDadosObservacoesUAL() {
  const content = [];

  content.push({
    fontSize: 8,
    columns: [
      {
        width: '100%',
        table: {
          headerRows: 1,
          widths: ['*'],
          body: [
            [{ text: 'Observações UAL:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] }],
            [{ text: getPrintField('txtObservacoesUAL'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] }],
          ],
        },
        layout: getDefaultTableLayout(),
      },
    ],
  });

  return content;
}

// Função reescrita sem push aninhado e nome sem acento
function getDadosIntegracao() {
  const content = [];

  // Contrato 1
  content.push({ text: 'Contrato 1', fontSize: 16, bold: true });
  content.push({
    fontSize: 8,
    columns: [
      {
        width: '100%',
        table: {
          headerRows: 1,
          widths: ['*', '*', '*'],
          body: [
            [
              { text: 'Contrato:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
              { text: 'Vigência:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
              { text: 'Fornecedor:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
            ],
            [
              { text: getPrintField('cod_convenio1'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
              { text: getPrintField('data_ini_contrato1') + ' até ' + getPrintField('data_fim_contrato1'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
              { text: getPrintField('fornecedor1'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
            ],
            [
              { text: 'Pedido de Compra:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
              { text: 'Ordem(ns) de Compra:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
              {},
            ],
            [
              { text: getPrintField('num_pedido_compr1'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
              { text: getPrintField('numero_ordem1'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
              {},
            ],
            [
              { text: 'Controlado por Programação:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
              { text: 'Valor Por Pessoa:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
              { text: 'Valor Total:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
            ],
            [
              { text: getPrintField('txtCPSControladoProgramacao1'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
              { text: getPrintField('txtValorPorPessoa1'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
              { text: getPrintField('txtValorTotalCPS1'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
            ],
          ],
        },
        layout: getDefaultTableLayout(),
      },
    ],
  });

  // Contrato 2
  content.push({ text: 'Contrato 2', fontSize: 16, bold: true });
  content.push({
    fontSize: 8,
    columns: [
      {
        width: '100%',
        table: {
          headerRows: 1,
          widths: ['*', '*', '*'],
          body: [
            [
              { text: 'Contrato:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
              { text: 'Vigência:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
              { text: 'Fornecedor:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
            ],
            [
              { text: getPrintField('cod_convenio2'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
              { text: getPrintField('data_ini_contrato2') + ' até ' + getPrintField('data_fim_contrato2'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
              { text: getPrintField('fornecedor2'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
            ],
            [
              { text: 'Pedido de Compra:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
              { text: 'Ordem(ns) de Compra:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
              {},
            ],
            [
              { text: getPrintField('num_pedido_compr2'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
              { text: getPrintField('numero_ordem2'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
              {},
            ],
            [
              { text: 'Controlado por Programação:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
              { text: 'Valor Por Pessoa:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
              { text: 'Valor Total:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
            ],
            [
              { text: getPrintField('txtCPSControladoProgramacao2'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
              { text: getPrintField('txtValorPorPessoa2'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
              { text: getPrintField('txtValorTotalCPS2'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
            ],
          ],
        },
        layout: getDefaultTableLayout(),
      },
    ],
  });

  // Contrato 3
  content.push({ text: 'Contrato 3', fontSize: 16, bold: true });
  content.push({
    fontSize: 8,
    columns: [
      {
        width: '100%',
        table: {
          headerRows: 1,
          widths: ['*', '*', '*'],
          body: [
            [
              { text: 'Contrato:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
              { text: 'Vigência:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
              { text: 'Fornecedor:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
            ],
            [
              { text: getPrintField('cod_convenio3'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
              { text: getPrintField('data_ini_contrato3') + ' até ' + getPrintField('data_fim_contrato3'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
              { text: getPrintField('fornecedor3'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
            ],
            [
              { text: 'Pedido de Compra:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
              { text: 'Ordem(ns) de Compra:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
              {},
            ],
            [
              { text: getPrintField('num_pedido_compr3'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
              { text: getPrintField('numero_ordem3'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
              {},
            ],
            [
              { text: 'Controlado por Programação:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
              { text: 'Valor Por Pessoa:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
              { text: 'Valor Total:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] },
            ],
            [
              { text: getPrintField('txtCPSControladoProgramacao3'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
              { text: getPrintField('txtValorPorPessoa3'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
              { text: getPrintField('txtValorTotalCPS3'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] },
            ],
          ],
        },
        layout: getDefaultTableLayout(),
      },
    ],
  });

  return content;
}

function getDadosNPS() {
  const content = [];

  content.push({
    fontSize: 8,
    columns: [
      {
        width: '100%',
        table: {
          headerRows: 1,
          widths: ['*'],
          body: [
            [{ text: 'Avaliação em uma escala de 1 a 10:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] }],
            [{ text: getPrintField('txtAvaliacaoAtendimento'), bold: true, alignment: 'left', margin: [0, 3, 0, 3] }],
            [{ text: 'Comentário:', alignment: 'left', color: '#3e3e3e', margin: [0, 3, 5, 3] }],
            [{
	