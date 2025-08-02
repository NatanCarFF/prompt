// painel-prompt/js/ui.js

/**
 * Módulo para gerenciar todas as interações e manipulações da interface do usuário (DOM).
 */
const ui = (function() {
    // Referências aos elementos do DOM
    const elements = {
        promptIdInput: document.getElementById('promptId'), // Novo: Campo oculto para ID de edição
        promptTitleInput: document.getElementById('promptTitle'),
        promptContentTextarea: document.getElementById('promptContent'),
        promptTagsInput: document.getElementById('promptTags'), // Novo: Campo de tags
        savePromptBtn: document.getElementById('savePromptBtn'),
        cancelEditBtn: document.getElementById('cancelEditBtn'), // Novo: Botão de cancelar edição
        promptsContainer: document.getElementById('promptsContainer'),
        noPromptsMessage: document.getElementById('noPromptsMessage'),
        exportDataBtn: document.getElementById('exportDataBtn'),
        importFileInput: document.getElementById('importFileInput'),
        importDataBtn: document.getElementById('importDataBtn'),
        themeSelect: document.getElementById('themeSelect'),
        themeLink: document.getElementById('theme-link'),
        searchPromptsInput: document.getElementById('searchPrompts'), // Novo: Campo de busca
        feedbackMessage: document.getElementById('feedbackMessage'), // Novo: Mensagem de feedback global

        // Elementos de mensagem de erro do formulário
        titleError: document.getElementById('titleError'),
        contentError: document.getElementById('contentError'),
        tagsError: document.getElementById('tagsError')
    };

    let prompts = []; // Array que armazenará os prompts atualmente carregados na UI
    let currentDragTarget = null; // Para o recurso de arrastar e soltar
    const THEME_STORAGE_KEY = 'prompt_panel_theme'; // Chave para armazenar o tema no Local Storage
    const VIEW_MODE_STORAGE_KEY = 'prompt_panel_view_mode_'; // Prefixo para chave de modo de visualização por prompt

    // Marcador para a biblioteca Marked.js
    let markedLoaded = false;

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
        elements.feedbackMessage.className = 'feedback-message show'; // Reset classes
        elements.feedbackMessage.classList.add(type);

        setTimeout(() => {
            elements.feedbackMessage.classList.remove('show');
            // Remove as classes de tipo após a transição
            setTimeout(() => {
                elements.feedbackMessage.className = 'feedback-message';
            }, 500); // Espera a transição de opacidade terminar
        }, 3000); // Mensagem some após 3 segundos
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
            if (typeof marked !== 'undefined') { // Já carregada por script tag, talvez?
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
            await loadMarkedJs(); // Garante que Marked.js esteja carregado
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
            contentDisplayElement.textContent = content; // Volta para texto puro
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

        // Validação do Título
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

        // Validação do Conteúdo
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

        // Validação das Tags (opcional, mas valida formato)
        const tags = elements.promptTagsInput.value.trim();
        if (tags && !/^[a-zA-Z0-9À-ÖØ-öø-ÿ\s,#-_]+$/.test(tags)) { // Permite letras, números, espaços, #, -, _ e vírgulas
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
        card.dataset.id = prompt.id; // Armazena o ID no dataset para fácil referência
        card.setAttribute('draggable', 'true'); // Torna o card arrastável

        // Container para tags
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'tags-container';
        if (Array.isArray(prompt.tags) && prompt.tags.length > 0) {
            prompt.tags.forEach(tagText => {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'tag';
                tagSpan.textContent = `#${tagText.replace(/^#/, '')}`; // Garante # e remove se duplicado
                tagsContainer.appendChild(tagSpan);
            });
        } else {
            tagsContainer.innerHTML = '&nbsp;'; // Espaço não-quebrável para manter o layout
        }

        // Conteúdo do prompt (para alternar entre plain/rendered)
        const contentDisplay = document.createElement('pre');
        contentDisplay.className = 'prompt-content-display';
        // Restaura o modo de visualização salvo ou define como texto puro
        const savedViewMode = localStorage.getItem(VIEW_MODE_STORAGE_KEY + prompt.id) || 'plain';
        if (savedViewMode === 'rendered' && typeof marked !== 'undefined') { // Só renderiza se marked.js já estiver disponível
            contentDisplay.innerHTML = marked.parse(prompt.content);
            contentDisplay.classList.add('markdown-rendered');
        } else {
            contentDisplay.textContent = prompt.content;
            contentDisplay.classList.add('plain-text');
        }

        card.innerHTML = `
            <h3>${prompt.title}</h3>
        `;
        card.appendChild(tagsContainer); // Adiciona as tags
        card.appendChild(contentDisplay); // Adiciona o display de conteúdo

        // Botões de ação do card
        const cardActions = document.createElement('div');
        cardActions.className = 'card-actions';

        const copyButton = document.createElement('button');
        copyButton.className = 'copy-btn';
        copyButton.innerHTML = '<i class="icon-copy"></i> Copiar';
        copyButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita acionar drag/drop ou edição se clicar no botão
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
            confirmAndDeletePrompt(prompt.id, prompt.title);
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
        cardActions.appendChild(viewToggleButton); // Adiciona o botão de alternância
        card.appendChild(cardActions);

        // Eventos de Drag and Drop
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
        prompts = currentPrompts; // Atualiza a lista interna de prompts da UI
        elements.promptsContainer.innerHTML = ''; // Limpa o container antes de renderizar

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
            filteredPrompts.forEach(prompt => {
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
        // Re-renderiza para aplicar ordem e filtro, se houver
        renderPrompts(prompts, elements.searchPromptsInput.value.trim());
    }

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

            // Muda o texto e estilo do botão de salvar para "Atualizar"
            elements.savePromptBtn.innerHTML = '<i class="icon-check"></i> Atualizar Prompt';
            elements.savePromptBtn.classList.add('edit-mode');
            elements.cancelEditBtn.style.display = 'inline-block'; // Mostra o botão de cancelar

            // Scrolla para o topo do formulário
            elements.promptTitleInput.scrollIntoView({ behavior: 'smooth', block: 'start' });
            elements.promptTitleInput.focus(); // Foca no campo de título
        }
    }

    /**
     * Limpa os campos de entrada do formulário e reverte para o modo de "salvar novo".
     */
    function clearForm() {
        elements.promptIdInput.value = ''; // Limpa o ID oculto
        elements.promptTitleInput.value = '';
        elements.promptContentTextarea.value = '';
        elements.promptTagsInput.value = '';

        elements.savePromptBtn.innerHTML = '<i class="icon-save"></i> Salvar Prompt';
        elements.savePromptBtn.classList.remove('edit-mode');
        elements.cancelEditBtn.style.display = 'none'; // Esconde o botão de cancelar

        // Limpa mensagens de erro
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
     * Confirma e exclui um prompt.
     * @param {string} promptId - O ID do prompt a ser excluído.
     * @param {string} promptTitle - O título do prompt para a mensagem de confirmação.
     */
    function confirmAndDeletePrompt(promptId, promptTitle) {
        if (confirm(`Tem certeza que deseja excluir o prompt "${promptTitle}"? Esta ação é irreversível!`)) {
            const updatedPrompts = storage.deletePrompt(promptId);
            renderPrompts(updatedPrompts, elements.searchPromptsInput.value.trim()); // Re-renderiza a lista
            showFeedbackMessage('Prompt excluído com sucesso!', 'success');
        } else {
            showFeedbackMessage('Exclusão cancelada.', 'info');
        }
    }

    /**
     * Salva o tema atual selecionado no Local Storage.
     * @param {string} themeName - O nome do tema a ser salvo (ex: 'dark', 'light').
     */
    function saveThemePreference(themeName) {
        localStorage.setItem(THEME_STORAGE_KEY, themeName);
        // Atualiza o filtro do SVG de busca para o tema atual
        updateSearchIconColor(themeName);
    }

    /**
     * Carrega a preferência de tema do Local Storage.
     * @returns {string} O nome do tema salvo, ou 'light' como padrão.
     */
    function loadThemePreference() {
        return localStorage.getItem(THEME_STORAGE_KEY) || 'light'; // 'light' como padrão
    }

    /**
     * Aplica o tema selecionado ao alterar o src do link CSS.
     * @param {string} themeName - O nome do tema (ex: 'dark', 'blue').
     */
    function applyTheme(themeName) {
        const themePath = `css/themes/theme-${themeName}.css`;
        elements.themeLink.href = themePath;
        elements.themeSelect.value = themeName; // Garante que o dropdown reflita o tema carregado
        saveThemePreference(themeName); // Salva a preferência
    }

    /**
     * Ajusta o filtro do ícone SVG de busca com base no tema.
     * Isso é necessário porque o SVG é embutido via data URI.
     * Poderíamos criar uma variável CSS para isso em :root.
     */
    function updateSearchIconColor(themeName) {
        const root = document.documentElement;
        let filterValue = 'none'; // Default para temas claros

        switch (themeName) {
            case 'dark':
            case 'blue':
            case 'green':
            case 'purple':
            case 'red':
            case 'orange':
            case 'teal':
            case 'indigo':
            case 'cyberpunk': // Esses temas têm fundos escuros
                // Este filtro inverte as cores para que o ícone preto do SVG se torne branco
                filterValue = 'invert(1) hue-rotate(180deg) brightness(2)';
                break;
            case 'gold': // Ouro pode precisar de filtro diferente para texto escuro
                filterValue = 'brightness(0.5)'; // Escurece o ícone para contraste em fundo dourado claro
                break;
            case 'pink': // Rosa claro pode precisar de filtro para texto escuro
                filterValue = 'brightness(0.5)'; // Escurece o ícone para contraste em fundo rosa claro
                break;
            case 'light':
            default:
                filterValue = 'none'; // Sem filtro para temas claros (ícone preto padrão)
                break;
        }
        root.style.setProperty('--svg-icon-filter', filterValue);
    }

    // --- Drag and Drop Handlers ---
    function handleDragStart(e) {
        currentDragTarget = e.target; // O card que está sendo arrastado
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', e.target.dataset.id); // Transfere o ID do prompt
        setTimeout(() => {
            e.target.classList.add('dragging'); // Adiciona classe 'dragging' após um pequeno delay
        }, 0);
    }

    function handleDragOver(e) {
        e.preventDefault(); // Necessário para permitir o drop
        if (e.target.closest('.prompt-card') && e.target.closest('.prompt-card') !== currentDragTarget) {
            const targetCard = e.target.closest('.prompt-card');
            const boundingBox = targetCard.getBoundingClientRect();
            const offset = boundingBox.y + (boundingBox.height / 2);

            if (e.clientY < offset) {
                // Acima da metade superior, insere antes
                elements.promptsContainer.insertBefore(currentDragTarget, targetCard);
            } else {
                // Abaixo da metade inferior, insere depois
                elements.promptsContainer.insertBefore(currentDragTarget, targetCard.nextSibling);
            }
        }
    }

    function handleDragLeave(e) {
        // Nada a fazer aqui por enquanto
    }

    function handleDrop(e) {
        e.preventDefault();
        // A lógica de reordenação já foi feita no dragover
    }

    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
        currentDragTarget = null;

        // Salva a nova ordem no Local Storage
        const newOrder = Array.from(elements.promptsContainer.children)
                              .filter(el => el.classList.contains('prompt-card')) // Garante que só cards sejam contados
                              .map(card => card.dataset.id);
        const reorderedPrompts = storage.reorderPrompts(newOrder);

        // Opcional: Re-renderizar para garantir que os dados internos correspondam à UI
        // renderPrompts(reorderedPrompts, elements.searchPromptsInput.value.trim());
        // Se a reordenação visual já for boa, não precisa re-renderizar, apenas salvar.
        showFeedbackMessage('Ordem dos prompts atualizada!', 'info');
    }


    // Retorna os elementos e funções públicas do módulo UI
    return {
        elements,
        renderPrompts,
        addPromptToUI,
        clearForm,
        generateUniqueId,
        showFeedbackMessage,
        applyTheme,
        loadThemePreference,
        validateForm, // Novo: expõe a função de validação
        editPrompt, // Novo: expõe a função de edição
        confirmAndDeletePrompt, // Novo: expõe a função de exclusão
        loadMarkedJs // Expõe para ser usado ao carregar o app
    };
})();