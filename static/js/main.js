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

    // if (savedLevel || skip === 'true') {
    //     const modal = document.getElementById('onboarding-modal');
    //     const dashboard = document.getElementById('dashboard');
    //     if (modal && dashboard) {
    //         modal.classList.add('hidden');
    //         dashboard.classList.remove('hidden');
    //         dashboard.classList.remove('opacity-0');
    //     }
    // }
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

// X-Ray Data Store
let currentXRayMap = {};

// Render Content
function renderContent(data) {
    // 1. Explanation
    const explanationDiv = document.getElementById('explanation-content');
    // Simple markdown parsing for bolding
    let formattedText = data.explanation
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

    typeWriter(formattedText, explanationDiv);

    // 2. Code & X-Ray
    const codeDisplay = document.getElementById('code-display');
    // Escape HTML characters to prevent rendering issues in Prism
    const escapedCode = data.code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    codeDisplay.innerHTML = escapedCode;

    // Store X-Ray Map
    currentXRayMap = data.xray || {};

    // Trigger Prism Highlight
    Prism.highlightElement(codeDisplay);

    // Initialize X-Ray Interaction
    initXRay();

    // 3. Diagram
    const diagramContainer = document.getElementById('diagram-container');
    diagramContainer.innerHTML = `<div class="mermaid" style="transform: scale(1); transform-origin: top left;">${data.diagram}</div>`;
    zoomLevel = 1; // Reset zoom

    try {
        mermaid.init(undefined, document.querySelectorAll('.mermaid'));
    } catch (err) {
        console.error("Mermaid Render Error:", err);
        diagramContainer.innerHTML = `
            <div class="p-4 text-red-400 text-sm font-mono overflow-auto h-full">
                <div class="mb-2 font-bold"><i class="fa-solid fa-triangle-exclamation"></i> Visualization Error</div>
                <div class="opacity-70 mb-4">${err.message}</div>
                <div class="text-xs text-gray-500 mb-1">Raw Code:</div>
                <pre class="bg-black/20 p-2 rounded whitespace-pre-wrap select-text">${data.diagram}</pre>
            </div>
        `;
    }
}

// X-Ray Interaction Logic
function initXRay() {
    const codeContainer = document.getElementById('code-container');

    // Naively clone to remove old listeners (acceptable for this scope)
    const newContainer = codeContainer.cloneNode(true);
    codeContainer.parentNode.replaceChild(newContainer, codeContainer);

    const activeContainer = document.getElementById('code-container');
    // Re-select tooltip elements inside the fresh container
    const activeTooltip = activeContainer.querySelector('#xray-tooltip');
    const activeTooltipText = activeContainer.querySelector('#xray-text');
    const preTag = activeContainer.querySelector('pre');

    activeContainer.addEventListener('mousemove', (e) => {
        const rect = activeContainer.getBoundingClientRect();

        // Dynamic Measurment
        const computedStyle = window.getComputedStyle(preTag);
        const lineHeight = parseFloat(computedStyle.lineHeight); // e.g. 21
        const paddingTop = parseFloat(computedStyle.paddingTop); // e.g. 16

        // Relative Y position inside the container, adjusted for scroll
        const scrollTop = preTag.scrollTop;
        const relativeY = e.clientY - rect.top; // Mouse Y relative to container top

        // Adjust for padding and scroll
        // The code content starts appearing at `paddingTop` pixels down.
        // So line 1 is at y=paddingTop to y=paddingTop+lineHeight
        const contentY = relativeY + scrollTop - paddingTop;

        if (contentY < 0) {
            // Hovering in top padding area
            activeTooltip.classList.add('hidden');
            activeTooltip.classList.add('opacity-0');
            return;
        }

        const lineNumber = Math.floor(contentY / lineHeight) + 1;

        // Debugging (view in console if needed)
        // console.log(`Y: ${relativeY}, Scroll: ${scrollTop}, Padding: ${paddingTop}, LineHeight: ${lineHeight} -> Line: ${lineNumber}`);

        const explanation = currentXRayMap[lineNumber.toString()];

        if (explanation) {
            // Show Tooltip
            activeTooltipText.textContent = explanation;
            activeTooltip.classList.remove('hidden');
            activeTooltip.classList.remove('opacity-0');

            // Position Tooltip
            activeTooltip.style.left = `${e.clientX - rect.left + 20}px`;
            activeTooltip.style.top = `${e.clientY - rect.top + 20}px`;

        } else {
            // Hide if no explanation
            activeTooltip.classList.add('hidden');
            activeTooltip.classList.add('opacity-0');
        }
    });

    activeContainer.addEventListener('mouseleave', () => {
        if (activeTooltip) {
            activeTooltip.classList.add('hidden');
            activeTooltip.classList.add('opacity-0');
        }
    });
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
    const codeDisplay = document.getElementById('code-display');
    if (!codeDisplay || !codeDisplay.innerText) return;

    navigator.clipboard.writeText(codeDisplay.innerText).then(() => {
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


