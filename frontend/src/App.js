import React from "react";
import "./App.css";
import JournalCalendar from "./calendarPage";
import EmotionRadar from "./emotionGraph";
import StimulusEmotionPage from "./emotionGraphPage";

function App() {
  return (
    <div className="App">
      {/* <JournalCalendar apiBaseUrl={'http://127.0.0.1:8080'}/> */}
      {/* <EmotionRadar
        stimulus="apple"
        emotions={{
          Anger: 0.3,
          Happiness: 0.02,
          Sadness: 0.1,
          Fear: 0.4,
          Surprise: 0.15,
          Disgust: 0.2
        }}
      /> */}
      <StimulusEmotionPage apiBaseUrl={'http://127.0.0.1:8080'}/>

    </div>
  );
}

export default App;
