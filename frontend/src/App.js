import "@/App.css";
import PortfolioAgent from "@/components/portfolio-agent/PortfolioAgent";

/**
 * The widget is served on the root path. It is designed to be embedded
 * in an iframe on the Framer parent page (preetyux.work). When rendered
 * standalone, the background is transparent so the surrounding page
 * shows through when embedded.
 */
function App() {
  return (
    <div
      className="App min-h-screen w-full bg-transparent"
      data-testid="pinky-app-root"
    >
      <PortfolioAgent />
    </div>
  );
}

export default App;
