// Public surface of the anime module. Other code must import only from here.
export { default as catalogRoutes } from "./anime.routes.mjs";
export { ensureCatalogEntry } from "./catalog.service.mjs";
export { refreshCatalog } from "./catalog.refresh.service.mjs";
