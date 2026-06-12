import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { Layout } from "@/layouts";
import { Home, Dashboard, CreateJob, DLQ, Docs, NotFound } from "@/pages";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "create", element: <CreateJob /> },
      { path: "dlq", element: <DLQ /> },
      { path: "docs", element: <Docs /> },
    ],
  },

  { path: "*", element: <NotFound /> },
]);

export default function AppRoutes() {
  return <RouterProvider router={router} />;
}
