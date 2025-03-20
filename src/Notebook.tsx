import StarterKit from "@tiptap/starter-kit";
import {
  createMemo,
  createSignal,
  For,
  onCleanup,
  Show,
  Signal,
} from "solid-js";
import { Notebook as NotebookType, Page } from "./LoggedInView";
import {
  getSearchParam,
  removeSearchParam,
  setSearchParam,
} from "./updateSearchParams";
import { createEditorTransaction, createTiptapEditor } from "solid-tiptap";
import Underline from "@tiptap/extension-underline";

export function Notebook(props: {
  notebookId: any;
  notebooks: Signal<NotebookType[]>;
  token: string;
}) {
  console.log(`Notebook rendered`);
  onCleanup(() => {
    removeSearchParam("selectedPage");
  });
  const selectedNotebook = createMemo(() => {
    console.log(props.notebooks[0]());
    return props.notebooks[0]().find(
      (notebook) => notebook._id === props.notebookId
    )!;
  });
  const newPageLoading = createSignal(false);
  const selectedPageId = createSignal(getSearchParam("selectedPage"));
  if (!selectedPageId[0]() && selectedNotebook().pages.length > 0) {
    selectedPageId[1](
      setSearchParam("selectedPage", selectedNotebook().pages[0]._id)
    );
  }

  function addPage() {
    newPageLoading[1](true);
    fetch(
      "https://baboola-notes-serverless-functions.netlify.app/.netlify/functions/new-page",
      {
        method: "POST",
        body: JSON.stringify({
          pageTitle: "Page " + (selectedNotebook().pages.length + 1),
          content: "",
          notebookId: selectedNotebook()._id,
        }),
        headers: {
          "content-type": "application/json",
          "bab-auth": "Bearer " + props.token,
        },
      }
    ).then(async (res) => {
      const data: Page = await res.json();
      props.notebooks[1]((v) => {
        let toReturn = [...v];
        toReturn = toReturn.map((n) => {
          if (n._id === selectedNotebook()._id) {
            n.pages.push(data);
            return { ...n };
          } else {
            return n;
          }
        });
        return toReturn;
      });

      newPageLoading[1](false);
    });
  }
  const selectedPage = createMemo(() => {
    return selectedNotebook().pages.find((p) => p._id === selectedPageId[0]());
  });

  let editorRef!: HTMLDivElement;

  const editor = createTiptapEditor(() => ({
    element: editorRef,
    extensions: [StarterKit, Underline],
    onUpdate: ({ editor }) => {
      fetch(
        "https://baboola-notes-serverless-functions.netlify.app/.netlify/functions/update-page",
        {
          method: "POST",
          body: JSON.stringify({
            notebookId: selectedNotebook()._id,
            newContent: editor.getHTML(),
            pageId: selectedPage()!._id,
          }),
          headers: {
            "content-type": "application/json",
            "bab-auth": "Bearer " + props.token,
          },
        }
      );
      props.notebooks[1]((v) => {
        v = v.map((n) => {
          if (n._id === selectedNotebook()._id) {
            n.pages = n.pages.map((p) => {
              if (p._id === selectedPage()?._id) {
                p.content = editor.getHTML();
              }
              return p;
            });
          }
          return n;
        });
        return v;
      });
    },
    content: selectedPage()!.content,
  }));

  const isItal = createEditorTransaction(editor, (editor) =>
    editor?.isActive("italic")
  );
  const isUnderln = createEditorTransaction(editor, (editor) =>
    editor?.isActive("underline")
  );
  const isBold = createEditorTransaction(editor, (editor) =>
    editor?.isActive("bold")
  );

  return (
    <>
      <div
        style={{
          height: "100%",
          display: "flex",
          "flex-direction": "column",
          "margin-right": "3rem",
        }}
      >
        <h2>{selectedNotebook().name}</h2>
        <div class="notebook-cnt grow">
          <Show
            when={selectedNotebook().pages.length}
            fallback={
              <>
                <div class="centeredflexparent">
                  <p
                    style={{
                      "margin-bottom": "1rem",
                    }}
                  >
                    This notebook doesn't have any pages yet.
                  </p>
                  <button disabled={newPageLoading[0]()} onClick={addPage}>
                    <Show when={newPageLoading[0]()}>
                      <div class="loader btn" />
                    </Show>
                    Add Page
                  </button>
                </div>
              </>
            }
          >
            <div class="nav-1">
              <h3
                style={{
                  padding: "1rem",
                }}
              >
                Pages
              </h3>
              <hr />
              <For each={selectedNotebook().pages}>
                {(page) => {
                  return (
                    <>
                      <div
                        onClick={() => {
                          selectedPageId[1](page._id);
                          setSearchParam("selectedPage", page._id);
                        }}
                        class={`nav-item ${
                          selectedPageId[0]() === page._id ? "open" : ""
                        }`}
                      >
                        {" "}
                        {page.title}
                      </div>
                    </>
                  );
                }}
              </For>
              <div
                class={`newitem ${newPageLoading[0]() ? "disabled" : ""}`}
                onClick={addPage}
              >
                {newPageLoading[0]() ? (
                  <div class="loaderonwhite btn" />
                ) : (
                  <>+</>
                )}{" "}
                New Page
              </div>
            </div>
            <div
              class="grow"
              style={{
                display: "flex",
                "flex-direction": "column",
                height: "100%",
              }}
            >
              <div class="toolbar">
                <b
                  onClick={() => {
                    editor()?.chain().toggleBold().focus().run();
                  }}
                  class={` ${isBold() ? "on" : ""}`}
                >
                  B
                </b>
                <i
                  onClick={() => {
                    editor()?.chain().toggleItalic().focus().run();
                  }}
                  class={` ${isItal() ? "on" : ""}`}
                >
                  I
                </i>
                <u
                  onClick={() => {
                    editor()?.chain().toggleUnderline().focus().run();
                  }}
                  class={` ${isUnderln() ? "on" : ""}`}
                >
                  U
                </u>
              </div>
              <h3
                style={{
                  padding: "1rem",
                }}
              >
                {selectedPage()!.title}
              </h3>
              <div ref={editorRef} class="page-main grow"></div>
            </div>
          </Show>
        </div>
      </div>
    </>
  );
}
