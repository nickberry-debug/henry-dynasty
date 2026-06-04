// buildamonster/index.tsx — Public exports for the buildamonster module.
//
// App.tsx imports the page components from here so it stays tidy.

export { default as BuildamonsterHub } from "./pages/Hub";
export { default as BuildamonsterCreate } from "./pages/Create";
export { default as BuildamonsterBattle } from "./pages/Battle";
export { useBuildamonster } from "./state/store";
