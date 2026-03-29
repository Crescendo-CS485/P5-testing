import { createBrowserRouter } from "react-router";
import Layout from "./pages/Layout";
import DiscoveryPage from "./pages/DiscoveryPage";
import ArtistPage from "./pages/ArtistPage";
import DiscussionPage from "./pages/DiscussionPage";
import BestAlbumsPage from "./pages/BestAlbumsPage";
import NewReleasesPage from "./pages/NewReleasesPage";
import GenresPage from "./pages/GenresPage";
import CommunityPage from "./pages/CommunityPage";
import ListsPage from "./pages/ListsPage";
import ListDetailPage from "./pages/ListDetailPage";
import StaticPage from "./pages/StaticPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: DiscoveryPage },
      { path: "artists/:id", Component: ArtistPage },
      { path: "discussions/:id", Component: DiscussionPage },
      { path: "best-albums", Component: BestAlbumsPage },
      { path: "new-releases", Component: NewReleasesPage },
      { path: "genres", Component: GenresPage },
      { path: "community", Component: CommunityPage },
      { path: "lists", Component: ListsPage },
      { path: "lists/:id", Component: ListDetailPage },
      { path: "info/:slug", Component: StaticPage },
    ],
  },
]);
