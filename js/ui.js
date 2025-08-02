// painel-prompt/js/ui.js

/**
 * Módulo para gerenciar todas as interações e manipulações da interface do usuário (DOM).
 */
const ui = (function() {
    // Referências aos elementos do DOM
    const elements = {
        promptTitleInput: document.getElementById('promptTitle'),
        promptContentTextarea: document.getElementById('promptContent'),
        savePromptBtn: document.getElementById('savePromptBtn'),
        promptsContainer: document.getElementById('promptsContainer'),
        noPromptsMessage: document.getElementById('noPromptsMessage'),
        exportDataBtn: document.getElementById('exportDataBtn'),
        importFileInput: document.getElementById('importFileInput'),
        importDataBtn: document.getElementById('importDataBtn')
    };

    let prompts = []; // Array que armazenará os prompts atualmente carregados na UI

    /**
     * Gera um ID único simples para um novo prompt.
     * @returns {string} Um ID único.
     */
    function generateUniqueId() {
        return 'prompt_' + Date.now() + Math.random().toString(36).substring(2, 9);
    }

    /**
     * Exibe uma mensagem de feedback temporária na tela.
     * @param {string} message - A mensagem a ser exibida.
     * @param {string} type - Tipo da mensagem (ex: 'success', 'error'). Não usado no CSS atual, mas útil para expansão.
     */
    function showFeedbackMessage(message, type = 'info') {
        let feedbackDiv = document.querySelector('.copied-message');
        if (!feedbackDiv) {
            feedbackDiv = document.createElement('div');
            feedbackDiv.className = 'copied-message';
            document.body.appendChild(feedbackDiv);
        }
        feedbackDiv.textContent = message;
        feedbackDiv.classList.add('show');

        setTimeout(() => {
            feedbackDiv.classList.remove('show');
        }, 2000); // Mensagem some após 2 segundos
    }

    /**
     * Copia o texto de um prompt para a área de transferência.
     * @param {string} text - O texto a ser copiado.
     */
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            showFeedbackMessage('Prompt Copiado!');
        } catch (err) {
            console.error('Erro ao copiar: ', err);
            showFeedbackMessage('Falha ao copiar.');
        }
    }

    /**
     * Cria e retorna um elemento HTML para um único prompt.
     * @param {object} prompt - O objeto prompt a ser renderizado.
     * @param {string} prompt.id - ID único do prompt.
     * @param {string} prompt.title - Título do prompt.
     * @param {string} prompt.content - Conteúdo do prompt.
     * @returns {HTMLElement} O elemento div do card do prompt.
     */
    function createPromptCard(prompt) {
        const card = document.createElement('div');
        card.className = 'prompt-card';
        card.dataset.id = prompt.id; // Armazena o ID no dataset para fácil referência

        card.innerHTML = `
            <h3>${prompt.title}</h3>
            <pre>${prompt.content}</pre>
            <button class="copy-btn">Copiar Prompt</button>
        `;

        // Adiciona evento de clique ao botão de copiar
        const copyButton = card.querySelector('.copy-btn');
        copyButton.addEventListener('click', () => copyToClipboard(prompt.content));

        return card;
    }

    /**
     * Renderiza todos os prompts no container.
     * Esconde/mostra a mensagem "nenhum prompt" conforme necessário.
     * @param {Array} currentPrompts - Array de prompts a serem renderizados.
     */
    function renderPrompts(currentPrompts) {
        prompts = currentPrompts; // Atualiza a lista interna de prompts da UI
        elements.promptsContainer.innerHTML = ''; // Limpa o container antes de renderizar

        if (prompts.length === 0) {
            elements.noPromptsMessage.style.display = 'block';
        } else {
            elements.noPromptsMessage.style.display = 'none';
            prompts.forEach(prompt => {
                const card = createPromptCard(prompt);
                elements.promptsContainer.appendChild(card);
            });
        }
    }

    /**
     * Adiciona um novo prompt à lista e o renderiza na UI.
     * @param {object} newPrompt - O novo objeto prompt a ser adicionado.
     */
    function addPromptToUI(newPrompt) {
        prompts.push(newPrompt);
        renderPrompts(prompts); // Re-renderiza tudo para manter a ordem e a mensagem de "nenhum prompt"
    }

    /**
     * Limpa os campos de entrada do formulário.
     */
    function clearForm() {
        elements.promptTitleInput.value = '';
        elements.promptContentTextarea.value = '';
    }

    /**
     * Retorna os elementos e funções públicas do módulo UI.
     */
    return {
        elements,
        renderPrompts,
        addPromptToUI,
        clearForm,
        generateUniqueId, // Exposto para o main.js usar ao criar um novo prompt
        showFeedbackMessage // Exposto para o main.js usar para feedback de import/export
    };
})();