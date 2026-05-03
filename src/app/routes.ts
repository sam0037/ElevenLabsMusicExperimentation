import { createBrowserRouter } from "react-router-dom";
import { InstrumentLibraryPage } from "./components/InstrumentLibraryPage";
import { RootLayout } from "./components/RootLayout";
import { MusicPage } from "./components/MusicPage";
import { MyPrayersClubPage } from "./components/MyPrayersClubPage";
import { LoopLabPage } from "./components/LoopLabPage";
import { StudioPage } from "./components/StudioPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: MyPrayersClubPage },
      { path: "music", Component: MusicPage },
      { path: "looplab", Component: LoopLabPage },
      { path: "my-prayers-club", Component: MyPrayersClubPage },
      { path: "studio", Component: StudioPage },
      { path: "instrument-library", Component: InstrumentLibraryPage },
    ],
  },
]);
