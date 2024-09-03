import { test, expect, type Page } from "@playwright/test";

//pageのurlを指定
//例で使用されたサイトはTodoアプリです
test.beforeEach(async ({ page }) => {
  await page.goto("https://demo.playwright.dev/todomvc");
});

//配列
const TODO_ITEMS = [
  "buy some cheese",
  "feed the cat",
  "book a doctors appointment",
] as const;

test.describe("New Todo", () => {
  //アイテムを追加できるか確認する
  test("should allow me to add todo items", async ({ page }) => {
    // ロケーターで枠内の内容を取得
    const newTodo = page.getByPlaceholder("What needs to be done?");

    //配列の内容を入力
    await newTodo.fill(TODO_ITEMS[0]);
    //Enterを押す
    await newTodo.press("Enter");

    // 1個目が表示されるか確認
    await expect(page.getByTestId("todo-title")).toHaveText([TODO_ITEMS[0]]);

    // 2個目を入力
    await newTodo.fill(TODO_ITEMS[1]);
    await newTodo.press("Enter");

    // 実行した時に表示で2個になっていることを確認
    await expect(page.getByTestId("todo-title")).toHaveText([
      TODO_ITEMS[0],
      TODO_ITEMS[1],
    ]);

    await checkNumberOfTodosInLocalStorage(page, 2);
  });

  //アイテムが追加された後に入力フィールドが空になることを確認する
  test("should clear text input field when an item is added", async ({
    page,
  }) => {
    // 同上
    const newTodo = page.getByPlaceholder("What needs to be done?");

    // 配列の0番目を入力
    await newTodo.fill(TODO_ITEMS[0]);
    //Enterを押す
    await newTodo.press("Enter");

    // 入力フィールドが空であることを確かめる
    await expect(newTodo).toBeEmpty();
    //ローカルストレージのtodo項目が一であることを確認
    await checkNumberOfTodosInLocalStorage(page, 1);
  });

  //全てのアイテムを完了状態にする
  test("should append new items to the bottom of the list", async ({
    page,
  }) => {
    // 3つのアイテムを作成
    await createDefaultTodos(page);

    // カウンター表示が正しくなされていることを確認する
    const todoCount = page.getByTestId("todo-count");

    await expect(page.getByText("3 items left")).toBeVisible();
    //カウンターに表示される文字を確認する
    await expect(todoCount).toHaveText("3 items left");
    await expect(todoCount).toContainText("3");
    //テキストに3を含んでいることを確認する
    await expect(todoCount).toHaveText(/3/);

    // リストの内容を確認
    await expect(page.getByTestId("todo-title")).toHaveText(TODO_ITEMS);
    // ローカルストレージに保存されたアイテムの数が3であることを確認する
    await checkNumberOfTodosInLocalStorage(page, 3);
  });
});

//全てのアイテムを完了状態にするテスト
test.describe("Mark all as completed", () => {
  test.beforeEach(async ({ page }) => {
    //三つのアイテムを作成する
    await createDefaultTodos(page);
    //ローカルストレージに保存されていることを確認する
    await checkNumberOfTodosInLocalStorage(page, 3);
  });

  // テストの後にローカルストレージに3つのアイテムがあることを確認する
  test.afterEach(async ({ page }) => {
    await checkNumberOfTodosInLocalStorage(page, 3);
  });

  //全てのTodoアイテムを完了状態にする機能を確認する
  test("should allow me to mark all items as completed", async ({ page }) => {
    // 全て完了のチェックボックスをチェックする
    await page.getByLabel("Mark all as complete").check();

    //アイテムにcompletedクラスを持つことを確認する
    await expect(page.getByTestId("todo-item")).toHaveClass([
      "completed",
      "completed",
      "completed",
    ]);
    // 完了状態にアイテムがローカルストレージに3つあることを確認する
    await checkNumberOfCompletedTodosInLocalStorage(page, 3);
  });

  //完了状態の解除テスト
  test("should allow me to clear the complete state of all items", async ({
    page,
  }) => {
    const toggleAll = page.getByLabel("Mark all as complete");
    // チェックボックスをクリックした後チェックを外す
    await toggleAll.check();
    await toggleAll.uncheck();

    // 空の配列であることを確認する
    await expect(page.getByTestId("todo-item")).toHaveClass(["", "", ""]);
  });
});

