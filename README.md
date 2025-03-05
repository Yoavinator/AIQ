# AIQ - AI-powered Interview Question Generator

An interactive tool for practicing Amazon interview questions with AI-powered feedback. This application helps candidates prepare for interviews by providing realistic questions and intelligent feedback on their responses.

## Features

- 🎯 Amazon-style interview questions
- 🎤 Voice recording and transcription
- 🤖 AI-powered feedback on responses
- 📊 STAR method analysis
- 💡 Improvement suggestions
- 📥 Downloadable feedback reports

## Setup

1. Clone the repository:
```bash
git clone https://github.com/Yoavinator/AIQ.git
cd AIQ
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your API keys:
```
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
REACT_APP_GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key_here
```

4. Start the development server:
```bash
npm start
```

## Environment Variables

The application requires two API keys:
- `REACT_APP_OPENAI_API_KEY`: For voice transcription and feedback generation
- `REACT_APP_GOOGLE_SHEETS_API_KEY`: For fetching interview questions

## Technologies Used

- React
- OpenAI API (Whisper for transcription)
- Google Sheets API
- React Markdown
- Web Audio API

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
