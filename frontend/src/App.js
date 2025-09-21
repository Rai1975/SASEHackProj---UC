import React from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import "./App.css";
import JournalCalendar from "./calendarPage";
import EmotionRadar from "./emotionGraph";
import StimulusEmotionPage from "./emotionGraphPage";
import EntryInsight from "./EntryInsight";
import { AppBar, Toolbar, IconButton, Box, Tooltip } from "@mui/material";
import HomePage from "./HomePage";
import HomeIcon from '@mui/icons-material/Home';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

function AppContent() {
  const navigate = useNavigate();
  const apiBaseUrl = 'http://127.0.0.1:8080';
  
  return (
    <div className="App">
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Left-aligned Home Icon */}
          <Tooltip title="Home">
            <IconButton 
              edge="start" 
              color="inherit" 
              aria-label="home"
              onClick={() => navigate('/')}
            >
              <HomeIcon />
            </IconButton>
          </Tooltip>
          
          {/* Right-aligned Icons */}
          <Box>
            <Tooltip title="Calendar">
              <IconButton 
                edge="end" 
                color="inherit" 
                aria-label="calendar"
                onClick={() => navigate('/calendar')}
                sx={{ mr: 1 }}
              >
                <CalendarMonthIcon />
              </IconButton>
            </Tooltip>
            
          </Box>
        </Toolbar>
      </AppBar>

      {/*Main Content*/}
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
      {/* <StimulusEmotionPage apiBaseUrl={'http://127.0.0.1:8080'}/> */}
      {/* <HomePage apiBaseUrl={'http://127.0.0.1:8080'} /> */}

      <Routes>
        <Route path="/" element={<HomePage apiBaseUrl={apiBaseUrl} />} />
        <Route path="/calendar" element={<JournalCalendar apiBaseUrl={apiBaseUrl} />} />
        <Route path="/entry/:entryId" element={<EntryInsight apiBaseUrl={apiBaseUrl} />} />
        <Route path="/emotions" element={<StimulusEmotionPage apiBaseUrl={apiBaseUrl} />} />
        <Route path="/emotionGraphPage" element={<StimulusEmotionPage apiBaseUrl={apiBaseUrl}/>} />
      </Routes>

    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
