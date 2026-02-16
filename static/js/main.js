let userLevel = 'Beginner';

// Check for saved level or skip param
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const skip = urlParams.get('skip_onboarding');
    const reset = urlParams.get('reset');

    // Reset Logic
    if (reset === 'true') {
        localStorage.removeItem('userLevel');
        userLevel = 'Beginner'; // Default back
        // Clean URL
        window.history.replaceState({}, document.title, "/");
        return; // Stop here, show onboarding
    }

    const savedLevel = localStorage.getItem('userLevel');

    if (savedLevel) {
        userLevel = savedLevel;
    }

    if (savedLevel || skip === 'true') {
        const modal = document.getElementById('onboarding-modal');
        const dashboard = document.getElementById('dashboard');
        if (modal && dashboard) {
            modal.classList.add('hidden');
            dashboard.classList.remove('hidden');
            dashboard.classList.remove('opacity-0');
        }
    }
});

function selectLevel(level) {
    userLevel = level;
    localStorage.setItem('userLevel', level); // Save for future visits

    const modal = document.getElementById('onboarding-modal');
    const dashboard = document.getElementById('dashboard');

    modal.classList.add('opacity-0', 'scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
        dashboard.classList.remove('hidden');
        // Trigger reflow
        void dashboard.offsetWidth;
        dashboard.classList.remove('opacity-0');
    }, 500);
}

// Generate Content Trigger
async function generateContent() {
    const topicInput = document.getElementById('topic-input');
    const topic = topicInput.value.trim();
    const btn = document.getElementById('generate-btn');

    if (!topic) return;

    // Loading State
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    btn.disabled = true;

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic, level: userLevel })
        });

        const data = await response.json();

        if (response.ok) {
            // Check if data is already an object or a string
            const result = typeof data === 'string' ? JSON.parse(data) : data;
            renderContent(result);
        } else {
            alert('Error generating content: ' + data.error);
        }

    } catch (error) {
        console.error('Error:', error);
        alert('Failed to connect to server.');
    } finally {
        btn.innerHTML = '<i class="fa-solid fa-arrow-up text-xs"></i>';
        btn.disabled = false;
    }
}

// Render Content
function renderContent(data) {
    // 1. Explanation
    const explanationDiv = document.getElementById('explanation-content');
    // Simple markdown parsing for bolding
    let formattedText = data.explanation
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

    typeWriter(formattedText, explanationDiv);

    // 2. Code
    const codeEditor = document.getElementById('code-editor');
    codeEditor.value = data.code;

    // 3. Diagram
    const diagramContainer = document.getElementById('diagram-container');
    diagramContainer.innerHTML = `<div class="mermaid" style="transform: scale(1); transform-origin: top left;">${data.diagram}</div>`;
    zoomLevel = 1; // Reset zoom
    mermaid.init(undefined, document.querySelectorAll('.mermaid'));
}

// Typewriter Effect
function typeWriter(html, element) {
    element.innerHTML = html; // For now, just setting HTML to support formatting immediately. 
    // A true typewriter effect with HTML tags is complex, so we'll do a simple fade-in for this prototype
    element.style.opacity = 0;
    setTimeout(() => {
        element.style.transition = 'opacity 0.5s ease';
        element.style.opacity = 1;
    }, 50);
}

// Text to Speech
function speakText() {
    const text = document.getElementById('explanation-content').innerText;
    if (!text) return;

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'en-US';
    speech.rate = 1;
    window.speechSynthesis.speak(speech);
}

// Share Content
function shareContent() {
    const text = document.getElementById('explanation-content').innerText;
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
        // Show temporary tooltip or alert
        const btn = document.querySelector('button[title="Share Explanation"] i');
        const originalClass = btn.className;
        btn.className = 'fa-solid fa-check text-green-400';
        setTimeout(() => {
            btn.className = originalClass;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

// Enter key support
document.getElementById('topic-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        generateContent();
    }
});

// Copy Code to Clipboard
function copyCode() {
    const codeEditor = document.getElementById('code-editor');
    if (!codeEditor || !codeEditor.value) return;

    navigator.clipboard.writeText(codeEditor.value).then(() => {
        const btn = document.querySelector('button[title="Copy Code"]');
        const originalContent = btn.innerHTML;

        btn.innerHTML = '<i class="fa-solid fa-check text-green-400"></i> Copied!';
        setTimeout(() => {
            btn.innerHTML = originalContent;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy code: ', err);
    });
}


let zoomLevel = 1;

function zoomDiagram(change) {
    const container = document.querySelector('#diagram-container .mermaid');
    if (!container) return;

    zoomLevel += change;
    // Clamp zoom level between 0.5 and 2.0
    zoomLevel = Math.max(0.5, Math.min(zoomLevel, 2.0));

    container.style.transform = `scale(${zoomLevel})`;
    container.style.transformOrigin = 'top left'; // Better for scrolling
    container.style.transition = 'transform 0.2s ease';
}


