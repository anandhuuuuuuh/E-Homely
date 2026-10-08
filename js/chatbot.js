// AI Chatbot for E-Homely
class EhomelyChatbot {
  constructor() {
    this.isOpen = false;
    this.messages = [];
    this.init();
  }

  init() {
    this.createChatbotUI();
    this.setupEventListeners();
    this.loadWelcomeMessage();
  }

  createChatbotUI() {
    const chatbotHTML = `
      <div id="ehomelyChat" class="eho-chatbot-widget">
        <!-- Chat Toggle Button -->
        <button class="chat-toggle" id="chatToggle" aria-label="Open chat" title="Chat with us">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span class="chat-badge">1</span>
        </button>

        <!-- Chat Window -->
        <div class="chat-window" id="chatWindow" style="display: none;">
          <div class="chat-header">
            <div class="chat-title">
              <span class="title-text">E-Homely Chat</span>
              <small>Instant support</small>
            </div>
            <button class="chat-close" id="chatClose" aria-label="Close chat">×</button>
          </div>

          <div class="chat-messages" id="chatMessages">
            <!-- Messages appear here -->
          </div>

          <div class="chat-input-area">
            <input 
              type="text" 
              id="chatInput" 
              class="chat-input" 
              placeholder="Ask about menu, orders, availability..." 
              autocomplete="off"
            />
            <button class="chat-send" id="chatSend" aria-label="Send message">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>

          <div class="chat-suggestions" id="chatSuggestions">
            <button class="suggestion-btn" data-query="What's available now?">Available now?</button>
            <button class="suggestion-btn" data-query="How to order?">How to order</button>
            <button class="suggestion-btn" data-query="Delivery options">Delivery</button>
            <button class="suggestion-btn" data-query="Contact support">Support</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    this.injectStyles();
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .eho-chatbot-widget {
        font-family: 'DM Sans', system-ui, sans-serif;
        --chat-primary: #16733f;
        --chat-accent: #eef8f0;
        --chat-text: #102d20;
        --chat-light: #f9fcfa;
        --chat-border: #d6e5d8;
      }

      .eho-chatbot-widget * {
        box-sizing: border-box;
      }

      /* Chat Toggle Button */
      .chat-toggle {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #16733f, #0f6c3d);
        border: none;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(22, 115, 63, 0.35);
        z-index: 999;
        transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
      }

      .chat-toggle:hover {
        transform: scale(1.1);
        box-shadow: 0 8px 30px rgba(22, 115, 63, 0.45);
      }

      .chat-toggle:active {
        transform: scale(0.95);
      }

      .chat-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        width: 24px;
        height: 24px;
        background: #e8534e;
        border: 2px solid white;
        border-radius: 50%;
        font-size: 11px;
        font-weight: 800;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 2s ease-in-out infinite;
      }

      /* Chat Window */
      .chat-window {
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 360px;
        max-width: calc(100vw - 20px);
        height: 520px;
        background: white;
        border-radius: 20px;
        border: 1px solid var(--chat-border);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        z-index: 998;
        animation: slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        backdrop-filter: blur(8px);
      }

      /* Chat Header */
      .chat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid var(--chat-border);
        background: linear-gradient(135deg, var(--chat-primary), rgba(22, 115, 63, 0.95));
        color: white;
        border-radius: 20px 20px 0 0;
      }

      .chat-title {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .title-text {
        font-weight: 700;
        font-size: 15px;
      }

      .chat-header small {
        font-size: 11px;
        opacity: 0.9;
      }

      .chat-close {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 28px;
        cursor: pointer;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }

      .chat-close:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      /* Chat Messages */
      .chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: var(--chat-light);
      }

      .chat-message {
        display: flex;
        animation: messageSlide 0.3s ease;
      }

      .chat-message.user {
        justify-content: flex-end;
      }

      .chat-message.bot {
        justify-content: flex-start;
      }

      .message-bubble {
        max-width: 85%;
        padding: 10px 14px;
        border-radius: 12px;
        line-height: 1.4;
        font-size: 13px;
        word-wrap: break-word;
      }

      .user .message-bubble {
        background: var(--chat-primary);
        color: white;
        border-radius: 12px 4px 12px 12px;
      }

      .bot .message-bubble {
        background: var(--chat-accent);
        color: var(--chat-text);
        border-radius: 4px 12px 12px 12px;
      }

      /* Chat Input Area */
      .chat-input-area {
        display: flex;
        gap: 8px;
        padding: 12px;
        border-top: 1px solid var(--chat-border);
        background: white;
      }

      .chat-input {
        flex: 1;
        border: 1px solid var(--chat-border);
        border-radius: 20px;
        padding: 8px 14px;
        font-size: 13px;
        font-family: inherit;
        outline: none;
        transition: border-color 0.2s;
      }

      .chat-input:focus {
        border-color: var(--chat-primary);
        box-shadow: 0 0 0 3px rgba(22, 115, 63, 0.1);
      }

      .chat-send {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--chat-primary);
        border: none;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }

      .chat-send:hover {
        background: #0f6c3d;
        transform: scale(1.05);
      }

      .chat-send:active {
        transform: scale(0.95);
      }

      /* Chat Suggestions */
      .chat-suggestions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        padding: 8px;
        border-top: 1px solid var(--chat-border);
        background: var(--chat-light);
        border-radius: 0 0 20px 20px;
      }

      .suggestion-btn {
        padding: 8px 10px;
        border: 1px solid var(--chat-border);
        background: white;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 600;
        color: var(--chat-text);
        cursor: pointer;
        transition: all 0.2s;
      }

      .suggestion-btn:hover {
        background: var(--chat-accent);
        border-color: var(--chat-primary);
        color: var(--chat-primary);
      }

      /* Animations */
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes messageSlide {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }

      /* Scrollbar Styling */
      .chat-messages::-webkit-scrollbar {
        width: 6px;
      }

      .chat-messages::-webkit-scrollbar-track {
        background: transparent;
      }

      .chat-messages::-webkit-scrollbar-thumb {
        background: rgba(22, 115, 63, 0.3);
        border-radius: 3px;
      }

      .chat-messages::-webkit-scrollbar-thumb:hover {
        background: rgba(22, 115, 63, 0.5);
      }

      /* Responsive */
      @media (max-width: 480px) {
        .chat-window {
          width: calc(100vw - 40px);
          height: 60vh;
          max-height: 500px;
          bottom: 80px;
          right: 20px;
          left: 20px;
          border-radius: 16px;
        }

        .message-bubble {
          max-width: 90%;
        }

        .chat-suggestions {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }

  setupEventListeners() {
    const toggle = document.getElementById('chatToggle');
    const close = document.getElementById('chatClose');
    const send = document.getElementById('chatSend');
    const input = document.getElementById('chatInput');
    const suggestions = document.querySelectorAll('.suggestion-btn');

    toggle.addEventListener('click', () => this.toggleChat());
    close.addEventListener('click', () => this.toggleChat());
    send.addEventListener('click', () => this.sendMessage());
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });

    suggestions.forEach(btn => {
      btn.addEventListener('click', () => {
        input.value = btn.dataset.query;
        this.sendMessage();
      });
    });
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    const window = document.getElementById('chatWindow');
    window.style.display = this.isOpen ? 'flex' : 'none';
    if (this.isOpen) {
      document.getElementById('chatInput').focus();
    }
  }

  loadWelcomeMessage() {
    const messages = document.getElementById('chatMessages');
    const welcomeMsg = document.createElement('div');
    welcomeMsg.className = 'chat-message bot';
    welcomeMsg.innerHTML = `
      <div class="message-bubble">
        👋 Hi! Welcome to E-Homely. How can I help you today? Ask about our menu, availability, or how to order!
      </div>
    `;
    messages.appendChild(welcomeMsg);
  }

  sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;

    // Add user message
    this.addMessage(message, 'user');
    input.value = '';

    // Get bot response
    const response = this.getBotResponse(message);
    
    // Simulate typing delay
    setTimeout(() => {
      this.addMessage(response, 'bot');
    }, 500);
  }

  addMessage(text, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = text;
    
    messageDiv.appendChild(bubble);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  getBotResponse(userMessage) {
    const msg = userMessage.toLowerCase();

    // Availability responses
    if (msg.includes('available') || msg.includes('open') || msg.includes('time')) {
      return '📅 Right now:\n🍳 Breakfast: 7:00 AM - 11:00 AM\n🍛 Lunch: 12:00 PM - 2:30 PM\n🍽️ Dinner: 7:00 PM - 10:00 PM\n\nCheck the menu for real-time availability!';
    }

    // Order/Menu responses
    if (msg.includes('how to order') || msg.includes('order') || msg.includes('menu')) {
      return '📝 Easy steps to order:\n1️⃣ Check availability\n2️⃣ Browse our Kerala menu\n3️⃣ Add items to cart\n4️⃣ Proceed to checkout\n5️⃣ Get your token\n\nLet\'s get started! 🎉';
    }

    // Delivery/Pickup responses
    if (msg.includes('delivery') || msg.includes('pickup') || msg.includes('pickup') || msg.includes('home')) {
      return '🚚 We offer:\n✅ Counter pickup\n✅ In-campus delivery\n\nDelivery charges may apply based on location. See details at checkout!';
    }

    // Contact/Support responses
    if (msg.includes('contact') || msg.includes('support') || msg.includes('help')) {
      return '📞 Need help?\n📧 Email: support@ehomely.in\n📱 Call: +91-XXXX-XXXX\n💬 Chat with us here!\n\nWe\'re here to help! 😊';
    }

    // Food-related responses
    if (msg.includes('appam') || msg.includes('dosa') || msg.includes('curry') || msg.includes('food')) {
      return '🍲 Our authentic Kerala cuisine is loved by many!\n💚 Fresh ingredients\n💚 Traditional recipes\n💚 Quick service\n\nCheck our full menu to see all options! 👉 Go to Menu';
    }

    // Price/Cost responses
    if (msg.includes('price') || msg.includes('cost') || msg.includes('expensive') || msg.includes('rupee')) {
      return '💰 Our prices are affordable and transparent:\n✨ Most items: ₹50-150\n✨ Combos: ₹120-200\n✨ No hidden charges!\n\nSee prices in the menu. 👉 View Menu';
    }

    // Default responses
    const responses = [
      '🤔 That\'s a great question! Could you tell me more about what you\'re looking for?',
      '💡 You can browse our menu for more details, or ask me specific questions!',
      '✨ Feel free to ask about our menu, availability, delivery, or how to order!',
      '👍 Got it! Want to know about our menu items or place an order?'
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }
}

// Initialize chatbot when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new EhomelyChatbot();
  });
} else {
  new EhomelyChatbot();
}
