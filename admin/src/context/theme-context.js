import { createContext } from "react";

// Để riêng file này vì Vite Fast Refresh chỉ hoạt động khi file .jsx chỉ export component
export const ThemeContext = createContext(null);
