// painel-prompt/js/ui.js

/**
 * Módulo para gerenciar todas as interações e manipulações da interface do usuário (DOM).
 */
const ui = (function() {
    // Referências aos elementos do DOM
    const elements = {
        promptIdInput: document.getElementById('promptId'),
        promptTitleInput: document.getElementById('promptTitle'),
        promptContentTextarea: document.getElementById('promptContent'),
        promptTagsInput: document.getElementById('promptTags'),
        savePromptBtn: document.getElementById('savePromptBtn'),
        cancelEditBtn: document.getElementById('cancelEditBtn'),
        promptsContainer: document.getElementById('promptsContainer'),
        noPromptsMessage: document.getElementById('noPromptsMessage'),
        exportDataBtn: document.getElementById('exportDataBtn'),
        importFileInput: document.getElementById('importFileInput'),
        importDataBtn: document.getElementById('importDataBtn'),
        themeSelect: document.getElementById('themeSelect'),
        themeLink: document.getElementById('theme-link'),
        searchPromptsInput: document.getElementById('searchPrompts'),
        feedbackMessage: document.getElementById('feedbackMessage'),

        // Elementos de mensagem de erro do formulário
        titleError: document.getElementById('titleError'),
        contentError: document.getElementById('contentError'),
        tagsError: document.getElementById('tagsError'),

        // NOVOS ELEMENTOS DO MODAL DE CONFIRMAÇÃO
        confirmationModalBackdrop: document.getElementById('confirmationModalBackdrop'),
        confirmationMessage: document.getElementById('confirmationMessage'),
        confirmYesBtn: document.getElementById('confirmYesBtn'),
        confirmNoBtn: document.getElementById('confirmNoBtn')
    };

    // Esta variável 'prompts' é o estado atual dos prompts que o UI deve exibir.
    // Ela é atualizada exclusivamente pela função renderPrompts.
    let prompts = [];
    let currentDragTarget = null;
    const THEME_STORAGE_KEY = 'prompt_panel_theme';
    const VIEW_MODE_STORAGE_KEY = 'prompt_panel_view_mode_';

    let markedLoaded = false;
    // Variáveis para resolver a Promise do modal de confirmação
    let resolveConfirmationPromise;

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
     * @param {'info'|'success'|'error'} type - Tipo da mensagem.
     */
    function showFeedbackMessage(message, type = 'info') {
        elements.feedbackMessage.textContent = message;
        elements.feedbackMessage.className = 'feedback-message show';
        elements.feedbackMessage.classList.add(type);

        setTimeout(() => {
            elements.feedbackMessage.classList.remove('show');
            setTimeout(() => {
                elements.feedbackMessage.className = 'feedback-message';
            }, 500);
        }, 3000);
    }

    /**
     * Copia o texto de um prompt para a área de transferência.
     * @param {string} text - O texto a ser copiado.
     */
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            showFeedbackMessage('Prompt Copiado!', 'success');
        } catch (err) {
            console.error('Erro ao copiar: ', err);
            showFeedbackMessage('Falha ao copiar.', 'error');
        }
    }

    /**
     * Carrega a biblioteca Marked.js dinamicamente.
     * @returns {Promise<void>}
     */
    function loadMarkedJs() {
        return new Promise((resolve, reject) => {
            if (markedLoaded) {
                return resolve();
            }
            if (typeof marked !== 'undefined') {
                markedLoaded = true;
                return resolve();
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
            script.onload = () => {
                markedLoaded = true;
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Alterna o modo de visualização de um prompt (texto puro / markdown/html).
     * @param {string} promptId - O ID do prompt.
     * @param {string} content - O conteúdo original do prompt.
     * @param {HTMLElement} contentDisplayElement - O elemento <pre> ou <div> que exibe o conteúdo.
     * @param {HTMLElement} toggleButton - O botão de alternância.
     */
    async function toggleContentView(promptId, content, contentDisplayElement, toggleButton) {
        const currentMode = localStorage.getItem(VIEW_MODE_STORAGE_KEY + promptId) || 'plain';

        if (currentMode === 'plain') {
            await loadMarkedJs();
            if (typeof marked === 'undefined') {
                showFeedbackMessage('Erro ao carregar renderizador de Markdown.', 'error');
                return;
            }
            contentDisplayElement.innerHTML = marked.parse(content);
            contentDisplayElement.classList.remove('plain-text');
            contentDisplayElement.classList.add('markdown-rendered');
            localStorage.setItem(VIEW_MODE_STORAGE_KEY + promptId, 'rendered');
            toggleButton.innerHTML = '<i class="icon-eye"></i> Visualizar Texto Puro';
        } else {
            contentDisplayElement.textContent = content;
            contentDisplayElement.classList.remove('markdown-rendered');
            contentDisplayElement.classList.add('plain-text');
            localStorage.setItem(VIEW_MODE_STORAGE_KEY + promptId, 'plain');
            toggleButton.innerHTML = '<i class="icon-eye"></i> Visualizar Markdown/HTML';
        }
    }

    /**
     * Valida os campos do formulário e exibe mensagens de erro.
     * @returns {boolean} True se a validação passar, False caso contrário.
     */
    function validateForm() {
        let isValid = true;

        const title = elements.promptTitleInput.value.trim();
        if (!title) {
            elements.titleError.textContent = 'O título não pode estar vazio.';
            elements.titleError.classList.add('show');
            elements.promptTitleInput.classList.add('error');
            isValid = false;
        } else if (title.length < 3) {
            elements.titleError.textContent = 'O título deve ter pelo menos 3 caracteres.';
            elements.titleError.classList.add('show');
            elements.promptTitleInput.classList.add('error');
            isValid = false;
        } else {
            elements.titleError.textContent = '';
            elements.titleError.classList.remove('show');
            elements.promptTitleInput.classList.remove('error');
        }

        const content = elements.promptContentTextarea.value.trim();
        if (!content) {
            elements.contentError.textContent = 'O conteúdo não pode estar vazio.';
            elements.contentError.classList.add('show');
            elements.promptContentTextarea.classList.add('error');
            isValid = false;
        } else if (content.length < 10) {
            elements.contentError.textContent = 'O conteúdo deve ter pelo menos 10 caracteres.';
            elements.contentError.classList.add('show');
            elements.promptContentTextarea.classList.add('error');
            isValid = false;
        } else {
            elements.contentError.textContent = '';
            elements.contentError.classList.remove('show');
            elements.promptContentTextarea.classList.remove('error');
        }

        const tags = elements.promptTagsInput.value.trim();
        if (tags && !/^[a-zA-Z0-9À-ÖØ-öø-ÿ\s,#-_]+$/.test(tags)) {
            elements.tagsError.textContent = 'Tags contêm caracteres inválidos.';
            elements.tagsError.classList.add('show');
            elements.promptTagsInput.classList.add('error');
            isValid = false;
        } else {
            elements.tagsError.textContent = '';
            elements.tagsError.classList.remove('show');
            elements.promptTagsInput.classList.remove('error');
        }

        return isValid;
    }

    /**
     * Cria e retorna um elemento HTML para um único prompt.
     * @param {object} prompt - O objeto prompt a ser renderizado.
     * @returns {HTMLElement} O elemento div do card do prompt.
     */
    function createPromptCard(prompt) {
        const card = document.createElement('div');
        card.className = 'prompt-card';
        card.dataset.id = prompt.id;
        card.setAttribute('draggable', 'true');

        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'tags-container';
        if (Array.isArray(prompt.tags) && prompt.tags.length > 0) {
            prompt.tags.forEach(tagText => {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'tag';
                tagSpan.textContent = `#${tagText.replace(/^#/, '')}`;
                tagsContainer.appendChild(tagSpan);
            });
        } else {
            tagsContainer.innerHTML = '&nbsp;';
        }

        const contentDisplay = document.createElement('pre');
        contentDisplay.className = 'prompt-content-display';
        const savedViewMode = localStorage.getItem(VIEW_MODE_STORAGE_KEY + prompt.id) || 'plain';
        // Renderiza Markdown se o modo salvo for 'rendered' E marked.js estiver carregado
        if (savedViewMode === 'rendered' && typeof marked !== 'undefined') {
            contentDisplay.innerHTML = marked.parse(prompt.content);
            contentDisplay.classList.add('markdown-rendered');
        } else {
            contentDisplay.textContent = prompt.content;
            contentDisplay.classList.add('plain-text');
        }

        card.innerHTML = `
            <h3>${prompt.title}</h3>
        `;
        card.appendChild(tagsContainer);
        card.appendChild(contentDisplay);

        const cardActions = document.createElement('div');
        cardActions.className = 'card-actions';

        const copyButton = document.createElement('button');
        copyButton.className = 'copy-btn';
        copyButton.innerHTML = '<i class="icon-copy"></i> Copiar';
        copyButton.addEventListener('click', (e) => {
            e.stopPropagation();
            copyToClipboard(prompt.content);
        });

        const editButton = document.createElement('button');
        editButton.className = 'edit-btn';
        editButton.innerHTML = '<i class="icon-edit"></i> Editar';
        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            editPrompt(prompt.id);
        });

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.innerHTML = '<i class="icon-trash"></i> Excluir';
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            showConfirmationModal(`Tem certeza que deseja excluir o prompt "${prompt.title}"? Esta ação é irreversível!`)
                .then(confirmed => {
                    if (confirmed) {
                        // A função deletePrompt do storage já retorna a lista atualizada.
                        // Passamos ela para renderPrompts para que a UI seja totalmente atualizada.
                        const updatedPrompts = storage.deletePrompt(prompt.id);
                        renderPrompts(updatedPrompts, elements.searchPromptsInput.value.trim()); // Chamada correta aqui
                        showFeedbackMessage('Prompt excluído com sucesso!', 'success');
                    } else {
                        showFeedbackMessage('Exclusão cancelada.', 'info');
                    }
                });
        });

        const viewToggleButton = document.createElement('button');
        viewToggleButton.className = 'view-toggle';
        if (savedViewMode === 'rendered') {
            viewToggleButton.innerHTML = '<i class="icon-eye"></i> Visualizar Texto Puro';
        } else {
            viewToggleButton.innerHTML = '<i class="icon-eye"></i> Visualizar Markdown/HTML';
        }
        viewToggleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleContentView(prompt.id, prompt.content, contentDisplay, viewToggleButton);
        });

        cardActions.appendChild(copyButton);
        cardActions.appendChild(editButton);
        cardActions.appendChild(deleteButton);
        cardActions.appendChild(viewToggleButton);
        card.appendChild(cardActions);

        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('dragleave', handleDragLeave);
        card.addEventListener('drop', handleDrop);
        card.addEventListener('dragend', handleDragEnd);

        return card;
    }

    /**
     * Renderiza todos os prompts no container, aplicando o filtro de busca.
     * Esconde/mostra a mensagem "nenhum prompt" conforme necessário.
     * @param {Array} currentPrompts - Array de prompts a serem renderizados.
     * @param {string} searchTerm - Termo de busca para filtrar.
     */
    function renderPrompts(currentPrompts, searchTerm = '') {
        // ATUALIZA O ARRAY LOCAL 'prompts' COM A LISTA MAIS RECENTE
        // Esta é a única forma de 'prompts' ser atualizada no módulo UI.
        prompts = currentPrompts;

        elements.promptsContainer.innerHTML = ''; // LIMPA O CONTEÚDO ANTES DE RENDERIZAR

        const filteredPrompts = prompts.filter(prompt => {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            const titleMatches = prompt.title.toLowerCase().includes(lowerCaseSearchTerm);
            const contentMatches = prompt.content.toLowerCase().includes(lowerCaseSearchTerm);
            const tagsMatches = Array.isArray(prompt.tags) && prompt.tags.some(tag => tag.toLowerCase().includes(lowerCaseSearchTerm));
            return titleMatches || contentMatches || tagsMatches;
        });

        if (filteredPrompts.length === 0) {
            elements.noPromptsMessage.style.display = 'block';
            elements.noPromptsMessage.textContent = prompts.length === 0
                ? 'Nenhum prompt salvo ainda. Salve um prompt acima!'
                : 'Nenhum prompt corresponde à sua busca.';
        } else {
            elements.noPromptsMessage.style.display = 'none';
            // Garante que o Marked.js esteja carregado antes de tentar renderizar Markdown
            // Isso evita um erro se a página carregar rápido e um card com "rendered" já estiver no localStorage
            loadMarkedJs().then(() => {
                filteredPrompts.forEach(prompt => {
                    const card = createPromptCard(prompt);
                    elements.promptsContainer.appendChild(card);
                });
            }).catch(error => {
                console.error("Erro ao renderizar prompts com Markdown:", error);
                // Renderiza sem Markdown se houver erro ao carregar a lib
                filteredPrompts.forEach(prompt => {
                    const card = createPromptCard(prompt); // createPromptCard tem fallback para plain text
                    elements.promptsContainer.appendChild(card);
                });
            });
        }
    }

    /**
     * A função addPromptToUI foi removida.
     * A UI agora é sempre atualizada chamando renderPrompts com a lista completa do Local Storage,
     * garantindo a consistência e evitando duplicatas.
     */

    /**
     * Configura o formulário para o modo de edição com os dados de um prompt.
     * @param {string} promptId - O ID do prompt a ser editado.
     */
    function editPrompt(promptId) {
        const promptToEdit = prompts.find(p => p.id === promptId);
        if (promptToEdit) {
            elements.promptIdInput.value = promptToEdit.id;
            elements.promptTitleInput.value = promptToEdit.title;
            elements.promptContentTextarea.value = promptToEdit.content;
            elements.promptTagsInput.value = Array.isArray(promptToEdit.tags) ? promptToEdit.tags.join(', ') : '';

            elements.savePromptBtn.innerHTML = '<i class="icon-check"></i> Atualizar Prompt';
            elements.savePromptBtn.classList.add('edit-mode');
            elements.cancelEditBtn.style.display = 'inline-block';

            elements.promptTitleInput.scrollIntoView({ behavior: 'smooth', block: 'start' });
            elements.promptTitleInput.focus();
        }
    }

    /**
     * Limpa os campos de entrada do formulário e reverte para o modo de "salvar novo".
     */
    function clearForm() {
        elements.promptIdInput.value = '';
        elements.promptTitleInput.value = '';
        elements.promptContentTextarea.value = '';
        elements.promptTagsInput.value = '';

        elements.savePromptBtn.innerHTML = '<i class="icon-save"></i> Salvar Prompt';
        elements.savePromptBtn.classList.remove('edit-mode');
        elements.cancelEditBtn.style.display = 'none';

        elements.titleError.textContent = '';
        elements.titleError.classList.remove('show');
        elements.promptTitleInput.classList.remove('error');

        elements.contentError.textContent = '';
        elements.contentError.classList.remove('show');
        elements.promptContentTextarea.classList.remove('error');

        elements.tagsError.textContent = '';
        elements.tagsError.classList.remove('show');
        elements.promptTagsInput.classList.remove('error');
    }

    /**
     * Exibe o modal de confirmação personalizado.
     * @param {string} message - A mensagem a ser exibida no modal.
     * @returns {Promise<boolean>} Uma Promise que resolve para true se o usuário confirmar, false caso contrário.
     */
    function showConfirmationModal(message) {
        return new Promise(resolve => {
            elements.confirmationMessage.textContent = message;
            elements.confirmationModalBackdrop.classList.add('show');
            document.body.classList.add('modal-open'); // Adiciona classe para desabilitar scroll da página

            // Define a função de resolução da Promise para os botões do modal
            resolveConfirmationPromise = resolve;
        });
    }

    /**
     * Esconde o modal de confirmação.
     */
    function hideConfirmationModal() {
        elements.confirmationModalBackdrop.classList.remove('show');
        document.body.classList.remove('modal-open'); // Remove classe para habilitar scroll da página
    }

    /**
     * Salva o tema atual selecionado no Local Storage.
     * @param {string} themeName - O nome do tema a ser salvo (ex: 'dark', 'light').
     */
    function saveThemePreference(themeName) {
        localStorage.setItem(THEME_STORAGE_KEY, themeName);
        updateSearchIconColor(themeName);
    }

    /**
     * Carrega a preferência de tema do Local Storage.
     * @returns {string} O nome do tema salvo, ou 'light' como padrão.
     */
    function loadThemePreference() {
        return localStorage.getItem(THEME_STORAGE_KEY) || 'light';
    }

    /**
     * Aplica o tema selecionado ao alterar o src do link CSS.
     * @param {string} themeName - O nome do tema (ex: 'dark', 'blue').
     */
    function applyTheme(themeName) {
        const themePath = `css/themes/theme-${themeName}.css`;
        elements.themeLink.href = themePath;
        elements.themeSelect.value = themeName;
        saveThemePreference(themeName);
    }

    /**
     * Ajusta o filtro do ícone SVG de busca com base no tema.
     */
    function updateSearchIconColor(themeName) {
        const root = document.documentElement;
        let filterValue = 'none';

        switch (themeName) {
            case 'dark':
            case 'blue':
            case 'green':
            case 'purple':
            case 'red':
            case 'orange':
            case 'teal':
            case 'indigo':
            case 'cyberpunk':
                filterValue = 'invert(1) hue-rotate(180deg) brightness(2)';
                break;
            case 'gold':
            case 'pink':
                filterValue = 'brightness(0.5)';
                break;
            case 'light':
            default:
                filterValue = 'none';
                break;
        }
        root.style.setProperty('--svg-icon-filter', filterValue);
    }

    // --- Drag and Drop Handlers ---
    function handleDragStart(e) {
        currentDragTarget = e.target;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', e.target.dataset.id);
        setTimeout(() => {
            e.target.classList.add('dragging');
        }, 0);
    }

    function handleDragOver(e) {
        e.preventDefault();
        if (e.target.closest('.prompt-card') && e.target.closest('.prompt-card') !== currentDragTarget) {
            const targetCard = e.target.closest('.prompt-card');
            const boundingBox = targetCard.getBoundingClientRect();
            const offset = boundingBox.y + (boundingBox.height / 2);

            if (e.clientY < offset) {
                elements.promptsContainer.insertBefore(currentDragTarget, targetCard);
            } else {
                elements.promptsContainer.insertBefore(currentDragTarget, targetCard.nextSibling);
            }
        }
    }

    function handleDragLeave(e) {
        // Nada a fazer aqui
    }

    function handleDrop(e) {
        e.preventDefault();
        // A lógica de reordenação já é feita no dragover
    }

    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
        currentDragTarget = null;

        const newOrder = Array.from(elements.promptsContainer.children)
                              .filter(el => el.classList.contains('prompt-card'))
                              .map(card => card.dataset.id);
        storage.reorderPrompts(newOrder);
        showFeedbackMessage('Ordem dos prompts atualizada!', 'info');
    }

    // --- Inicializa os event listeners do modal de confirmação ---
    function initConfirmationModalListeners() {
        elements.confirmYesBtn.addEventListener('click', () => {
            hideConfirmationModal();
            if (resolveConfirmationPromise) {
                resolveConfirmationPromise(true); // Confirma a ação
            }
        });

        elements.confirmNoBtn.addEventListener('click', () => {
            hideConfirmationModal();
            if (resolveConfirmationPromise) {
                resolveConfirmationPromise(false); // Cancela a ação
            }
        });

        // Clicar no backdrop também cancela (opcional, pode ser removido se preferir só botões)
        elements.confirmationModalBackdrop.addEventListener('click', (e) => {
            if (e.target === elements.confirmationModalBackdrop) {
                hideConfirmationModal();
                if (resolveConfirmationPromise) {
                    resolveConfirmationPromise(false); // Cancela a ação
                }
            }
        });
    }

    // Retorna os elementos e funções públicas do módulo UI
    return {
        elements,
        renderPrompts,
        clearForm,
        generateUniqueId,
        showFeedbackMessage,
        applyTheme,
        loadThemePreference,
        validateForm,
        editPrompt,
        loadMarkedJs,
        initConfirmationModalListeners
    };
})();