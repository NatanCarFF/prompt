// painel-prompt/js/main.js

/**
 * Módulo principal da aplicação, responsável por inicializar
 * e coordenar a interação entre a UI e o armazenamento de dados,
 * incluindo o gerenciamento de temas e funcionalidades de CRUD aprimoradas.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // --- Inicialização do Tema ---
    const savedTheme = ui.loadThemePreference();
    ui.applyTheme(savedTheme); // Aplica o tema salvo (ou 'light' como padrão) ao carregar a página

    // --- Carregamento Otimizado de Marked.js ---
    // Carrega a biblioteca Marked.js antecipadamente, mas sem bloquear a renderização inicial.
    // Isso é útil para que o modo de visualização renderizado funcione imediatamente nos cards já salvos.
    try {
        await ui.loadMarkedJs();
        console.log('Marked.js carregado com sucesso.');
    } catch (error) {
        console.error('Falha ao carregar Marked.js:', error);
        ui.showFeedbackMessage('Erro ao carregar o renderizador de Markdown. A visualização renderizada pode não funcionar.', 'error');
    }

    // --- Carregamento e Renderização Inicial dos Prompts ---
    let prompts = storage.loadPrompts();
    ui.renderPrompts(prompts);

    // --- Event Listeners ---

    // Evento para salvar ou atualizar um prompt
    ui.elements.savePromptBtn.addEventListener('click', () => {
        // Valida os campos antes de continuar
        if (!ui.validateForm()) {
            ui.showFeedbackMessage('Por favor, corrija os erros no formulário.', 'error');
            return;
        }

        const id = ui.elements.promptIdInput.value.trim();
        const title = ui.elements.promptTitleInput.value.trim();
        const content = ui.elements.promptContentTextarea.value.trim();
        const tagsString = ui.elements.promptTagsInput.value.trim();
        const tags = tagsString ? tagsString.split(',').map(tag => tag.trim().replace(/^#/, '')).filter(tag => tag !== '') : []; // Processa tags

        if (id) {
            // Modo de Edição: Atualiza prompt existente
            const updatedPrompt = { id, title, content, tags };
            prompts = storage.updatePrompt(updatedPrompt); // storage.updatePrompt já retorna a lista atualizada
            ui.renderPrompts(prompts, ui.elements.searchPromptsInput.value.trim()); // Re-renderiza a lista completa
            ui.showFeedbackMessage('Prompt atualizado com sucesso!', 'success');
        } else {
            // Modo de Criação: Salva novo prompt
            const newPrompt = {
                id: ui.generateUniqueId(),
                title: title,
                content: content,
                tags: tags
            };
            prompts.push(newPrompt); // Adiciona o novo prompt ao array local
            storage.savePrompts(prompts); // Salva o array atualizado no Local Storage
            ui.addPromptToUI(newPrompt); // Adiciona e renderiza o novo prompt na UI (já faz renderPrompts)
            ui.showFeedbackMessage('Prompt salvo com sucesso!', 'success');
        }
        ui.clearForm(); // Limpa os campos do formulário e redefine botões
    });

    // Evento para cancelar a edição
    ui.elements.cancelEditBtn.addEventListener('click', () => {
        ui.clearForm(); // Apenas limpa o formulário e reverte o estado dos botões
        ui.showFeedbackMessage('Edição cancelada.', 'info');
    });

    // Evento para exportar os dados
    ui.elements.exportDataBtn.addEventListener('click', () => {
        storage.exportData();
        ui.showFeedbackMessage('Dados exportados como prompts_export.json!', 'success');
    });

    // Evento para importar dados (aciona o clique no input de arquivo oculto)
    ui.elements.importDataBtn.addEventListener('click', () => {
        ui.elements.importFileInput.click(); // Simula o clique no input de arquivo
    });

    // Evento quando um arquivo é selecionado para importação
    ui.elements.importFileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                const importedPrompts = await storage.importData(file);
                prompts = importedPrompts; // Atualiza o array local com os prompts importados
                ui.renderPrompts(prompts, ui.elements.searchPromptsInput.value.trim()); // Re-renderiza a UI
                ui.showFeedbackMessage('Dados importados com sucesso!', 'success');
            } catch (error) {
                console.error("Erro na importação:", error);
                ui.showFeedbackMessage(`Erro ao importar dados: ${error.message}`, 'error');
            }
        }
        // Limpa o valor do input file para permitir que o mesmo arquivo seja selecionado novamente
        event.target.value = '';
    });

    // Event Listener para Troca de Tema
    ui.elements.themeSelect.addEventListener('change', (event) => {
        const selectedTheme = event.target.value;
        ui.applyTheme(selectedTheme); // Aplica o novo tema escolhido
        ui.showFeedbackMessage(`Tema "${selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1)}" aplicado!`);
    });

    // Event Listener para a Busca/Filtro
    let searchTimeout;
    ui.elements.searchPromptsInput.addEventListener('input', (event) => {
        clearTimeout(searchTimeout); // Limpa o timeout anterior
        searchTimeout = setTimeout(() => {
            const searchTerm = event.target.value.trim();
            ui.renderPrompts(prompts, searchTerm); // Re-renderiza com o filtro
        }, 300); // Pequeno delay para evitar re-renderizar a cada tecla digitada
    });
});