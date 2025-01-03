import {defineMock} from "vite-plugin-mock-dev-server";
import posts from "./json/posts.json";

export default defineMock([{
    url: "/api/posts",
    body: posts,
    delay: 2000,
}]);