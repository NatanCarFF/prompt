// painel-prompt/js/storage.js

/**
 * Módulo para gerenciar o armazenamento e recuperação de dados de prompts
 * usando o Local Storage do navegador.
 */
const storage = (function() {
    const LOCAL_STORAGE_KEY = 'prompt_engineering_panel_prompts';

    /**
     * Carrega os prompts do Local Storage.
     * @returns {Array} Um array de objetos prompt, ou um array vazio se nenhum prompt for encontrado.
     */
    function loadPrompts() {
        try {
            const data = localStorage.getItem(LOCAL_STORAGE_KEY);
            // Retorna os dados parseados. Se for nulo ou inválido, retorna um array vazio.
            // Garante que o ID e a ordem sejam consistentes.
            return data ? JSON.parse(data).map(prompt => ({
                id: prompt.id,
                title: prompt.title,
                content: prompt.content,
                // Garante que 'tags' sempre exista, mesmo que vazia, e seja um array
                tags: Array.isArray(prompt.tags) ? prompt.tags : (typeof prompt.tags === 'string' ? prompt.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : [])
            })) : [];
        } catch (e) {
            console.error("Erro ao carregar prompts do Local Storage:", e);
            // Em caso de erro, limpa o Local Storage para evitar futuros problemas
            // e retorna um array vazio.
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            return [];
        }
    }

    /**
     * Salva o array de prompts no Local Storage.
     * @param {Array} prompts - O array de objetos prompt a ser salvo.
     */
    function savePrompts(prompts) {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(prompts));
        } catch (e) {
            console.error("Erro ao salvar prompts no Local Storage:", e);
            // Poderia adicionar uma mensagem de feedback ao usuário aqui
        }
    }

    /**
     * Exporta os prompts salvos para um arquivo JSON.
     */
    function exportData() {
        const prompts = loadPrompts();
        const dataStr = JSON.stringify(prompts, null, 2); // null, 2 para formatação bonita
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'prompts_export.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Libera o URL do objeto
    }

    /**
     * Importa prompts de um arquivo JSON.
     * @param {File} file - O objeto File selecionado pelo usuário.
     * @returns {Promise<Array>} Uma Promise que resolve com o array de prompts importados.
     */
    function importData(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                return reject(new Error("Nenhum arquivo selecionado."));
            }
            if (file.type !== "application/json") {
                return reject(new Error("Por favor, selecione um arquivo JSON válido."));
            }

            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const importedPrompts = JSON.parse(event.target.result);

                    // Validação básica dos dados importados
                    if (!Array.isArray(importedPrompts)) {
                        throw new Error("O arquivo JSON não contém um array de prompts válido.");
                    }

                    // Mapeia para garantir a estrutura correta (com tags) e remover duplicatas por ID
                    const existingPrompts = loadPrompts();
                    const newPromptsMap = new Map();

                    // Adiciona os prompts existentes ao mapa
                    existingPrompts.forEach(p => newPromptsMap.set(p.id, p));

                    // Adiciona/atualiza os prompts importados
                    importedPrompts.forEach(p => {
                        if (p && typeof p.id === 'string' && typeof p.title === 'string' && typeof p.content === 'string') {
                             // Garante que 'tags' seja um array
                            p.tags = Array.isArray(p.tags) ? p.tags : (typeof p.tags === 'string' ? p.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : []);
                            newPromptsMap.set(p.id, p);
                        } else {
                            console.warn("Prompt inválido encontrado no arquivo JSON importado, ignorando:", p);
                        }
                    });

                    const finalPrompts = Array.from(newPromptsMap.values());
                    savePrompts(finalPrompts);
                    resolve(finalPrompts);

                } catch (e) {
                    console.error("Erro ao analisar/processar arquivo JSON:", e);
                    reject(new Error(`Erro ao importar o arquivo: ${e.message}`));
                }
            };

            reader.onerror = () => {
                reject(new Error("Erro ao ler o arquivo."));
            };

            reader.readAsText(file);
        });
    }

    /**
     * Remove um prompt do Local Storage pelo seu ID.
     * @param {string} promptId - O ID do prompt a ser removido.
     * @returns {Array} O array de prompts atualizado.
     */
    function deletePrompt(promptId) {
        let prompts = loadPrompts();
        prompts = prompts.filter(p => p.id !== promptId);
        savePrompts(prompts);
        return prompts;
    }

    /**
     * Atualiza um prompt existente no Local Storage.
     * @param {object} updatedPrompt - O objeto prompt atualizado.
     * @returns {Array} O array de prompts atualizado.
     */
    function updatePrompt(updatedPrompt) {
        let prompts = loadPrompts();
        const index = prompts.findIndex(p => p.id === updatedPrompt.id);
        if (index !== -1) {
            // Garante que 'tags' seja um array
            updatedPrompt.tags = Array.isArray(updatedPrompt.tags) ? updatedPrompt.tags : (typeof updatedPrompt.tags === 'string' ? updatedPrompt.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : []);
            prompts[index] = updatedPrompt;
            savePrompts(prompts);
        }
        return prompts;
    }

    /**
     * Reordena os prompts no Local Storage.
     * @param {Array<string>} orderedIds - Um array de IDs na nova ordem.
     * @returns {Array} O array de prompts reordenado.
     */
    function reorderPrompts(orderedIds) {
        let prompts = loadPrompts();
        const promptMap = new Map(prompts.map(p => [p.id, p]));
        const reordered = orderedIds.map(id => promptMap.get(id)).filter(Boolean); // Filtra por prompts existentes
        savePrompts(reordered);
        return reordered;
    }


    return {
        loadPrompts,
        savePrompts,
        exportData,
        importData,
        deletePrompt, // Novo: função para excluir prompt
        updatePrompt, // Novo: função para atualizar prompt
        reorderPrompts // Novo: função para reordenar prompts
    };
})();