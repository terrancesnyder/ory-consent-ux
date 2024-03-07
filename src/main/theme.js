import { createTheme } from "@mui/material/styles";

// https://stackoverflow.com/questions/64557510/how-can-i-check-the-type-of-material-ui-theme-in-react-js-light-or-dark
// Create a theme instance.
const theme = createTheme({
  overrides: {
    MuiPaper: {
      root: {
        padding: "10px",
        marginBottom: "10px",
      },
    },
  },
  button: {
    textTransform: "none",
  },
  typography: {
    fontFamily: "Inter",
    htmlFontSize: 18,
    h1: {
      fontSize: "4em",
      fontWeight: "500",
      color: "#2d2d2d",
    },
    hero: {
      fontSize: "2em",
      fontWeight: "500",
      color: "#1d1d1d",
      display: "block",
      lineHeight: "1.3em",
    },
    h2: {
      fontSize: "3em",
      fontWeight: "400",
      color: "#2d2d2d",
    },
    h3: {
      fontSize: "2em",
      fontWeight: "500",
      color: "#2d2d2d",
    },
    h4: {
      fontSize: "1.5em",
      fontWeight: "400",
      color: "#2d2d2d",
    },
    h5: {
      fontSize: "1.3em",
      fontWeight: "300",
      color: "#2d2d2d",
    },
    h6: {
      fontSize: "1.1em",
      fontWeight: "300",
      color: "#2d2d2d",
    },
    title: {
      fontSize: "1.05em",
      fontWeight: "600",
      color: "#2d2d2d",
      display: "block",
    },
    label: {
      fontSize: "1.05em",
      fontWeight: "600",
      color: "#2d2d2d",
      display: "block",
    },
    p1: {
      lineHeight: "1.6em",
      fontSize: "0.92em",
      fontWeight: 400,
      color: "#2d2d2d",
      margin: "1em 0em 1em 0em",
      display: "block",
    },
    p: {
      fontSize: "1em",
      margin: "1em 0em 1em 0em",
      display: "block",
    },
    metric: {
      fontSize: "1em",
      fontWeight: 600,
      color: "#2d2d2d",
    },
    metric_value: {
      fontSize: "1.5em",
      fontWeight: 800,
      color: "#2d2d2d",
    },
    subtitle: {
      lineHeight: "1.6em",
      fontSize: "0.90em",
      fontWeight: 400,
      color: "#5d5d5d",
      margin: "1em 0em 1em 0em",
      display: "block",
    },
    small: {
      fontSize: ".8em",
      fontWeight: "400",
      color: "#5d5d5d",
      display: "block",
      margin: "0px",
    },
    description: {
      fontSize: ".88em",
      fontWeight: "400",
      color: "#5d5d5d",
      display: "block",
      margin: "0px",
    },
    button: {
      textTransform: "none",
    },
    body: {
      fontSize: "12",
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: "#fff",
          foregroundColor: "#2d2d2d",
          color: "#2d2d2d",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          ".MuiInputBase-inputSizeSmall": {
            fontSize: "0.9em",
            color: "#1d1d1d",
          },
          ".MuiInputLabel-sizeSmall": {
            fontSize: "0.8em",
            color: "#101010",
          },
          ".MuiInputLabel-shrink": {
            fontSize: "0.8em",
            color: "#1d1d1d",
            fontWeight: "600",
            backgroundColor: "#fff",
            padding: "2px",
            transform: "translate(12px, -9px) scale(1.0)",
          },
        },
      },
    },
  },
  palette: {
    mode: "light",
    primary: {
      main: "#3367d6",
    },
    secondary: {
      main: "#2d2d2d",
    },
    error: {
      main: "#f40000",
    },
  },
});

// custom for our appbar
theme.shadows[1] = `1px 1px 3px 1px #0F101010`;
theme.shadows[2] = `1px 1px 3px 1px #0F101010`;
theme.shadows[3] = `1px 1px 3px 1px #0F101010`;
theme.shadows[4] = `1px 1px 3px 1px #0F101010`;
theme.shadows[24] = `1px 1px 1px 0px #eee`;

export default theme;
