document.addEventListener('DOMContentLoaded', () => {
    const fab = document.getElementById('fab');
    const chatWindow = document.getElementById('chatWindow');
    const closeBtn = document.getElementById('closeChatBtn');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatMessages = document.getElementById('chatMessages');

    // Generate a simple unique session ID
    let sessionId = localStorage.getItem('apdcl_session_id');
    if (!sessionId) {
        sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('apdcl_session_id', sessionId);
    }

    // Toggle Chat Window
    const toggleChat = () => {
        chatWindow.classList.toggle('hidden');
        if (!chatWindow.classList.contains('hidden')) {
            userInput.focus();
            scrollToBottom();
        }
    };

    fab.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    // Scroll to bottom of chat
    const scrollToBottom = () => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    // Add a message to the chat UI
    const addMessageToUI = (text, isUser = false) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = text;
        
        msgDiv.appendChild(contentDiv);
        chatMessages.appendChild(msgDiv);
        scrollToBottom();
    };

    // Show typing indicator
    const showTypingIndicator = () => {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.id = 'typingIndicator';
        for(let i=0; i<3; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot';
            indicator.appendChild(dot);
        }
        chatMessages.appendChild(indicator);
        scrollToBottom();
    };

    // Remove typing indicator
    const hideTypingIndicator = () => {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    };

    // Send Message to Backend
    const sendMessage = async () => {
        const message = userInput.value.trim();
        if (!message) return;

        // Clear input and show user message
        userInput.value = '';
        addMessageToUI(message, true);

        // Show typing indicator
        showTypingIndicator();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: sessionId,
                    message: message
                })
            });

            const data = await response.json();
            
            // Artificial delay to make it feel like "thinking"
            setTimeout(() => {
                hideTypingIndicator();
                if (data.response) {
                    addMessageToUI(data.response, false);
                } else {
                    addMessageToUI("Sorry, I encountered an error. Please try again.", false);
                }
            }, 600);
            
        } catch (error) {
            console.error('Error sending message:', error);
            hideTypingIndicator();
            addMessageToUI("Sorry, I couldn't connect to the server. Please check your internet connection.", false);
        }
    };

    // Event Listeners for Input
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Load Chat History (Optional enhancement)
    const loadHistory = async () => {
        try {
            const response = await fetch(`/api/chat/${sessionId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.history && data.history.length > 0) {
                    // Clear default greeting if there's history
                    chatMessages.innerHTML = '';
                    data.history.forEach(msg => {
                        addMessageToUI(msg.message, msg.sender === 'user');
                    });
                }
            }
        } catch (error) {
            console.error('Error loading history:', error);
        }
    };

    loadHistory();

    // Auto-open chat after 1.5 seconds so the user can easily find it
    setTimeout(() => {
        if (chatWindow.classList.contains('hidden')) {
            toggleChat();
        }
    }, 1500);
});
