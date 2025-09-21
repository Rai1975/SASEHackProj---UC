import React from "react";
import "./App.css";
import JournalCalendar from "./calendarPage";

function App() {
  return (
    <div className="App">
      <JournalCalendar apiBaseUrl={'http://127.0.0.1:8080'}/>
    </div>
  );
}

export default App;
