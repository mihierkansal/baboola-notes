import StarterKit from "@tiptap/starter-kit";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  Show,
  Signal,
} from "solid-js";
import { Notebook as NotebookType, Page } from "./LoggedInView";
import { getSearchParam, setSearchParam } from "./updateSearchParams";
import { createEditorTransaction, createTiptapEditor } from "solid-tiptap";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";

export function Notebook(props: {
  notebookId: any;
  notebooks: Signal<NotebookType[]>;
  token: string;
}) {
  console.log(`Notebook rendered`);

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

  createEffect(() => {
    if (selectedNotebook().pages.length && !selectedPage()) {
      selectedPageId[1](
        setSearchParam("selectedPage", selectedNotebook().pages[0]._id)
      );
    }
  });
  let editorRef!: HTMLDivElement;

  const editor = createTiptapEditor(() => ({
    element: editorRef,
    extensions: [
      StarterKit,
      Underline,
      Image.configure({
        allowBase64: true,
        inline: true,
      }),
    ],
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
    content: selectedPage()?.content,
  }));
  document.onpaste = (e) => {
    const item = e.clipboardData?.items[0];
    if (!item?.type.includes("image/")) {
      return;
    }
    if (!editor()!.isActive) {
      return;
    }
    e.preventDefault();
    const file = item.getAsFile();
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageSrc = e.target!.result!.toString(); // Base64 image source
      console.log(imageSrc);
      editor()!.commands.setImage({
        src: imageSrc,
      });
    };
    reader.readAsDataURL(file!);
  };
  const isItal = createEditorTransaction(editor, (editor) =>
    editor?.isActive("italic")
  );
  const isUnderln = createEditorTransaction(editor, (editor) =>
    editor?.isActive("underline")
  );
  const isBold = createEditorTransaction(editor, (editor) =>
    editor?.isActive("bold")
  );
  const isUl = createEditorTransaction(editor, (editor) =>
    editor?.isActive("bulletList")
  );
  const isOl = createEditorTransaction(editor, (editor) =>
    editor?.isActive("orderedList")
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
        <input
          contentEditable
          style={{
            outline: "none",
          }}
          class="h2"
          onInput={(e) => {
            fetch(
              "https://baboola-notes-serverless-functions.netlify.app/.netlify/functions/rename-notebook",
              {
                method: "POST",
                body: JSON.stringify({
                  notebook: selectedNotebook()._id,
                  newName: e.target.value,
                }),
                headers: {
                  "content-type": "application/json",
                  "bab-auth": "Bearer " + props.token,
                },
              }
            );
            props.notebooks[1]((v) => {
              return [
                ...v.map((n) => {
                  if (n._id === selectedNotebook()._id) {
                    n.name = e.target.value;
                  }
                  return { ...n };
                }),
              ];
            });
          }}
          value={selectedNotebook().name}
        ></input>

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
                <span
                  style={{
                    "aspect-ratio": "4",
                  }}
                  onClick={() => {
                    editor()?.chain().toggleOrderedList().focus().run();
                  }}
                  class={` ${isOl() ? "on" : ""}`}
                >
                  Numbered List
                </span>
                <span
                  style={{
                    "aspect-ratio": "3.5",
                  }}
                  onClick={() => {
                    editor()?.chain().toggleBulletList().focus().run();
                  }}
                  class={` ${isUl() ? "on" : ""}`}
                >
                  Bulleted List
                </span>
                <span
                  style={{
                    "aspect-ratio": 3.5,
                  }}
                  onClick={() => {
                    editor()!.chain().focus().sinkListItem("listItem").run();
                  }}
                >
                  Start sub-list
                </span>
                <span
                  style={{
                    "aspect-ratio": 3.5,
                  }}
                  onClick={() => {
                    editor()!.chain().focus().liftListItem("listItem").run();
                  }}
                >
                  End sub-list
                </span>
              </div>
              <input
                class="h3"
                style={{
                  outline: "none",
                  padding: "1rem",
                }}
                contentEditable
                onInput={(e) => {
                  fetch(
                    "https://baboola-notes-serverless-functions.netlify.app/.netlify/functions/update-page",
                    {
                      method: "POST",
                      body: JSON.stringify({
                        notebookId: selectedNotebook()._id,
                        newName: e.target.value,
                        pageId: selectedPage()!._id,
                      }),
                      headers: {
                        "content-type": "application/json",
                        "bab-auth": "Bearer " + props.token,
                      },
                    }
                  );
                  props.notebooks[1]((v) => {
                    return [
                      ...v.map((item) => {
                        if (item._id === selectedNotebook()!._id) {
                          item.pages = [
                            ...item.pages.map((page) => {
                              if (page._id === selectedPage()!._id) {
                                page.title = e.target.value;
                              }
                              return { ...page };
                            }),
                          ];
                        }
                        return { ...item };
                      }),
                    ];
                  });
                }}
                value={selectedPage()?.title}
              />
              <div ref={editorRef} class="page-main grow"></div>
            </div>
          </Show>
        </div>
      </div>
    </>
  );
}
