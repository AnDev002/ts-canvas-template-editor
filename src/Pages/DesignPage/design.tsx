import './design.css'
import DesignContent from './Components/DesignContent/designContent'
import { ThemeProvider, createTheme, styled, useTheme, alpha } from '@mui/material/styles';
interface DesignProps {}

const editorTheme = createTheme({
    palette: {
        primary: {
            main: '#000000', // Black
            contrastText: '#ffffff',
        },
        secondary: { // Also making secondary black for consistency, or choose another dark color
            main: '#333333', // Dark grey, or '#000000' for pure black
            contrastText: '#ffffff',
        },
    },
    typography: {
        fontFamily: 'Inter, sans-serif', // Ensuring Inter font is applied via theme
         button: {
            textTransform: 'none' // Optional: prevent uppercase buttons if desired
        }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                // Example: ensure outlined primary buttons also use black
                outlinedPrimary: {
                    borderColor: '#000000',
                    color: '#000000',
                    '&:hover': {
                        borderColor: alpha('#000000', 0.7),
                        backgroundColor: alpha('#000000', 0.04),
                    }
                }
            }
        },
        MuiSlider : {
            styleOverrides: {
                root: {
                    // color: '#000000', // This will make the slider track black if it uses primary color
                }
            }
        }
    }
});
export default function Design({}: DesignProps) {
    return (
        <>
            <ThemeProvider theme={editorTheme}>
                <DesignContent />
            </ThemeProvider>
        </>
    )
}
