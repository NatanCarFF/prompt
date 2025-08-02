// painel-prompt/js/storage.js

/**
 * Módulo para gerenciar a persistência de dados (prompts) no Local Storage
 * e funcionalidades de importação/exportação JSON.
 */
const storage = (function() {
    const STORAGE_KEY = 'prompt_panel_data'; // Chave para armazenar os dados no Local Storage

    /**
     * Carrega os prompts salvos do Local Storage.
     * @returns {Array} Um array de objetos de prompt.
     */
    function loadPrompts() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Erro ao carregar prompts do Local Storage:", e);
            // Em caso de erro (ex: JSON malformado), retorna um array vazio
            return [];
        }
    }

    /**
     * Salva um array de prompts no Local Storage.
     * @param {Array} prompts - O array de objetos de prompt a ser salvo.
     */
    function savePrompts(prompts) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
        } catch (e) {
            console.error("Erro ao salvar prompts no Local Storage:", e);
            alert("Não foi possível salvar os prompts. O Local Storage pode estar cheio ou inacessível.");
        }
    }

    /**
     * Exporta todos os prompts salvos para um arquivo JSON.
     */
    function exportData() {
        const prompts = loadPrompts();
        if (prompts.length === 0) {
            alert("Não há prompts para exportar!");
            return;
        }

        const dataStr = JSON.stringify(prompts, null, 2); // Formata o JSON com indentação de 2 espaços
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'prompts_export.json'; // Nome do arquivo a ser baixado
        document.body.appendChild(a); // Necessário para Firefox
        a.click();

        document.body.removeChild(a); // Limpa o elemento <a>
        URL.revokeObjectURL(url); // Libera o URL do objeto
    }

    /**
     * Importa dados de um arquivo JSON.
     * Sobrescreve os prompts existentes com os dados do arquivo.
     * @param {File} file - O objeto File do arquivo JSON a ser importado.
     * @returns {Promise<Array>} Uma promessa que resolve com os novos prompts ou rejeita em caso de erro.
     */
    function importData(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error("Nenhum arquivo selecionado."));
                return;
            }
            if (file.type !== "application/json") {
                reject(new Error("Por favor, selecione um arquivo JSON válido."));
                return;
            }

            const reader = new FileReader();

            reader.onload = function(event) {
                try {
                    const importedPrompts = JSON.parse(event.target.result);
                    // Opcional: Validar a estrutura dos prompts importados aqui
                    if (!Array.isArray(importedPrompts)) {
                        throw new Error("O arquivo JSON não contém um array de prompts válido.");
                    }
                    // Você pode adicionar mais validações, como verificar se cada objeto tem 'id', 'title', 'content'

                    savePrompts(importedPrompts); // Salva os prompts importados
                    resolve(importedPrompts); // Retorna os prompts para serem exibidos na UI
                } catch (e) {
                    console.error("Erro ao processar arquivo JSON:", e);
                    reject(new Error("Erro ao ler ou analisar o arquivo JSON: " + e.message));
                }
            };

            reader.onerror = function(error) {
                console.error("Erro ao ler o arquivo:", error);
                reject(new Error("Erro ao ler o arquivo."));
            };

            reader.readAsText(file); // Lê o conteúdo do arquivo como texto
        });
    }

    // Retorna as funções públicas do módulo
    return {
        loadPrompts,
        savePrompts,
        exportData,
        importData
    };
})();