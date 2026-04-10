import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "./components/RootLayout";
import { MusicPage } from "./components/MusicPage";
import { MyPrayersClubPage } from "./components/MyPrayersClubPage";
import { StudioPage } from "./components/StudioPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: MyPrayersClubPage },
      { path: "music", Component: MusicPage },
      { path: "my-prayers-club", Component: MyPrayersClubPage },
      { path: "studio", Component: StudioPage },
    ],
  },
]);
