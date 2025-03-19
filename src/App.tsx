import "./App.css";
import { initialize } from "@frontegg/js";
import { createSignal, Match, Switch } from "solid-js";
import { LoggedInView } from "./LoggedInView";

function App() {
  const authStatus = createSignal<boolean>();
  const token = createSignal<string>();
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
        if (auth.isAuthenticated && auth.user?.accessToken) {
          token[1](auth.user.accessToken);
          authStatus[1](true);
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
          <LoggedInView token={token[0]()!} app={app} authStatus={authStatus} />
        </Match>
        <Match when={authStatus[0]() === undefined}>
          <div class="loader"></div>
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
