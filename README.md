# MindLine - say it loud, see it clearly

An innovative approach to journaling.

## 🚀 Features

- __Voice-to-Text Journaling:__ Simply speak your mind and MindLine transcribes your thoughts into text entries automatically.

- __Journal via Phone Call:__ Using Twilio integration, you can call a dedicated number to record your journal entries on the go.

- __AI-Powered Insight Generation:__ Leverages OpenAI and custom machine learning models to analyze your entries for sentiment, key topics, and emotional tone.

- __Data Visualization:__ Understand your mental landscape over time with clear and intuitive data visualizations of your insights.

- __Secure & Private:__ Built on Supabase with PostgreSQL, ensuring your personal journal entries are always secure.

## ✨ What it Does

MindLine transcribes your vocal input and processes it into specific insights tied to certain stimuli. It's designed for anyone who finds traditional typing-based journaling a chore. Just talk, and the app does the rest.

Once your voice is transcribed, our backend gets to work. It uses an AI model to perform sentiment analysis and a PyTorch-based classifier to categorize the entry's underlying themes (e.g., work-related stress, family, personal growth). The result is more than just a diary; it's a clear, analyzed reflection of your thoughts, helping you identify patterns and gain a deeper understanding of yourself.

## 💻 Technologies Used

Here are the following programming languages, frameworks, libraries, and tools used in our project.

- __Frontend:__ React, MaterialUI

- __Backend:__ Python/Flask

- __Database:__ Supabase, PostgreSQL

- __AI/ML:__ OpenAI API (for transcription and summarization), PyTorch & Scikit-learn (for the Random Forest Classifier Model)

- __Other:__ Twilio (for phone call support), Git


## 🤝 Team Members

- __Raihan Rafeek__ - backend development
- __Sai Porumamilla__ - frontend development

## 🔮 Future Enhancements

We have a number of ideas for how we can continue to build upon MindLine:

- __Advanced Emotion Tracking:__ Move beyond simple sentiment to track a wider range of emotions over time.

- __Personalized Prompts:__ Generate intelligent journaling prompts based on a user's past entries to encourage deeper reflection.

- __Integration with Calendars:__ Correlate journal entries with events from Google Calendar or Outlook to find connections between activities and mood.

- __Weekly Email Summaries:__ Send users a weekly digest of their insights and patterns.