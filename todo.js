(function () {
  "use strict";

  var STORAGE_KEY = "todos";

  var state = {
    todos: loadTodos(),
    filter: "all",
    editingId: null
  };

  var form = document.getElementById("todo-form");
  var input = document.getElementById("todo-input");
  var list = document.getElementById("todo-list");
  var itemsLeft = document.getElementById("items-left");
  var clearCompletedBtn = document.getElementById("clear-completed");
  var emptyState = document.getElementById("empty-state");
  var filtersEl = document.getElementById("filters");

  function loadTodos() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(function (t) {
          return t && typeof t.id === "string" && typeof t.text === "string";
        })
        .map(function (t) {
          return {
            id: t.id,
            text: t.text,
            completed: Boolean(t.completed)
          };
        });
    } catch (e) {
      return [];
    }
  }

  function saveTodos() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
  }

  function createTodo(text) {
    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      text: text,
      completed: false
    };
  }

  function addTodo(text) {
    state.todos.unshift(createTodo(text));
    saveTodos();
    render();
  }

  function updateTodo(id, updates) {
    var todo = state.todos.find(function (t) { return t.id === id; });
    if (!todo) return;
    Object.assign(todo, updates);
    saveTodos();
    render();
  }

  function deleteTodo(id) {
    state.todos = state.todos.filter(function (t) { return t.id !== id; });
    if (state.editingId === id) state.editingId = null;
    saveTodos();
    render();
  }

  function clearCompleted() {
    state.todos = state.todos.filter(function (t) { return !t.completed; });
    saveTodos();
    render();
  }

  function setFilter(filter) {
    if (filter !== "all" && filter !== "active" && filter !== "completed") return;
    state.filter = filter;
    render();
  }

  function visibleTodos() {
    switch (state.filter) {
      case "active":
        return state.todos.filter(function (t) { return !t.completed; });
      case "completed":
        return state.todos.filter(function (t) { return t.completed; });
      default:
        return state.todos.slice();
    }
  }

  function buildItem(todo) {
    var li = document.createElement("li");
    li.className = "todo-item" + (todo.completed ? " completed" : "");
    li.dataset.id = todo.id;

    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo-checkbox";
    checkbox.checked = todo.completed;
    checkbox.setAttribute("aria-label", "Mark \"" + todo.text + "\" complete");
    li.appendChild(checkbox);

    if (state.editingId === todo.id) {
      var editInput = document.createElement("input");
      editInput.type = "text";
      editInput.className = "todo-edit-input";
      editInput.value = todo.text;
      editInput.maxLength = 120;
      editInput.setAttribute("aria-label", "Edit task");
      li.appendChild(editInput);
      editInput.focus();
      editInput.select();
    } else {
      var span = document.createElement("span");
      span.className = "todo-text";
      span.textContent = todo.text;
      li.appendChild(span);
    }

    var actions = document.createElement("div");
    actions.className = "todo-actions";

    var editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "icon-btn edit";
    editBtn.textContent = "Edit";
    editBtn.setAttribute("aria-label", "Edit \"" + todo.text + "\"");
    actions.appendChild(editBtn);

    var delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "icon-btn delete";
    delBtn.textContent = "Delete";
    delBtn.setAttribute("aria-label", "Delete \"" + todo.text + "\"");
    actions.appendChild(delBtn);

    li.appendChild(actions);
    return li;
  }

  function render() {
    list.textContent = "";
    var todos = visibleTodos();

    var fragment = document.createDocumentFragment();
    todos.forEach(function (todo) {
      fragment.appendChild(buildItem(todo));
    });
    list.appendChild(fragment);

    emptyState.hidden = state.todos.length > 0;
    emptyState.textContent =
      state.filter === "all"
        ? "No tasks here. Add one above to get started!"
        : state.filter === "active"
          ? "No active tasks. You're all caught up!"
          : "No completed tasks yet.";

    updateItemsLeft();
    updateFilterButtons();
    updateClearCompleted();
  }

  function updateItemsLeft() {
    var count = state.todos.filter(function (t) { return !t.completed; }).length;
    itemsLeft.textContent = count + (count === 1 ? " item left" : " items left");
  }

  function updateFilterButtons() {
    Array.prototype.forEach.call(
      filtersEl.querySelectorAll(".filter-btn"),
      function (btn) {
        var active = btn.dataset.filter === state.filter;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      }
    );
  }

  function updateClearCompleted() {
    clearCompletedBtn.hidden = !state.todos.some(function (t) { return t.completed; });
  }

  function commitEdit(input, id) {
    var text = input.value.trim();
    if (text) {
      updateTodo(id, { text: text });
    } else {
      deleteTodo(id);
    }
    state.editingId = null;
    render();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    addTodo(text);
    input.value = "";
    input.focus();
  });

  list.addEventListener("change", function (e) {
    var checkbox = e.target.closest(".todo-checkbox");
    if (!checkbox) return;
    var li = checkbox.closest(".todo-item");
    updateTodo(li.dataset.id, { completed: checkbox.checked });
  });

  list.addEventListener("click", function (e) {
    var li = e.target.closest(".todo-item");
    if (!li) return;
    var id = li.dataset.id;

    if (e.target.closest(".delete")) {
      deleteTodo(id);
      return;
    }

    if (e.target.closest(".edit")) {
      state.editingId = id;
      render();
    }
  });

  list.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== "Escape") return;
    var editInput = e.target.closest(".todo-edit-input");
    if (!editInput) return;
    var li = editInput.closest(".todo-item");
    var id = li.dataset.id;

    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit(editInput, id);
    } else {
      state.editingId = null;
      render();
    }
  });

  filtersEl.addEventListener("click", function (e) {
    var btn = e.target.closest(".filter-btn");
    if (!btn) return;
    setFilter(btn.dataset.filter);
  });

  clearCompletedBtn.addEventListener("click", clearCompleted);

  render();
})();
