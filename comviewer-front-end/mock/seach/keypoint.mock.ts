import {defineMock} from "vite-plugin-mock-dev-server";
import keypoint from "../json/keypoint.json";

export default defineMock([{
    url: "/api/search/keypoint",
    body: keypoint,
    delay: 2000,
}]);