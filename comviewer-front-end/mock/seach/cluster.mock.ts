import {defineMock} from "vite-plugin-mock-dev-server";
import cluster from "../json/cluster.json";

export default defineMock([{
    url: "/api/search/cluster",
    body: cluster,
    delay: 2000,
}]);