// カウンターのテストです
test.describe("Counter", () => {
  test("should display the current number of todo items", async ({ page }) => {
    // 新しくアイテムを入力するためのフィールドを取得する
    const newTodo = page.getByPlaceholder("What needs to be done?");

    // 現在のTodoアイテムの数を表示するカウンター要素を取得する
    const todoCount = page.getByTestId("todo-count");

    // 配列の最初のアイテムを入力する
    await newTodo.fill(TODO_ITEMS[0]);
    // Enterを押す
    await newTodo.press("Enter");
    // カウンター要素に”1”というテキストが含んでいることを確認する
    await expect(todoCount).toContainText("1");

    // 配列の二つ目のアイテムを入力する
    await newTodo.fill(TODO_ITEMS[1]);
    // Enterを押す
    await newTodo.press("Enter");
    // カウンター要素に”2”というテキストが含んでいることを確認する
    await expect(todoCount).toContainText("2");

    // ローカルストレージに二つのアイテムが保存されていることを確認する
    await checkNumberOfTodosInLocalStorage(page, 2);
  });
});

// Clear completedボタンの機能を確認する
test.describe("Clear completed button", () => {
  test.beforeEach(async ({ page }) => {
    // テスト前にアイテムを作成する
    await createDefaultTodos(page);
  });

  // ボタンのテキスト表示を確認
  test("should display the correct text", async ({ page }) => {
    // アイテムを完了状態にするためにチェックボックスをチェックする
    await page.locator(".todo-list li .toggle").first().check();
    await expect(
      // ボタンが表示され、アイテムが削除できることを確認する
      page.getByRole("button", { name: "Clear completed" })
    ).toBeVisible();
  });

  // 完了したアイテムを削除する動作確認
  test("should remove completed items when clicked", async ({ page }) => {
    const todoItems = page.getByTestId("todo-item");
    // アイテムを完了するためにチェックボックスをクリック
    await todoItems.nth(1).getByRole("checkbox").check();
    // ボタンをクリック
    await page.getByRole("button", { name: "Clear completed" }).click();
    // 残りのアイテムが2つであることを確認
    await expect(todoItems).toHaveCount(2);
    // 削除されていないアイテムが正しく残っているかどうか確認する
    await expect(todoItems).toHaveText([TODO_ITEMS[0], TODO_ITEMS[2]]);
  });

  // 完了したアイテムがない場合のボタン表示
  test("should be hidden when there are no items that are completed", async ({
    page,
  }) => {
    // 最初のアイテムをクリックする
    await page.locator(".todo-list li .toggle").first().check();
    // 完了アイテムを削除する
    await page.getByRole("button", { name: "Clear completed" }).click();
    // 全てのアイテムが削除された後にボタンが非表示になることを確認
    await expect(
      page.getByRole("button", { name: "Clear completed" })
    ).toBeHidden();
  });
});

// データの永続性を確認
// ユーザーがリロードしてもアイテムの状態が保持されることを確認
test.describe("Persistence", () => {
  test("should persist its data", async ({ page }) => {
    // 入力するテキストボックスを取得
    const newTodo = page.getByPlaceholder("What needs to be done?");
    // 最初のアイテムを作成してEnterを押す
    for (const item of TODO_ITEMS.slice(0, 2)) {
      await newTodo.fill(item);
      await newTodo.press("Enter");
    }
    // リストに追加されたアイテムを取得
    const todoItems = page.getByTestId("todo-item");
    const firstTodoCheck = todoItems.nth(0).getByRole("checkbox");
    await firstTodoCheck.check();
    // アイテムが表示されていることを確認
    await expect(todoItems).toHaveText([TODO_ITEMS[0], TODO_ITEMS[1]]);
    // 最初のアイテムがチェックされていることを確認
    await expect(firstTodoCheck).toBeChecked();
    // 最初のアイテムがcompletedクラスを持っていることを確認
    await expect(todoItems).toHaveClass(["completed", ""]);

    // 完了状態のTodoアイテムが一つあることを確認
    await checkNumberOfCompletedTodosInLocalStorage(page, 1);

    // ページをリロードする
    await page.reload();
    // テキストの内容を確認
    await expect(todoItems).toHaveText([TODO_ITEMS[0], TODO_ITEMS[1]]);
    // チェック状態を確認
    await expect(firstTodoCheck).toBeChecked();
    // クラスの状態を確認
    await expect(todoItems).toHaveClass(["completed", ""]);
  });
});

async function createDefaultTodos(page: Page) {
  const newTodo = page.getByPlaceholder("What needs to be done?");

  for (const item of TODO_ITEMS) {
    await newTodo.fill(item);
    await newTodo.press("Enter");
  }
}

async function checkNumberOfTodosInLocalStorage(page: Page, expected: number) {
  return await page.waitForFunction((e) => {
    return JSON.parse(localStorage["react-todos"]).length === e;
  }, expected);
}

async function checkNumberOfCompletedTodosInLocalStorage(
  page: Page,
  expected: number
) {
  return await page.waitForFunction((e) => {
    return (
      JSON.parse(localStorage["react-todos"]).filter(
        (todo: any) => todo.completed
      ).length === e
    );
  }, expected);
}
