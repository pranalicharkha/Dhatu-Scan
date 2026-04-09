import { AppProvider } from "./context/AppContext";
import AppRouter from "./routes";

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
