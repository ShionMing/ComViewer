import {defineMock} from "vite-plugin-mock-dev-server";
import questions from "../json/questions.json";

export default defineMock([{
    url: "/api/reading/question",
    body: questions,
    delay: 2000,
}]);