import { createSignal, For, Signal } from "solid-js";
import { Sticky } from "./LoggedInView";

export function Stickies(props: { stickies: Signal<Sticky[]>; token: string }) {
  const newStickyLoading = createSignal(false);
  return (
    <>
      <h2>Sticky Notes</h2>
      <div
        style={{
          display: "flex",
          "flex-wrap": "wrap",
          gap: "1.5rem",
          "padding-bottom": "3rem",
        }}
      >
        <For each={props.stickies[0]()}>
          {(sticky) => {
            return (
              <>
                <div class="sticky">
                  <span
                    class="deletesticky"
                    onClick={() => {
                      props.stickies[1]([
                        ...props.stickies[0]().filter(
                          (s) => s._id !== sticky._id
                        ),
                      ]);
                      fetch(
                        "https://baboola-notes-serverless-functions.netlify.app/.netlify/functions/delete-sticky",
                        {
                          method: "POST",
                          body: JSON.stringify({
                            sticky: sticky._id,
                          }),
                          headers: {
                            "content-type": "application/json",
                            "bab-auth": "Bearer " + props.token,
                          },
                        }
                      );
                    }}
                  >
                    ✕
                  </span>
                  <textarea
                    value={sticky.content}
                    placeholder="Type here"
                    onInput={(e) => {
                      fetch(
                        "https://baboola-notes-serverless-functions.netlify.app/.netlify/functions/save-sticky",
                        {
                          method: "POST",
                          body: JSON.stringify({
                            content: e.target.value,
                            existingSticky: sticky._id,
                          }),
                          headers: {
                            "content-type": "application/json",
                            "bab-auth": "Bearer " + props.token,
                          },
                        }
                      );
                    }}
                  ></textarea>
                </div>
              </>
            );
          }}
        </For>
        <div
          class={`newsticky ${newStickyLoading[0]() ? "disabled" : ""}`}
          onClick={() => {
            newStickyLoading[1](true);
            fetch(
              "https://baboola-notes-serverless-functions.netlify.app/.netlify/functions/save-sticky",
              {
                method: "POST",
                body: JSON.stringify({
                  content: "",
                }),
                headers: {
                  "content-type": "application/json",
                  "bab-auth": "Bearer " + props.token,
                },
              }
            ).then((data) => {
              data.json().then((sticky: Sticky) => {
                props.stickies[1]([...props.stickies[0](), sticky]);
                newStickyLoading[1](false);
              });
            });
          }}
        >
          {newStickyLoading[0]() ? (
            <div class="loader" />
          ) : (
            <>
              <div class="text-ultralarge">+</div>
              <p>New Sticky Note</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
