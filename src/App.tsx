import "./App.css";
import { ThemeProvider, createTheme } from "@mui/material";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Design from "./Pages/DesignPage/design";
import HomeMain from "./Pages/HomePage/HomeMain"; // Thêm dòng này

const theme = createTheme({
  typography: {
    fontFamily: "Roboto", // Thay bằng font khác
  },
});

function App() {
  return (
    <>
      <ThemeProvider theme={theme}>
        <Router>
          <Routes>
            <Route path="/" element={<HomeMain />} /> {/* Đổi sang HomeMain */}
            <Route path="/design" element={<Design />} />
            <Route path="*" element={<p>Path not resolved</p>} />
          </Routes>
        </Router>
      </ThemeProvider>
    </>
  );
}

export default App;
