
export default class ParamHashRouter {
  constructor(routes, inithash) {
    this.routes = routes;

    window.addEventListener("hashchange", event => this.doRouting(event));

    window.location.hash = inithash;
    this.doRouting(inithash);
  }


  doRouting() {
    let [hash, queryString] = window.location.hash.substring(1).split('?');
    let hashParts = hash.split("/");
    const matchingRoute = this.routes.find(route => route.hash === hashParts[0]);

    if (!matchingRoute) {
      console.error(`No matching route found for hash: ${hashParts[0]}`);
      document.getElementById("router-view").innerHTML = "<p>Page not found</p>";
      return;
    }

    const queryParams = new URLSearchParams(queryString || '');
    matchingRoute.getTemplate(matchingRoute.target, ...hashParts.slice(1), queryParams);
  }

}