// painel-prompt/js/main.js

/**
 * Módulo principal da aplicação, responsável por inicializar
 * e coordenar a interação entre a UI e o armazenamento de dados,
 * incluindo o gerenciamento de temas e funcionalidades de CRUD aprimoradas.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // --- Inicialização do Tema ---
    const savedTheme = ui.loadThemePreference();
    ui.applyTheme(savedTheme);

    // --- Carregamento Otimizado de Marked.js ---
    try {
        await ui.loadMarkedJs();
        console.log('Marked.js carregado com sucesso.');
    } catch (error) {
        console.error('Falha ao carregar Marked.js:', error);
        ui.showFeedbackMessage('Erro ao carregar o renderizador de Markdown. A visualização renderizada pode não funcionar.', 'error');
    }

    // --- Inicialização dos Listeners do Modal de Confirmação ---
    ui.initConfirmationModalListeners();

    // --- Carregamento e Renderização Inicial dos Prompts ---
    // A variável 'prompts' aqui deve ser o array mais recente do storage.
    let prompts = storage.loadPrompts();
    ui.renderPrompts(prompts); // Renderiza a lista inicial

    // --- Event Listeners ---

    // Evento para salvar ou atualizar um prompt
    ui.elements.savePromptBtn.addEventListener('click', () => {
        if (!ui.validateForm()) {
            ui.showFeedbackMessage('Por favor, corrija os erros no formulário.', 'error');
            return;
        }

        const id = ui.elements.promptIdInput.value.trim();
        const title = ui.elements.promptTitleInput.value.trim();
        const content = ui.elements.promptContentTextarea.value.trim();
        const tagsString = ui.elements.promptTagsInput.value.trim();
        const tags = tagsString ? tagsString.split(',').map(tag => tag.trim().replace(/^#/, '')).filter(tag => tag !== '') : [];

        let currentPrompts; // Variável para armazenar a lista atualizada de prompts

        if (id) {
            // Modo de Edição: Atualiza prompt existente
            const updatedPrompt = { id, title, content, tags };
            // storage.updatePrompt já retorna a lista atualizada.
            currentPrompts = storage.updatePrompt(updatedPrompt);
            ui.showFeedbackMessage('Prompt atualizado com sucesso!', 'success');
        } else {
            // Modo de Criação: Salva novo prompt
            const newPrompt = {
                id: ui.generateUniqueId(),
                title: title,
                content: content,
                tags: tags
            };
            // Carrega a lista atual, adiciona o novo e salva.
            // Isso garante que 'prompts' no main.js e a lista salva no storage estejam sempre sincronizadas.
            currentPrompts = storage.loadPrompts(); // Garante que você tenha a base mais recente
            currentPrompts.push(newPrompt);
            storage.savePrompts(currentPrompts);
            ui.showFeedbackMessage('Prompt salvo com sucesso!', 'success');
        }

        // Sempre re-renderiza a UI com a lista atualizada, seja para edição ou criação
        prompts = currentPrompts; // Atualiza a variável 'prompts' global do main.js
        ui.renderPrompts(prompts, ui.elements.searchPromptsInput.value.trim());

        ui.clearForm();
    });

    // Evento para cancelar a edição
    ui.elements.cancelEditBtn.addEventListener('click', () => {
        ui.clearForm();
        ui.showFeedbackMessage('Edição cancelada.', 'info');
    });

    // Evento para exportar os dados
    ui.elements.exportDataBtn.addEventListener('click', () => {
        storage.exportData();
        ui.showFeedbackMessage('Dados exportados como prompts_export.json!', 'success');
    });

    // Evento para importar dados (aciona o clique no input de arquivo oculto)
    ui.elements.importDataBtn.addEventListener('click', () => {
        ui.elements.importFileInput.click();
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
        ui.applyTheme(selectedTheme);
        ui.showFeedbackMessage(`Tema "${selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1)}" aplicado!`);
    });

    // Event Listener para a Busca/Filtro
    let searchTimeout;
    ui.elements.searchPromptsInput.addEventListener('input', (event) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = event.target.value.trim();
            // Sempre usa a variável 'prompts' mais recente do main.js (que foi atualizada pelo save/update)
            ui.renderPrompts(prompts, searchTerm);
        }, 300);
    });
});