import {defineMock} from "vite-plugin-mock-dev-server";
import expression from "../json/expression.json";

export default defineMock([{
    url: "/api/search/similarpost/keywords",
    body: expression,
    delay: 2000,
}]);