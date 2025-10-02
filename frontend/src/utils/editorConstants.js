// Editor Layout Constants
export const NAVBAR_HEIGHT = 72;
export const SIDEBAR_WIDTH = 350;
export const SLIDES_BAR_HEIGHT = 160;
export const ZOOM_MIN = 50;
export const ZOOM_MAX = 200;
export const ZOOM_STEP = 10;

// Button Styles
export const BUTTON_STYLES = {
  toggleArrow: {
    position: "absolute",
    width: "20px",
    height: "60px",
    backgroundColor: "#f8f9fa",
    border: "1px solid #ddd",
    borderRadius: "0 6px 6px 0",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer"
  },
  zoomButton: {
    width: "28px",
    height: "28px",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "bold"
  },
  slideToggle: {
    position: "absolute",
    top: "-20px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "60px",
    height: "20px",
    backgroundColor: "#f8f9fa",
    border: "1px solid #ddd",
    borderBottom: "none",
    borderRadius: "6px 6px 0 0",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer"
  }
};
