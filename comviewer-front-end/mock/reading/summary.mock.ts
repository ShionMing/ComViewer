import {defineMock} from "vite-plugin-mock-dev-server";
import summary from "../json/summary.json";

export default defineMock([{
    url: "/api/summarize/post",
    body: summary,
    delay: 2000,
}]);