import {defineMock} from "vite-plugin-mock-dev-server";
import answer from "../json/answer.json";

export default defineMock([{
    url: "/api/reading/answer",
    body: answer,
    delay: 2000,
}]);