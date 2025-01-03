import {defineMock} from "vite-plugin-mock-dev-server";
import circle from "../json/circle.json";

export default defineMock([{
    url: "/api/search/circle",
    body: circle,
    delay: 2000,
}]);