import { FronteggApp } from "@frontegg/js";
import { createSignal, Match, Show, Switch } from "solid-js";
import { setSearchParam } from "./updateSearchParams";
import { Stickies } from "./Stickies";
export enum ScreenSizes {
  Mobile = 980,
}
export interface Sticky {
  content: string;
  _id: any;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: any;
  notebooks: any[];
  stickies: Sticky[];
  email: string;
}
export function LoggedInView(props: {
  app: FronteggApp;
  token: string;
  authStatus: [() => boolean | undefined, (value: boolean | undefined) => void];
}) {
  const stickies = createSignal<Sticky[]>([]);
  const user = createSignal<User>();

  fetch(
    "https://baboola-notes-serverless-functions.netlify.app/.netlify/functions/user",
    {
      method: "POST",
      body: JSON.stringify({ name: "Jamstack Explorers" }),
      headers: {
        "content-type": "application/json",
        "bab-auth": "Bearer " + props.token,
      },
    }
  )
    .then(async (res) => {
      const data: User = await res.json();
      user[1](data);
      stickies[1](data.stickies);
    })
    .catch(async (err) => {
      console.log(err);
    });
  return (
    <>
      <Show fallback={<div class="loader"></div>} when={user[0]()}>
        <div
          style={{
            width: "100vw",
            height: "100vh",
            margin: 0,
            padding: "0",
          }}
        >
          <Layout />
        </div>
      </Show>
    </>
  );
  function Layout() {
    const params = new URLSearchParams(window.location.search);
    const defaultTab = "stickies";
    const isMobile = window.innerWidth < ScreenSizes.Mobile;
    const selectedTab = createSignal(
      params.get("selectedTab") ?? setSearchParam("selectedTab", defaultTab)
    );
    const navOpen = createSignal(false);
    return (
      <>
        <div
          style={{
            display: "flex",
            height: "100vh",
            position: "relative",
            "max-width": "100vw",
            "overflow-x": "hidden",
            "flex-direction": isMobile ? "column" : "row",
          }}
        >
          <Show when={isMobile}>
            <div class="mobile-header">
              <div
                onClick={() => {
                  navOpen[1](true);
                }}
                class="nav-item"
                style={{
                  height: "100%",
                  "aspect-ratio": 1,
                  color: "black",
                }}
              >
                ☰
              </div>
            </div>
          </Show>
          <div
            class="nav-0"
            style={
              isMobile
                ? `position: fixed; z-index:1000; ${
                    navOpen[0]() ? "" : "transform:translateX(-115%)"
                  }`
                : ""
            }
          >
            <div class="logo">
              <h1
                style={{
                  display: "flex",
                  "align-items": "center",
                }}
              >
                <img
                  src="/Picture1.png"
                  style={{
                    height: "1.5em",
                  }}
                />
                Baboola Notes
              </h1>
            </div>
            <Show when={isMobile}>
              <div
                class="closenav"
                onClick={() => {
                  navOpen[1](false);
                }}
              >
                ✕
              </div>
            </Show>
            <div
              class="grow"
              style={{
                padding: 0,
              }}
            >
              <hr />
              <div
                onClick={() => {
                  if (isMobile) {
                    navOpen[1](false);
                  }
                  setSearchParam("selectedTab", "stickies");
                  selectedTab[1]("stickies");
                }}
                class={`nav-item ${
                  selectedTab[0]() === "stickies" ? "open" : ""
                }`}
              >
                Sticky Notes
              </div>

              <hr />
              <h3
                style={{
                  margin: "0.5rem 0.5rem ",
                }}
              >
                Notebooks
              </h3>
              <div class="nav-item notebook">Book 1</div>
              <div class="nav-item notebook">Book 2</div>
              <div class="nav-item notebook">Book 3</div>
              <div class="nav-item notebook">Book 4</div>
            </div>

            <div
              style={{ background: "#e5e5e5", "border-top": "1px solid #bbb" }}
            >
              <div
                style={{
                  "margin-bottom": "1rem",
                }}
              >
                {user[0]()!.email}
              </div>
              <button
                onClick={() => {
                  props.app.logout();
                  props.authStatus[1](false);
                }}
              >
                Log out
              </button>
            </div>
          </div>
          <div
            style={{
              "margin-left": isMobile ? "1rem" : "",
            }}
          >
            <Switch>
              <Match when={selectedTab[0]() === "stickies"}>
                <Stickies token={props.token} stickies={stickies} />
              </Match>
            </Switch>
          </div>
        </div>
      </>
    );
  }
}
