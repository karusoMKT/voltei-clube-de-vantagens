# Revisão de segurança
- [x] Conferir permissões, funções e armazenamento reais.
- [x] Mostrar SQL e aplicar correções de acesso sem novas funcionalidades.
- [x] Testar bloqueios e acessos permitidos; registrar resultado (33 testes aprovados).

# Pontos por foto
- [x] Proteger envios, limites diários e aprovação atômica no Supabase.
- [x] Criar envio com prévia e revisão dos prints no visual do Voltei.
- [x] Testar regras e fluxo completo: 7 testes de acesso reais; envio, recusa, aprovação, +30 pontos e bloqueio diário verificados.

# Prêmios e Resumo da empresa
- [x] Proteger edição de regras e prêmios pela equipe da própria loja.
- [x] Completar lista de prêmios, retorno e cadastro.
- [x] Completar indicadores mensais e contatos dos clientes ausentes.
- [x] Testar cálculos, isolamento e fluxos reais: 7 testes locais e 6 de acesso reais; regra, cadastro, ativação, resumo e mensagem de WhatsApp verificados.
- [x] Área /admin com planos (Básico, Profissional, Premium), MRR, nova empresa e acesso do dono; bloqueio por plano no painel da empresa.

# Sessão e botão Sair
- [x] Botão Sair no topo da tela /caixa: encerra a sessão, limpa o cache e volta para a entrada.
- [x] Redirecionar na entrada só com sessão ativa e válida; depois de Sair a tela de login permanece aberta.
- [x] Testar: 37 testes aprovados; entrada, Sair e botão Voltar verificados no app.
- [x] Botão Sair também no cabeçalho de /empresa, /cliente e /admin, com o mesmo padrão visual.
- [x] Testar nas três áreas: entrada, Sair e botão Voltar verificados; 37 testes aprovados.

## Prêmios: limite Básico, sugestão e edição
- [x] Limite 3 ativos no Básico, sugestão 5%, editar prêmio

## Pesquisa de satisfação Premium
- [x] Adicionar configuração e pesquisa interna com pontos atômicos, uma resposta por cliente/loja.
- [x] Configuração do dono, notas 1–5 do cliente e convite opcional ao Google sem seleção por nota.
- [x] Executar suíte e verificar entrada e proteção da página em computador/celular. Fluxo autenticado não verificado: Supabase externo sem sessão disponível; testes de acesso reais são opt-in.

## Multi-loja e logos
- [x] Adicionar cidade, logos, descoberta segura e participação com zero pontos.
- [x] Cadastro/edição de empresas com logo e cidade; cabeçalhos com identidade da loja.
- [x] Carteira com seleção de loja, prêmios, fotos e extrato separados; vitrine de lojas ativas.
- [x] Testar suíte e fluxos disponíveis: 51 aprovados, 46 testes reais ignorados sem tokens; entrada mobile e proteção verificadas.
- [ ] Verificar participação, troca de loja e upload autenticados: sessão indisponível no Supabase externo.
- [ ] Liberar bucket público company-logos: bloqueado pela configuração do workspace.

## Auditoria Advisor Supabase
- [x] Inventariar 20 avisos atuais, RLS, funções, permissões e armazenamento.
- [x] Mostrar SQL e aplicar bloqueio de helper interno e permissões mínimas da pesquisa, preservando RPCs autorizadas.
- [x] Validar 9 invariantes no banco: RLS, search_path, bloqueios, leitura da pesquisa e prints privados; suíte com 48 aprovados e 43 testes reais ignorados por falta de tokens.
- [ ] Proteção de senhas vazadas: depende de configuração no Supabase externo e compatibilidade com PIN de 6 dígitos.
