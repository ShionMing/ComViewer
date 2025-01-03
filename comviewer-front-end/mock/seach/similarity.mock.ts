import {defineMock} from "vite-plugin-mock-dev-server";
import similarity from "../json/similarity.json";

export default defineMock([{
    url: "/api/similarity/post",
    body: similarity,
    delay: 2000,
}]);