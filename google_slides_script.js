/**
 * JUSCORE AI - GOOGLE SLIDES AUTOMATOR
 * 
 * INSTRUÇÕES:
 * 1. Acesse slides.new
 * 2. Vá em Extensões -> Apps Script
 * 3. Cole este código e clique em "Executar"
 * 4. Autorize as permissões necessárias
 * 5. Veja sua apresentação ser criada automaticamente!
 */

function createJuscorePitch() {
  var presentation = SlidesApp.getActivePresentation();
  var slides = presentation.getSlides();
  
  // Limpar slides existentes (opcional)
  while (slides.length > 0) {
    slides[0].remove();
    slides = presentation.getSlides();
  }

  // --- SLIDE 1: TÍTULO ---
  var slide1 = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE);
  slide1.getShapes()[0].getText().setText("Juscore AI").getTextStyle().setForegroundColor("#d4af37").setBold(true);
  slide1.getShapes()[1].getText().setText("A Revolução da Advocacia Inteligente\nTransformando o Direito através da IA");

  // --- SLIDE 2: O PROBLEMA ---
  var slide2 = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);
  slide2.getShapes()[0].getText().setText("O Problema: O Caos Jurídico");
  slide2.getShapes()[1].getText().setText(
    "• Morosidade Judiciária: Processos que levam anos.\n" +
    "• Burocracia Extrema: Horas gastas em redação repetitiva.\n" +
    "• Gestão Fragmentada: Perda de prazos e desorganização.\n" +
    "• Custo Operacional Alto: Necessidade de grandes equipes para tarefas básicas."
  );

  // --- SLIDE 3: A SOLUÇÃO ---
  var slide3 = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);
  slide3.getShapes()[0].getText().setText("A Solução: Juscore AI");
  slide3.getShapes()[1].getText().setText(
    "• Copiloto Jurídico 24/7: Respostas precisas e fundamentadas.\n" +
    "• Automação Inteligente: Geração de petições e contratos em segundos.\n" +
    "• Monitoramento Ativo: Integração direta com DOU e Planalto.\n" +
    "• Inteligência Centralizada: Tudo o que um advogado precisa em um só lugar."
  );

  // --- SLIDE 4: PRINCIPAIS RECURSOS ---
  var slide4 = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);
  slide4.getShapes()[0].getText().setText("Tecnologia de Ponta");
  slide4.getShapes()[1].getText().setText(
    "• Chat com Llama 3.1 & Groq: Velocidade recorde de processamento.\n" +
    "• Biblioteca de Modelos: Geração de documentos via variáveis automatizadas.\n" +
    "• Painel Admin & ERP: Gestão completa de equipe e produtividade.\n" +
    "• Visão Computacional: Análise profunda de PDFs e documentos anexos."
  );

  // --- SLIDE 5: MODELO DE NEGÓCIO ---
  var slide5 = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);
  slide5.getShapes()[0].getText().setText("Business Model (SaaS)");
  slide5.getShapes()[1].getText().setText(
    "• Estudante Basic: R$ 17,90/mês (Início de carreira).\n" +
    "• Advogado Starter: R$ 127,00/mês (Solo).\n" +
    "• Advogado Growth: R$ 147,00/mês (Equipes).\n" +
    "• Escritório Master: R$ 497,00/mês (Controle total).\n" +
    "• Enterprise: Sob consulta (Customizado)."
  );

  // --- SLIDE 6: PROJEÇÃO FINANCEIRA (V1.6.5) ---
  var slide6 = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);
  slide6.getShapes()[0].getText().setText("Viabilidade e Crescimento");
  slide6.getShapes()[1].getText().setText(
    "• Margem de Lucro Média: 95% a 99%.\n" +
    "• ROI Infinito: Custos operacionais mínimos (Cloud/API).\n" +
    "• Escalabilidade: Pronto para suportar milhares de usuários.\n" +
    "• Break-even Acelerado: Baixo investimento inicial."
  );

  // --- SLIDE 7: VISÃO DE FUTURO ---
  var slide7 = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);
  slide7.getShapes()[0].getText().setText("Onde Queremos Chegar");
  slide7.getShapes()[1].getText().setText(
    "• App Mobile Nativo: O escritório no seu bolso.\n" +
    "• Busca Vetorial Avançada: Pesquisa jurisprudencial instantânea.\n" +
    "• Integração Global: Expansão para outros sistemas jurídicos.\n" +
    "• Justiça para Todos: Democratização do acesso ao auxílio jurídico."
  );

  // --- SLIDE 8: CHAMADA PARA AÇÃO ---
  var slide8 = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE);
  slide8.getShapes()[0].getText().setText("Juscore AI").getTextStyle().setForegroundColor("#d4af37");
  slide8.getShapes()[1].getText().setText("Vamos transformar o Direito juntos?\nContato: [SEU EMAIL/SITE]");

  Logger.log("Pitch criado com sucesso!");
}
