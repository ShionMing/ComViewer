import {defineMock} from "vite-plugin-mock-dev-server";
import focus from "../json/focus.json";

export default defineMock([{
    url: "/api/focus/posts",
    body: focus,
    delay: 2000,
}]);