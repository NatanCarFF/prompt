// painel-prompt/js/main.js

/**
 * Módulo principal da aplicação, responsável por inicializar
 * e coordenar a interação entre a UI e o armazenamento de dados.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Carrega os prompts existentes e os renderiza na UI ao iniciar
    let prompts = storage.loadPrompts();
    ui.renderPrompts(prompts);

    // --- Event Listeners ---

    // Evento para salvar um novo prompt
    ui.elements.savePromptBtn.addEventListener('click', () => {
        const title = ui.elements.promptTitleInput.value.trim();
        const content = ui.elements.promptContentTextarea.value.trim();

        if (title && content) {
            const newPrompt = {
                id: ui.generateUniqueId(), // Gera um ID único para o novo prompt
                title: title,
                content: content
            };

            prompts.push(newPrompt); // Adiciona o novo prompt ao array local
            storage.savePrompts(prompts); // Salva o array atualizado no Local Storage
            ui.addPromptToUI(newPrompt); // Adiciona e renderiza o novo prompt na UI
            ui.clearForm(); // Limpa os campos do formulário
            ui.showFeedbackMessage('Prompt salvo com sucesso!');
        } else {
            ui.showFeedbackMessage('Por favor, preencha o título e o conteúdo do prompt.', 'error');
        }
    });

    // Evento para exportar os dados
    ui.elements.exportDataBtn.addEventListener('click', () => {
        storage.exportData();
        ui.showFeedbackMessage('Dados exportados como prompts_export.json!');
    });

    // Evento para importar dados (aciona o clique no input de arquivo oculto)
    ui.elements.importDataBtn.addEventListener('click', () => {
        ui.elements.importFileInput.click(); // Simula o clique no input de arquivo
    });

    // Evento quando um arquivo é selecionado para importação
    ui.elements.importFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            storage.importData(file)
                .then(importedPrompts => {
                    prompts = importedPrompts; // Atualiza o array local com os prompts importados
                    ui.renderPrompts(prompts); // Re-renderiza a UI com os novos prompts
                    ui.showFeedbackMessage('Dados importados com sucesso!');
                })
                .catch(error => {
                    console.error("Erro na importação:", error);
                    ui.showFeedbackMessage(`Erro ao importar dados: ${error.message}`, 'error');
                });
        }
        // Limpa o valor do input file para permitir que o mesmo arquivo seja selecionado novamente
        event.target.value = '';
    });
});