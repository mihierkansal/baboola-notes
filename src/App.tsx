import solidLogo from "./assets/solid.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { initialize } from "@frontegg/js";
import { createSignal, Match, Switch } from "solid-js";

function App() {
  const authStatus = createSignal<boolean>();
  const app = initialize({
    contextOptions: {
      baseUrl: import.meta.env.VITE_FRONTEGG_DOMAIN,
      clientId: import.meta.env.VITE_FRONTEGG_CLIENT_ID,
      appId: import.meta.env.VITE_FRONTEGG_APPLICATION_ID,
    },
    hostedLoginBox: true,
  });
  app.ready(() => {
    app.store.subscribe(() => {
      const { auth } = app.store.getState();
      if (!auth.isLoading) {
        if (auth.isAuthenticated) {
          authStatus[1](true);
          console.log(auth.user?.accessToken);
        } else {
          app.loginWithRedirect();
        }
      }
    });
  });

  return (
    <>
      <Switch>
        <Match when={authStatus[0]() === true}>
          <div>
            <a href="https://vite.dev" target="_blank">
              <img src={viteLogo} class="logo" alt="Vite logo" />
            </a>
            <a href="https://solidjs.com" target="_blank">
              <img src={solidLogo} class="logo solid" alt="Solid logo" />
            </a>
          </div>
          <h1>Vite + Solid</h1>
          <div class="card">
            <button
              onClick={() => {
                app.logout();
                authStatus[1](false);
              }}
            >
              Logout
            </button>
            <p>
              Edit <code>src/App.tsx</code> and save to test HMR
            </p>
          </div>

          <p class="read-the-docs">
            Click on the Vite and Solid logos to learn more
          </p>
        </Match>
        <Match when={authStatus[0]() === undefined}>
          <p>Loading...</p>
        </Match>
        <Match when={authStatus[0]() === false}>
          <p>You're logged out.</p>
          <a
            onClick={() => {
              app.loginWithRedirect();
            }}
          >
            Log in
          </a>
        </Match>
      </Switch>
    </>
  );
}

export default App;
