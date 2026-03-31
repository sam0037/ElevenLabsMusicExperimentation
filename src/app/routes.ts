import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "./components/RootLayout";
import { ChatPage } from "./components/ChatPage";
import { MusicPage } from "./components/MusicPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: ChatPage },
      { path: "music", Component: MusicPage },
    ],
  },
]);
