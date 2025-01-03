import {defineMock} from "vite-plugin-mock-dev-server";
import keywords from "../json/keywords.json";

export default defineMock([{
    url: "/api/search",
    body: keywords,
    delay: 2000,
}]);