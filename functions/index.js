/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const os = require("os");
const path = require("path");
const fs = require("fs");

const app = express();

// Get environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Configure multer for file uploads using temp directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = os.tmpdir();
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({storage});

// Middleware
app.use(cors({
  origin: ['https://amzn-interview-q.web.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: false
}));
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.send("Amazon Interview Practice API is running on Firebase Functions");
});

// Endpoint for transcription
app.post("/transcribe", upload.single("audio"), async (req, res) => {
  console.log("Transcribe request received");
  try {
    if (!req.file) {
      console.log("No file received");
      return res.status(400).json({error: "No audio file provided"});
    }

    console.log("File received:", req.file.path);

    // Check if OpenAI API key is set
    if (!OPENAI_API_KEY) {
      console.log("OpenAI API key is not set");
      return res.json({text: "OpenAI API key is not set. Using mock response instead."});
    }

    // Fixed FormData handling with axios
    try {
      const formData = new FormData();
      formData.append("file", fs.createReadStream(req.file.path));
      formData.append("model", "whisper-1");

      console.log("Sending request to OpenAI API...");

      const response = await axios.post(
          "https://api.openai.com/v1/audio/transcriptions",
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              "Authorization": `Bearer ${OPENAI_API_KEY}`,
            },
          },
      );

      console.log("Received response from OpenAI API");

      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);

      res.json({text: response.data.text});
    } catch (apiError) {
      console.error("OpenAI API error:", apiError.message);

      // Clean up uploaded file
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      // Fall back to mock response
      return res.json({text: "Error calling OpenAI API. Using mock response instead."});
    }
  } catch (error) {
    console.error("Transcription error:", error.message);

    // Clean up uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: "Failed to transcribe audio",
      details: error.message,
    });
  }
});

// Endpoint for ChatGPT feedback
app.post("/feedback", async (req, res) => {
  console.log("Feedback request received");

  try {
    const {transcription, question, feedbackType} = req.body;

    if (!transcription) {
      console.log("No transcription provided");
      return res.status(400).json({error: "No transcription provided"});
    }

    // Check for minimum transcription length and variety
    const words = transcription.split(/\s+/).filter((word) => word.length > 0);
    const wordCount = words.length;
    const uniqueWords = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, "")));

    console.log("Transcription word count:", wordCount, "Unique words:", uniqueWords.size);

    if (wordCount < 20 || uniqueWords.size < 5) {
      console.log("Transcription too short or not diverse enough");
      return res.status(400).json({
        error: `Transcription too short or repetitive (${wordCount} words, ${uniqueWords.size} unique). Please provide a more detailed response.`,
      });
    }

    console.log("Processing feedback for question:", question);
    console.log("Feedback type:", feedbackType || "standard");

    // Check if OpenAI API key is set
    if (!OPENAI_API_KEY) {
      console.log("OpenAI API key is not set");
      return res.json({
        choices: [{
          message: {
            content: "This is a simulated feedback response since the OpenAI API key is not configured.",
          },
        }],
      });
    }

    // Update the prompt based on feedback type
    let prompt;

    if (feedbackType === "amazon_pm") {
      prompt = `As an Amazon interview coach specializing in Product Management roles, evaluate the following candidate's answer to this question: "${question}".
      
      Candidate's answer: "${transcription}"
      
      Please return a structured report in exactly this format (use proper markdown):

      ## 📊 Overall Score
      **Score:** X/10
      **Question Category:** [Leadership Principle or PM skill the question is testing]
      **Response Summary:** [2-3 word summary of candidate's performance]

      ## 📌 STAR Method Analysis
      **Situation:** [Did the candidate clearly establish context? Provide brief analysis]
      **Task:** [Was their role/responsibility clearly articulated? Provide brief analysis]
      **Action:** [Did they explain their specific actions with enough detail? Provide brief analysis]
      **Result:** [Did they quantify impact and outcomes? Provide brief analysis]

      ## 🏆 Amazon Leadership Principles Assessment
      [Evaluate how well the answer demonstrated relevant Amazon Leadership Principles]
      - **Customer Obsession:** [Assessment]
      - **Ownership:** [Assessment]
      - **Invent and Simplify:** [Assessment]
      - Include only the principles that were relevant to this answer

      ## 🧠 PM-Specific Skills Assessment
      - **Product Sense:** [Assessment]
      - **Strategic Thinking:** [Assessment]
      - **Data-Driven Decision Making:** [Assessment]
      - **Cross-Functional Collaboration:** [Assessment]

      ## 🚀 Improvement Suggestions
      [Provide 3-4 specific ways the candidate could strengthen their answer]
      1. [First suggestion]
      2. [Second suggestion]
      3. [Third suggestion]

      ## ⚡ Summary & Key Takeaways
      [Brief summary of the candidate's performance, highlighting strengths and listing 2-3 actionable improvements]`;
    } else {
      prompt = `As an Amazon interview coach, evaluate the following candidate's answer to this question: "${question}".
      
      Candidate's answer: "${transcription}"
      
      Please return a structured report in exactly this format (use proper markdown):

      ## 📊 Overall Score
      **Score:** X/10
      **Question Category:** [Category]
      **Response Summary:** [2-3 word summary]

      ## 📌 Answer Structure Analysis
      [Analysis of the answer structure and completeness]

      ## 🚀 Improvement Suggestions
      [Provide 3-4 specific ways the candidate could strengthen their answer]
      1. [First suggestion]
      2. [Second suggestion]
      3. [Third suggestion]

      ## ⚡ Summary & Key Takeaways
      [Brief summary with actionable improvements]`;
    }

    // Calculate token estimate for GPT-4 (approximate)
    const inputTokenEstimate = (prompt.length / 4);
    const model = "gpt-4";
    const maxTokens = Math.min(4000, 8192 - Math.ceil(inputTokenEstimate));

    console.log(`Using model: ${model}, estimated input tokens: ~${Math.ceil(inputTokenEstimate)}, max output tokens: ${maxTokens}`);

    // Call OpenAI API for feedback generation
    const openaiResponse = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: model,
          messages: [
            {
              role: "system",
              content: feedbackType === "amazon_pm" ?
              "You are an expert Amazon interview coach specializing in Product Management roles. You have extensive knowledge of the STAR method and Amazon Leadership Principles." :
              "You are an Amazon interview coach helping candidates improve their interview skills.",
            },
            {role: "user", content: prompt},
          ],
          max_tokens: maxTokens,
          temperature: 0.1,
        },
        {
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        },
    );

    console.log("Received response from OpenAI for feedback");
    res.json(openaiResponse.data);
  } catch (error) {
    console.error("Feedback error:", error.message);

    if (error.response && error.response.data) {
      console.error("OpenAI API error details:", JSON.stringify(error.response.data));

      if (error.response.status === 429) {
        return res.status(429).json({
          error: "OpenAI rate limit exceeded. Please try again later.",
          details: error.response.data,
        });
      }

      if (error.response.status === 401) {
        return res.status(500).json({
          error: "Authentication error with AI provider. Please contact support.",
          details: "API key may be invalid or expired",
        });
      }
    }

    res.status(500).json({
      error: "Failed to generate feedback",
      details: error.message,
    });
  }
});

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);

// For local development
if (process.env.NODE_ENV === "development") {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
