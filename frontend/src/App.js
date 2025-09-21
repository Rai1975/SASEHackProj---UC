import React from "react";
import "./App.css";
import JournalCalendar from "./calendarPage";
import EmotionRadar from "./emotionGraph";
import StimulusEmotionPage from "./emotionGraphPage";
import { AppBar, Toolbar, IconButton, Box } from "@mui/material";
import HomeIcon from '@mui/icons-material/Home';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

function App() {
  return (
    <div className="App">
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Left-aligned Home Icon */}
          <IconButton edge="start" color="inherit" aria-label="home">
            <HomeIcon />
          </IconButton>
          
          {/* Right-aligned Calendar Icon */}
          <Box>
            <IconButton edge="end" color="inherit" aria-label="calendar">
              <CalendarMonthIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/*Main Content*/}
      <JournalCalendar apiBaseUrl={'http://127.0.0.1:8080'}/>
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
      {/* <StimulusEmotionPage apiBaseUrl={'http://127.0.0.1:8080'}/> */}

    </div>
  );
}

export default App;
