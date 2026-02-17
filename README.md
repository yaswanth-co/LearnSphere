# LearnSphere 🧠

LearnSphere is an AI-powered interactive learning platform designed to help users master Machine Learning concepts. It uses advanced generative AI to provide clear explanations, runnable code snippets, and visual diagrams, tailored to the user's expertise level.

## ✨ Features

-   **AI-Powered Explanations**: Generates concise, level-appropriate explanations for any ML topic (e.g., "Linear Regression", "Neural Networks").
-   **X-Ray Explainer 🔍**: An interactive code analysis tool. Hover over lines of generated Python code to see instant, line-by-line explanations of what the code does.
-   **Architecture Visualization**: Automatically generates **Mermaid.js** diagrams to visually represent the concepts and workflows.
-   **Adaptive Learning Levels**: Choose from Beginner, Intermediate, or Advanced levels to adjust the complexity of the content.
-   **Interactive Dashboard**: A modern, glassmorphism-styled UI with a dedicated code playground and diagram viewer.

## 🛠️ Tech Stack

-   **Backend**: Python, Flask, Flask-SQLAlchemy, Flask-Login
-   **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS
-   **AI Engine**: Google Gemini API (Visual & Text Generation)
-   **Visualization**: Prism.js (Syntax Highlighting), Mermaid.js (Diagrams)
-   **Database**: SQLite (Local development)

## 🚀 Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yaswanth-co/LearnSphere.git
    cd LearnSphere
    ```

2.  **Create a Virtual Environment**:
    ```bash
    # Windows
    python -m venv venv
    .\venv\Scripts\activate

    # Mac/Linux
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up Environment Variables**:
    -   Create a `.env` file in the root directory.
    -   Add your Google Gemini API Key:
        ```env
        GEMINI_API_KEY=your_api_key_here
        ```

5.  **Run the Application**:
    Start the Flask development server:
    ```bash
    python app.py
    ```
    (Ensure your virtual environment is activated)

6.  **Open in Browser**:
    Visit `http://127.0.0.1:5000` to start learning!

## 📖 Usage

1.  **Onboarding**: Select your experience level (Beginner, Intermediate, etc.) upon first visit.
2.  **Generate Content**: Enter a topic in the search bar (e.g., "Decision Trees") and hit enter.
3.  **Explore**:
    -   Read the **Explanation**.
    -   Hover over the **Code** to see the **X-Ray** insights.
    -   View the **Architecture** diagram to understand the flow.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
