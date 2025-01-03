import Layout from "@/components/Layout.tsx";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {createBrowserRouter, RouterProvider} from "react-router-dom";

const router = createBrowserRouter([
    {
        path: "/:userId",
        async lazy() {
            const {default: PostPage} = await import("@/pages/PostPage");
            return {Component: PostPage};
        },
    },
    {
        path: "/:userId/post/:postId",
        async lazy() {
            const {default: PostDetailPage} = await import("@/pages/PostDetailPage");
            return {Component: PostDetailPage};
        },
    },
    {
        path: "/baseline/:userId",
        async lazy() {
            const {default: PostPage} = await import("@/pages/PostPage");
            return {Component: PostPage};
        },
    },
    {
        path: "/baseline/:userId/post/:postId",
        async lazy() {
            const {default: PostDetailPage} = await import("@/pages/PostDetailPage");
            return {Component: PostDetailPage};
        },
    },
]);

const queryClient = new QueryClient();

export default function App() {
    return (
        <>
            <QueryClientProvider client={queryClient}>
                <Layout>
                    <RouterProvider router={router}/>
                </Layout>
            </QueryClientProvider>
        </>
    );
}
