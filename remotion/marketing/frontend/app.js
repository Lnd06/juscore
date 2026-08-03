// Social Manager Dashboard Core Logic

document.addEventListener('DOMContentLoaded', () => {
    // API endpoints
    const API_BASE = ''; // Root is served by the same FastAPI server
    
    // DOM Elements
    const formGenerate = document.getElementById('generate-post-form');
    const btnGenerate = document.getElementById('btn-generate');
    const textareaInput = document.getElementById('user_input');
    const containerPending = document.getElementById('pending-posts-container');
    const containerHistory = document.getElementById('history-container');
    const pendingCountBadge = document.getElementById('pending-count');
    const serverStatus = document.getElementById('server-status');
    
    // Video Modal Elements
    const videoModal = document.getElementById('video-modal');
    const modalClose = document.querySelector('.modal-close');
    const modalOverlay = document.querySelector('.modal-overlay');
    const modalVideo = document.getElementById('modal-video-player');
    const modalPilarText = document.getElementById('modal-pilar-text');
    const modalCaptionText = document.getElementById('modal-caption-text');
    
    // State management
    let activePolls = {}; // Keeps track of interval IDs for polling rendering posts
    
    // Initial fetch
    checkServerStatus();
    loadPendingPosts();
    loadHistoryPosts();
    
    // Auto-update server status check
    setInterval(checkServerStatus, 15000);

    // Form submission for post generation
    formGenerate.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const selectedPilar = document.querySelector('input[name="pilar"]:checked').value;
        const userInput = textareaInput.value.trim();
        
        // Show loader
        btnGenerate.disabled = true;
        btnGenerate.querySelector('.btn-text').classList.add('hidden');
        btnGenerate.querySelector('.btn-loader').classList.remove('hidden');
        
        showToast('Hermes Agent Acionado', 'O agente está gerando a cópia e a imagem no OpenRouter. Isso pode levar de 1 a 3 minutos.', 'info');
        
        try {
            const response = await fetch(`${API_BASE}/posts/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pilar: selectedPilar,
                    user_input: userInput || null
                })
            });
            
            if (!response.ok) {
                throw new Error(`Servidor retornou status ${response.status}`);
            }
            
            const newPost = await response.json();
            
            showToast('Post Gerado com Sucesso', `Card e copy criados para o pilar ${newPost.pilar.toUpperCase()}!`, 'success');
            
            // Clear input & refresh list
            textareaInput.value = '';
            loadPendingPosts();
            
        } catch (error) {
            console.error('Erro ao gerar post:', error);
            showToast('Falha na Geração', `Ocorreu um erro ao acionar o agente: ${error.message}`, 'error');
        } finally {
            // Restore button state
            btnGenerate.disabled = false;
            btnGenerate.querySelector('.btn-text').classList.remove('hidden');
            btnGenerate.querySelector('.btn-loader').classList.add('hidden');
        }
    });

    // Fetch and render pending posts
    async function loadPendingPosts() {
        try {
            const response = await fetch(`${API_BASE}/posts/pending`);
            if (!response.ok) throw new Error('Erro ao buscar posts pendentes');
            
            const posts = await response.json();
            pendingCountBadge.textContent = posts.length;
            
            if (posts.length === 0) {
                containerPending.innerHTML = `
                    <div class="empty-state">
                        <i class="fa-solid fa-inbox"></i>
                        <p>Nenhuma postagem aguardando moderação.</p>
                        <p class="sub">Selecione um pilar e clique em "Acionar Hermes Agent" acima para gerar uma.</p>
                    </div>
                `;
                return;
            }
            
            containerPending.innerHTML = '';
            posts.forEach(post => {
                const card = createPendingPostCard(post);
                containerPending.appendChild(card);
            });
            
        } catch (error) {
            console.error('Erro ao carregar posts pendentes:', error);
            showToast('Erro de Conexão', 'Não foi possível carregar a lista de moderação.', 'error');
        }
    }

    // Fetch and render history/rendered videos
    async function loadHistoryPosts() {
        try {
            const response = await fetch(`${API_BASE}/posts/history`);
            if (!response.ok) throw new Error('Erro ao buscar histórico de posts');
            
            const posts = await response.json();
            
            if (posts.length === 0) {
                containerHistory.innerHTML = `
                    <div class="empty-state-horizontal">
                        <i class="fa-solid fa-film"></i>
                        <div>
                            <p>Nenhum vídeo renderizado ou postagem aprovada no histórico.</p>
                            <p class="sub">Quando você aprova um post pendente, ele inicia a renderização no Remotion em background.</p>
                        </div>
                    </div>
                `;
                return;
            }
            
            containerHistory.innerHTML = '';
            posts.forEach(post => {
                const card = createHistoryPostCard(post);
                containerHistory.appendChild(card);
                
                // If post is approved but video is not rendered yet, poll progress
                if (post.status === 'APROVADO' && !post.video_path) {
                    startPollingRenderProgress(post.id);
                }
            });
            
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
        }
    }

    // Create DOM element for a pending post card
    function createPendingPostCard(post) {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.id = `pending-${post.id}`;
        
        // Formata data
        const dateStr = post.created_at ? new Date(post.created_at).toLocaleString('pt-BR') : 'Agora';
        
        // Image preview path or placeholder
        const imageSrc = post.image_url ? post.image_url : '';
        const audioSrc = post.image_url ? `/artes/narration_${post.id}.wav` : ''; // Narrator audio runs beside output
        
        const previewHTML = imageSrc 
            ? `<img src="${imageSrc}" alt="Arte do Post" class="post-image-preview" onerror="this.src='/assets/juscore.png'">` 
            : `<div class="post-preview-placeholder">
                 <i class="fa-regular fa-image"></i>
                 <span>Processando imagem...</span>
               </div>`;

        // Render pilar badge label
        const pilarLabels = {
            'tcc': 'Monografia / TCC',
            'oab': 'Prova OAB',
            'produtividade': 'Produtividade',
            'estagio': 'Estágio / Peça',
            'chat': 'IA Didática / Chat'
        };
        const pilarName = pilarLabels[post.pilar] || post.pilar;
        
        card.innerHTML = `
            <div class="post-card-header">
                <span class="pilar-badge badge-${post.pilar}">${pilarName}</span>
                <span class="post-date">${dateStr}</span>
            </div>
            <div class="post-card-body">
                <div class="post-preview-container">
                    ${previewHTML}
                </div>
                <div class="post-content-container">
                    <div class="audio-player-widget">
                        <button class="audio-play-btn" data-audio-id="audio-${post.id}">
                            <i class="fa-solid fa-play"></i>
                        </button>
                        <div class="audio-info">
                            <div class="audio-title">Narração por Voz de IA</div>
                            <div class="audio-duration" id="duration-${post.id}">Carregando áudio...</div>
                        </div>
                        <audio id="audio-${post.id}" class="audio-control-element" preload="metadata">
                            <source src="/artes/narration_${post.id}.wav?t=${Date.now()}" type="audio/wav">
                        </audio>
                    </div>
                    <label class="form-label" style="font-size: 0.75rem;">Cópia do Post (Edite livremente):</label>
                    <textarea class="caption-textarea" placeholder="Legenda do post...">${post.caption || ''}</textarea>
                </div>
            </div>
            <div class="post-card-actions">
                <button class="btn-action btn-reject" data-id="${post.id}">
                    <i class="fa-solid fa-trash-can"></i> Rejeitar
                </button>
                <button class="btn-action btn-approve" data-id="${post.id}">
                    <i class="fa-solid fa-circle-check"></i> Aprovar & Renderizar Vídeo
                </button>
            </div>
        `;
        
        // Bind actions
        const btnReject = card.querySelector('.btn-reject');
        const btnApprove = card.querySelector('.btn-approve');
        const captionTextarea = card.querySelector('.caption-textarea');
        
        btnReject.addEventListener('click', () => handleReject(post.id));
        btnApprove.addEventListener('click', () => handleApprove(post.id, captionTextarea.value));
        
        // Bind Custom Audio Player
        setupAudioPlayer(card.querySelector('.audio-play-btn'), card.querySelector('.audio-control-element'), card.querySelector(`.audio-duration`));
        
        return card;
    }

    // Create DOM element for a history card
    function createHistoryPostCard(post) {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.id = `history-${post.id}`;
        
        const statusClass = post.status === 'APROVADO' ? 'status-aprovado' : 'status-rejeitado';
        const statusLabel = post.status === 'APROVADO' ? 'Aprovado' : 'Rejeitado';
        
        let footerContent = '';
        if (post.status === 'APROVADO') {
            if (post.video_path) {
                footerContent = `
                    <button class="btn-render-status btn-watch" data-video-url="${post.video_path}" data-id="${post.id}">
                        <i class="fa-solid fa-play"></i> Assistir Vídeo MP4
                    </button>
                `;
            } else {
                footerContent = `
                    <button class="btn-render-status status-rendering" disabled>
                        <i class="fa-solid fa-circle-notch fa-spin"></i> Renderizando...
                    </button>
                `;
            }
        } else {
            footerContent = `
                <button class="btn-render-status btn-rejected-status" disabled>
                    <i class="fa-solid fa-ban"></i> Descartado
                </button>
            `;
        }
        
        const pilarLabels = {
            'tcc': 'TCC',
            'oab': 'OAB',
            'produtividade': 'Produtividade',
            'estagio': 'Estágio',
            'chat': 'IA Didática'
        };
        const pilarShortName = pilarLabels[post.pilar] || post.pilar;
        
        card.innerHTML = `
            <div class="history-card-header">
                <span class="pilar-badge badge-${post.pilar}" style="font-size: 0.7rem; padding: 0.15rem 0.4rem;">${pilarShortName}</span>
                <span class="status-label ${statusClass}">${statusLabel}</span>
            </div>
            <div class="history-card-body">
                <div class="history-preview-container">
                    <img src="${post.image_url || '/assets/juscore.png'}" alt="Preview" class="history-card-image" onerror="this.src='/assets/juscore.png'">
                </div>
                <div class="history-card-desc">${post.caption || 'Sem legenda'}</div>
            </div>
            <div class="history-card-footer" id="history-footer-${post.id}">
                ${footerContent}
            </div>
        `;
        
        // Bind watch button if it exists
        const btnWatch = card.querySelector('.btn-watch');
        if (btnWatch) {
            btnWatch.addEventListener('click', () => openVideoModal(post.video_path, post.pilar, post.caption));
        }
        
        return card;
    }

    // Audio Playback Controller
    function setupAudioPlayer(btn, audio, durationEl) {
        // Display duration when metadata is loaded
        audio.addEventListener('loadedmetadata', () => {
            const minutes = Math.floor(audio.duration / 60);
            const seconds = Math.floor(audio.duration % 60).toString().padStart(2, '0');
            durationEl.textContent = `${minutes}:${seconds}`;
        });
        
        // Error handling for missing files
        audio.addEventListener('error', () => {
            durationEl.textContent = 'Sem áudio ou processando';
            btn.disabled = true;
            btn.style.opacity = '0.5';
        });

        // Toggle play/pause
        btn.addEventListener('click', () => {
            // Stop other playing audios
            document.querySelectorAll('.audio-control-element').forEach(otherAudio => {
                if (otherAudio !== audio && !otherAudio.paused) {
                    otherAudio.pause();
                    const otherBtn = document.querySelector(`[data-audio-id="${otherAudio.id}"]`);
                    if (otherBtn) otherBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                }
            });
            
            if (audio.paused) {
                audio.play();
                btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            } else {
                audio.pause();
                btn.innerHTML = '<i class="fa-solid fa-play"></i>';
            }
        });

        audio.addEventListener('ended', () => {
            btn.innerHTML = '<i class="fa-solid fa-play"></i>';
        });
    }

    // Moderate: Reject Post
    async function handleReject(id) {
        if (!confirm('Tem certeza de que deseja rejeitar e excluir esta postagem?')) return;
        
        try {
            const response = await fetch(`${API_BASE}/posts/${id}/reject`, {
                method: 'POST'
            });
            
            if (!response.ok) throw new Error('Falha ao rejeitar post');
            
            showToast('Post Rejeitado', 'O criativo foi movido para o histórico de descartados.', 'info');
            loadPendingPosts();
            loadHistoryPosts();
            
        } catch (error) {
            console.error('Erro ao rejeitar post:', error);
            showToast('Erro', 'Não foi possível rejeitar o post.', 'error');
        }
    }

    // Moderate: Approve Post
    async function handleApprove(id, caption) {
        try {
            const response = await fetch(`${API_BASE}/posts/${id}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    caption: caption
                })
            });
            
            if (!response.ok) throw new Error('Falha ao aprovar post');
            
            showToast('Post Aprovado!', 'Iniciando renderização de vídeo no Remotion... Acompanhe na seção abaixo.', 'success');
            loadPendingPosts();
            loadHistoryPosts();
            
        } catch (error) {
            console.error('Erro ao aprovar post:', error);
            showToast('Erro', 'Não foi possível aprovar o post.', 'error');
        }
    }

    // Poll endpoint to check if Remotion completed rendering
    function startPollingRenderProgress(postId) {
        if (activePolls[postId]) return; // Already polling
        
        const intervalId = setInterval(async () => {
            try {
                const response = await fetch(`${API_BASE}/posts/${postId}`);
                if (!response.ok) return;
                
                const post = await response.json();
                
                if (post.video_path) {
                    // Render finished!
                    clearInterval(intervalId);
                    delete activePolls[postId];
                    
                    showToast('Render Concluído 🎉', `O vídeo para a postagem do TCC/OAB já está pronto!`, 'success');
                    
                    // Update card footer
                    const footer = document.getElementById(`history-footer-${postId}`);
                    if (footer) {
                        footer.innerHTML = `
                            <button class="btn-render-status btn-watch" data-video-url="${post.video_path}">
                                <i class="fa-solid fa-play"></i> Assistir Vídeo MP4
                            </button>
                        `;
                        // Rebind watch listener
                        footer.querySelector('.btn-watch').addEventListener('click', () => {
                            openVideoModal(post.video_path, post.pilar, post.caption);
                        });
                    }
                }
            } catch (error) {
                console.error(`Erro no polling do post ${postId}:`, error);
            }
        }, 5000);
        
        activePolls[postId] = intervalId;
    }

    // Video Modal Controllers
    function openVideoModal(videoUrl, pilar, caption) {
        modalVideo.src = `${videoUrl}?t=${Date.now()}`;
        modalPilarText.textContent = pilar.toUpperCase();
        modalCaptionText.textContent = caption;
        
        videoModal.classList.remove('hidden');
        modalVideo.play();
    }

    function closeVideoModal() {
        modalVideo.pause();
        modalVideo.src = '';
        videoModal.classList.add('hidden');
    }

    modalClose.addEventListener('click', closeVideoModal);
    modalOverlay.addEventListener('click', closeVideoModal);
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !videoModal.classList.contains('hidden')) {
            closeVideoModal();
        }
    });

    // Toast Notification Creator
    function showToast(title, message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let iconHTML = '';
        if (type === 'success') iconHTML = '<i class="fa-solid fa-circle-check"></i>';
        else if (type === 'error') iconHTML = '<i class="fa-solid fa-circle-exclamation"></i>';
        else iconHTML = '<i class="fa-solid fa-circle-info"></i>';
        
        toast.innerHTML = `
            ${iconHTML}
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Auto-remove toast after 6 seconds
        setTimeout(() => {
            toast.classList.add('toast-fade-out');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 6000);
    }

    // Verify system/api status
    async function checkServerStatus() {
        try {
            const start = Date.now();
            const response = await fetch(`${API_BASE}/posts/pending`);
            if (response.ok) {
                serverStatus.textContent = 'Online';
                serverStatus.parentElement.classList.add('active');
            } else {
                throw new Error();
            }
        } catch (e) {
            serverStatus.textContent = 'Offline';
            serverStatus.parentElement.classList.remove('active');
        }
    }
});
